import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cart } from 'src/cart/entities/cart.entity';
import { Discount } from 'src/discount/entities/discount.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CheckoutReviewDto } from './dto/checkout.order.dto';
import { OrderProduct } from './entities/orderProduct.entity';
import { Order } from './entities/order.entity';
import { Product } from 'src/product/entities/product.entity';
import { OrderPlaceDto } from './dto/place.order.dto';
import { User } from 'src/user/entities/user.entity';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Discount) private readonly discountRepository: Repository<Discount>,
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderProduct) private readonly orderProductRepository: Repository<OrderProduct>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly redisService:RedisService

  ) {}
  async orderPlace(payload: OrderPlaceDto) {
    const { userId, cartId, discountCode, shippingInfo } = payload;
  
    // Bước 1: Kiểm tra giỏ hàng
    const cart = await this.cartRepository.findOne({
      where: { id: cartId, user: { id: userId } },
      relations: ['cartProducts', 'cartProducts.product'],
    });
  
    if (!cart || cart.cartProducts.length === 0) {
      throw new NotFoundException('Giỏ hàng không tồn tại hoặc rỗng');
    }
  
    // Bước 2: Tính tổng giá trị giỏ hàng
    const cartItems = cart.cartProducts.map((item) => {
      const { product, quantity } = item;
      const price = product.product_price;
      const totalItemPrice = price * quantity;
  
      return {
        productId: product.id,
        productName: product.product_name,
        quantity,
        price,
        totalItemPrice,
      };
    });
  
    const totalPrice = cartItems.reduce((acc, item) => acc + item.totalItemPrice, 0);
  
    let discountValue = 0;
    if (discountCode) {
      const discount = await this.discountRepository.findOne({
        where: { discount_code: discountCode, discount_is_active: true },
      });
  
      if (!discount) {
        throw new BadRequestException('Mã giảm giá không hợp lệ');
      }
  
      discountValue =
        discount.discount_type === 'fixed_amount'
          ? discount.discount_value
          : (totalPrice * discount.discount_value) / 100;
  
      if (discount.discount_max_value) {
        discountValue = Math.min(discountValue, discount.discount_max_value);
      }
  
      discount.discount_is_active = false;
      await this.discountRepository.save(discount);
    }
  
    const totalCheckout = totalPrice - discountValue;
  
    // Bước 3: Kiểm tra tồn kho và khóa
    for (const item of cartItems) {
      const isLocked = await this.redisService.lockProductStock(item.productId.toString());
      
      if (!isLocked) {
        throw new BadRequestException(
          `Sản phẩm "${item.productName}" đang được xử lý, vui lòng thử lại sau.`
        );
      }
  
      // Lấy tồn kho từ Redis và chuyển đổi thành kiểu số
      const availableStockStr = await this.redisService.getProductStock(item.productId.toString());
      const availableStock = parseInt(availableStockStr, 10); // Chuyển đổi thành số
  
      // Kiểm tra nếu tồn kho không đủ
      if (availableStock < item.quantity) {
        await this.redisService.unlockProductStock(item.productId.toString()); // Giải phóng khóa
        throw new BadRequestException(
          `Sản phẩm "${item.productName}" không đủ số lượng trong kho. Tồn kho hiện tại: ${availableStock}`
        );
      }
    }
  
    // Bước 4: Tạo đơn hàng
    const order = this.orderRepository.create({
      user: { id: userId },
      totalPrice,
      status: 'pending',
      shippingInfo: shippingInfo || {},
      trackingNumber: null,
    });
    const savedOrder = await this.orderRepository.save(order);
  
    // Bước 5: Lưu chi tiết đơn hàng và cập nhật tồn kho
    for (const item of cartItems) {
      const product = await this.productRepository.findOne({
        where: { id: item.productId },
      });
  
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm ID: ${item.productId}`);
      }
  
      const orderProduct = this.orderProductRepository.create({
        order: savedOrder,
        product,
        quantity: item.quantity,
        price: item.price,
      });
  
      await this.orderProductRepository.save(orderProduct);
  
      // Cập nhật lại tồn kho trong Redis
      const availableStockStr = await this.redisService.getProductStock(item.productId.toString());
      const availableStock = parseInt(availableStockStr, 10); // Chuyển đổi thành số
      const newStock = availableStock - item.quantity;
  
      // Cập nhật tồn kho mới trong Redis
      if (newStock < 0) {
        throw new BadRequestException(`Tồn kho không đủ cho sản phẩm "${item.productName}"`);
      }
  
      await this.redisService.updateProductStock(item.productId.toString(), newStock);
    }
  
    // Bước 6: Giải phóng khóa sản phẩm
    for (const item of cartItems) {
      await this.redisService.unlockProductStock(item.productId.toString());
    }
  
    // Bước 7: Xóa giỏ hàng
    cart.cartProducts = [];
    await this.cartRepository.save(cart);
  
    // Bước 8: Trả về kết quả
    return {
      orderId: savedOrder.id,
      totalPrice,
      discountValue,
      totalCheckout,
      status: savedOrder.status,
    };
  }
  
  
  async checkoutReview(payload: CheckoutReviewDto) {
    const { userId, cartId, discountCode } = payload;

    const cart = await this.cartRepository.findOne({
      where: { id: cartId, user: { id: userId } },
      relations: ['cartProducts', 'cartProducts.product'], 
    });

    if (!cart || cart.cartProducts.length === 0) {
      throw new NotFoundException('Giỏ hàng không tồn tại hoặc rỗng');
    }

    const cartItems = cart.cartProducts.map((item) => {
      const { product, quantity } = item;
      const price = product.product_price;
      const totalItemPrice = price * quantity;

      return {
        productId: product.id,
        productName: product.product_name,
        quantity,
        price,
        totalItemPrice,
      };
    });

    const totalPrice = cartItems.reduce((acc, item) => acc + item.totalItemPrice, 0);

    let discountValue = 0;
    if (discountCode) {
      const discount = await this.discountRepository.findOne({
        where: { discount_code: discountCode, discount_is_active: true },
      });

      if (!discount) {
        throw new BadRequestException('Mã giảm giá không hợp lệ');
      }

      if (totalPrice < discount.discount_min_order_value) {
        throw new BadRequestException('Giá trị đơn hàng không đạt điều kiện áp dụng mã giảm giá');
      }

      discountValue =
        discount.discount_type === 'fixed_amount'
          ? discount.discount_value
          : (totalPrice * discount.discount_value) / 100;

      if (discount.discount_max_value) {
        discountValue = Math.min(discountValue, discount.discount_max_value);
      }
    }

    const totalCheckout = totalPrice - discountValue;

    return {
      cartItems,
      totalPrice,
      discountValue,
      totalCheckout,
    };
  }
  async getAllOrder(orderId:number) {
    const order = await this.orderRepository.findOne({
      where:{id:orderId},
      
    })
    return order
  }
  async updateStatusOrder(orderId:number,status:string):Promise<Order> {
    const order = await this.orderRepository.findOne({where:{id:orderId}})
    if(!order) throw new NotFoundException('Order not found')
    const validStatus = ['pending', 'confirmed', 'shipped', 'cancelled', 'delivered']
    if(!validStatus.includes(status)) throw new BadRequestException('Invalid input')
    if(order.status === 'delivered' || order.status === 'shipped') throw new BadRequestException('Can not change status order')
    order.status = status
    const save = await this.orderRepository.save(order)
    return save
  }
  async cancelOrder(orderId: number) {
    // Tìm đơn hàng và load các quan hệ cần thiết
    const order = await this.orderRepository.findOne({
      where: { id: orderId  , status:'pending'},
      relations: ['orderProducts', 'orderProducts.product'],
    });
  
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    }
  
    // Log trạng thái đơn hàng trước khi kiểm tra
    console.log('Current order status before check:', order.status);
  
    // Kiểm tra trạng thái của đơn hàng
    if (order.status === 'delivered') {
      throw new BadRequestException('Không thể hủy đơn hàng đã giao');
    }
  
    if (order.status === 'cancelled') {
      console.log('Order is already cancelled, skipping cancellation process.');
      throw new BadRequestException('Đơn hàng đã hủy, không thể hủy lại');
    }
  
    // Cập nhật trạng thái đơn hàng thành 'cancelled'
    order.status = 'cancelled';
    const updatedOrder = await this.orderRepository.save(order);
  
    // Log trạng thái đơn hàng sau khi cập nhật
    console.log('Order status after update:', updatedOrder.status);
  
    // Hoàn lại hàng hóa vào kho (nếu cần thiết)
    for (const orderProduct of updatedOrder.orderProducts) {
      console.log('Order Product:', orderProduct); // Log để kiểm tra
  
      if (!orderProduct.product) {
        throw new BadRequestException(`Sản phẩm trong đơn hàng không hợp lệ`);
      }
  
      const product = await this.productRepository.findOne({
        where: { id: orderProduct.product.id },
      });
  
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${orderProduct.product.id}`);
      }
  
      // Cập nhật lại số lượng sản phẩm trong kho
      product.product_quantity += orderProduct.quantity;
      await this.productRepository.save(product);
    }
  
    // Trả về đơn hàng đã được cập nhật
    return updatedOrder;
  }
  
  
  
  async returnOrder(orderId:number , reason:string) {
    const order = await this.orderRepository.findOne({
      where:{id:orderId},
      relations: ['orderProducts', 'orderProducts.product'] 
    })
    if(!order) throw new NotFoundException('order not found')
    console.log(order.status, "1")
    if (order.status !== 'delivered') throw new BadRequestException('Đơn hàng chưa giao hoặc đã hủy, không thể trả lại');
    order.status = 'returned'
    order.returnReason =reason
    const updatedOrder = await this.orderRepository.save(order)
    console.log(updatedOrder.status,"2")
    for(const orderProduct of updatedOrder.orderProducts) {
      const product = await this.productRepository.findOne({
        where:{id:orderProduct.product.id}
      })
      product.product_quantity += orderProduct.quantity
      await this.productRepository.save(product)
    }
    return updatedOrder
    
  }
  async getOrderHistory(userId: number, page: number = 1, pageSize: number = 10) {
    const [orders, totalCount] = await this.orderRepository.findAndCount({
      where: { user: { id: userId } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
      relations: ['orderProducts', 'orderProducts.product'],
    });
  
    return {
      orders,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: page,
    };
  }
  
  
  
}
