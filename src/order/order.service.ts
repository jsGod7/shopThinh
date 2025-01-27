import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cart } from 'src/cart/entities/cart.entity';
import { Discount } from 'src/discount/entities/discount.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CheckoutReviewDto } from './dto/checkout.order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Discount) private readonly discountRepository: Repository<Discount>,
  ) {}

  async checkoutReview(payload: CheckoutReviewDto) {
    const { userId, cartId, discountCode } = payload;

    // 1. Kiểm tra giỏ hàng
    const cart = await this.cartRepository.findOne({
      where: { id: cartId, user: { id: userId } },
      relations: ['cartProducts', 'cartProducts.product'], // Lấy sản phẩm trong giỏ
    });

    if (!cart || cart.cartProducts.length === 0) {
      throw new NotFoundException('Giỏ hàng không tồn tại hoặc rỗng');
    }

    // 2. Tính tổng tiền trong giỏ hàng
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

    // 3. Kiểm tra mã giảm giá nếu có
    let discountValue = 0;
    if (discountCode) {
      const discount = await this.discountRepository.findOne({
        where: { discount_code: discountCode, discount_is_active: true },
      });

      if (!discount) {
        throw new BadRequestException('Mã giảm giá không hợp lệ');
      }

      // Kiểm tra điều kiện áp dụng mã giảm giá
      if (totalPrice < discount.discount_min_order_value) {
        throw new BadRequestException('Giá trị đơn hàng không đạt điều kiện áp dụng mã giảm giá');
      }

      // Tính giá trị giảm giá
      discountValue =
        discount.discount_type === 'fixed_amount'
          ? discount.discount_value
          : (totalPrice * discount.discount_value) / 100;

      // Giới hạn mức giảm giá tối đa
      if (discount.discount_max_value) {
        discountValue = Math.min(discountValue, discount.discount_max_value);
      }
    }

    // 4. Tính tổng tiền sau giảm giá
    const totalCheckout = totalPrice - discountValue;

    // 5. Trả về dữ liệu
    return {
      cartItems,
      totalPrice,
      discountValue,
      totalCheckout,
    };
  }
}
