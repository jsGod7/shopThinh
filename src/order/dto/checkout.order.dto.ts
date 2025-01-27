import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckoutReviewDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number; // ID của người dùng thực hiện checkout

  @IsNotEmpty()
  @IsNumber()
  cartId: number; // ID của giỏ hàng

  @IsOptional()
  @IsString()
  discountCode?: string; // Mã giảm giá nếu có
}
