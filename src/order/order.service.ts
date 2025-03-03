import { Injectable, NotFoundException, BadRequestException, OnModuleInit, ConflictException } from '@nestjs/common';
import { Cart } from 'src/cart/entities/cart.entity';
import { Discount } from 'src/discount/entities/discount.entity';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CheckoutReviewDto } from './dto/checkout.order.dto';
import { OrderProduct } from './entities/orderProduct.entity';
import { Order } from './entities/order.entity';
import { Product } from 'src/product/entities/product.entity';
import { OrderPlaceDto } from './dto/place.order.dto';
import { User } from 'src/user/entities/user.entity';
import { RedisService } from 'src/redis/redis.service';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { NotFound } from 'src/util/handleError/handleError';
import { CartProduct } from 'src/cart/entities/cartProduct.entity';

@Injectable()
export class OrderService  implements OnModuleInit{
  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Discount) private readonly discountRepository: Repository<Discount>,
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderProduct) private readonly orderProductRepository: Repository<OrderProduct>,
    @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly amqpConnection:AmqpConnection,
    private readonly dataSource:DataSource,
    private readonly redisService:RedisService

  ) {
    console.log('📡 Kết nối RabbitMQ:', amqpConnection ? 'Thành công' : 'Thất bại');

  }
  async sync() {
    const product  = await this.productRepository.find()
    for(const item of product) {
      await this.redisService.client.set(`inventory:${item.id}`,item.product_quantity)

    }
    console.log('✅ Synchronized inventory data to Redis')

  }
  onModuleInit() {
    this.sync()  
  }
  
  async orderPlace(payload: OrderPlaceDto) {
    const { userId, cartId, discountCode, shippingInfo } = payload;

    return this.dataSource.transaction(async (manager) => {
        const user = await manager.findOne(User, { where: { id: userId }, select: ['id', 'email'] });
        if (!user) throw new NotFoundException('Người dùng không tồn tại');

        const cart = await manager.findOne(Cart, {
            where: { id: cartId, user: { id: userId } },
            relations: ['cartProducts', 'cartProducts.product'],
        });
        if (!cart || cart.cartProducts.length === 0) throw new NotFoundException('Giỏ hàng trống');

        const cartItems = cart.cartProducts.map((item) => ({
            productId: item.product.id,
            productName: item.product.product_name,
            quantity: item.quantity,
            price: item.product.product_price,
        }));

        let totalPrice = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

        let discountValue = 0;
        if (discountCode) {
            const discount = await manager.findOne(Discount, { where: { discount_code: discountCode, discount_is_active: true } });
            if (!discount) throw new BadRequestException('Mã giảm giá không hợp lệ');

            discountValue = discount.discount_type === 'fixed_amount'
                ? discount.discount_value
                : (totalPrice * discount.discount_value) / 100;

            discountValue = Math.min(discountValue, discount.discount_max_value || discountValue);

            discount.discount_is_active = false;
            await manager.save(discount);
        }

        const totalCheckout = totalPrice - discountValue;

        for (const item of cartItems) {
            const key = `inventory:${item.productId}`;
            await this.redisService.client.watch(key);
            const stock = await this.redisService.client.get(key);
            const availableStock = stock ? parseInt(stock) : 0;

            console.log(availableStock, "avai")
            console.log(stock, "stock")
            if (availableStock < item.quantity) {
                await this.redisService.client.unwatch();
                throw new BadRequestException(`Sản phẩm ${item.productId} không đủ hàng`);
            }

            const newStock = availableStock - item.quantity;
            const result = await this.redisService.client
                .multi()
                .set(key, newStock)
                .exec();

            console.log('result',result)
            if (!result) {

                await this.redisService.client.unwatch()
                throw new ConflictException('Đã có lỗi khi cập nhật tồn kho, vui lòng thử lại');
            }

            console.log('chưa gửi data')
            await this.amqpConnection.publish(
                'inventory_exchange',
                'update_inventory',
                {
                    productId: item.productId,
                    quantity: item.quantity,
                }
            );
            console.log('đã gửi' ,{productId:item.productId,quantity:item.quantity})
            console.log('RabbitMQ status:', this.amqpConnection.managedConnection.isConnected);


        }

        const order = manager.create(Order, {
            user,
            totalPrice,
            status: 'pending',
            shippingInfo,
            trackingNumber: null,
        });
        const savedOrder = await manager.save(order);
        if(discountCode) {
          await this.amqpConnection.publish(
            'discount_exchange',
            'update_discount_usage',
            {discountCode,userId}
          )
        }


        await this.amqpConnection.publish(
            'notifications_exchange',
            'send_mail_createOrder',
            {
                userId: user.id,
                email: user.email,
                orderId: savedOrder.id,
                totalCheckout,
                status: savedOrder.status,
            }
        );

        
        await manager.createQueryBuilder()
        .delete()
        .from(CartProduct)
        .where('cartId = :cartId',{cartId})
        .execute()
        await manager.save(cart)

        return {
            orderId: savedOrder.id,
            totalPrice,
            discountValue,
            totalCheckout,
            status: savedOrder.status,
        };
    });
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

  const cartItems = cart.cartProducts.map((item) => ({
      productId: item.product.id,
      productName: item.product.product_name,
      quantity: item.quantity,
      price: item.product.product_price,
  }));

  let totalPrice = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

  // **Kiểm tra tồn kho bằng Redis**
  for (const item of cartItems) {
      const key = `inventory:${item.productId}`;
      await this.redisService.client.watch(key); // Theo dõi key tránh race condition
      const stock = await this.redisService.client.get(key);
      const availableStock = stock ? parseInt(stock) : 0;

      console.log(`Sản phẩm ${item.productId}: Tồn kho hiện tại: ${availableStock}, Cần: ${item.quantity}`);

      if (availableStock < item.quantity) {
          await this.redisService.client.unwatch();
          throw new BadRequestException(`Sản phẩm ${item.productId} không đủ hàng trong kho`);
      }

      await this.redisService.client.unwatch(); // Bỏ theo dõi sau khi kiểm tra xong
  }

  // **Kiểm tra mã giảm giá**
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

      // Gửi thông báo cập nhật mã giảm giá
      await this.amqpConnection.publish('discount_exchange', 'update_discount_usage', {
          discountId: discount.id,
          userID:userId,
      });
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
    const order = await this.orderRepository.findOne({
      where: { id: orderId  , status:'pending'},
      relations: ['orderProducts', 'orderProducts.product'],
    });
  
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${orderId}`);
    }
  
    console.log('Current order status before check:', order.status);
  
    if (order.status === 'delivered') {
      throw new BadRequestException('Không thể hủy đơn hàng đã giao');
    }
  
    if (order.status === 'cancelled') {
      console.log('Order is already cancelled, skipping cancellation process.');
      throw new BadRequestException('Đơn hàng đã hủy, không thể hủy lại');
    }
  
    order.status = 'cancelled';
    const updatedOrder = await this.orderRepository.save(order);
  
    console.log('Order status after update:', updatedOrder.status);
  
    for (const orderProduct of updatedOrder.orderProducts) {
      console.log('Order Product:', orderProduct);
  
      if (!orderProduct.product) {
        throw new BadRequestException(`Sản phẩm trong đơn hàng không hợp lệ`);
      }
  
      const product = await this.productRepository.findOne({
        where: { id: orderProduct.product.id },
      });
  
      if (!product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${orderProduct.product.id}`);
      }
  
      product.product_quantity += orderProduct.quantity;
      await this.productRepository.save(product);
    }
  
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
