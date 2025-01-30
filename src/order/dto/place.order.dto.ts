import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";

export class OrderPlaceDto {
    @IsNotEmpty()
  @IsNumber()
  userId: number; // ID người dùng

  @IsNotEmpty()
  @IsNumber()
  cartId: number; // ID giỏ hàng

  @IsOptional()
  @IsString()
  discountCode?: string; // Mã giảm giá nếu có

  @IsObject()
  @IsOptional()
  shippingInfo?: {

    
    address: string;

    phoneNumber: string;

    deliveryMethod: 'standard' | 'express' | 'same-day';

    shippingCost: number;

    estimatedDeliveryDate: string; // Định dạng YYYY-MM-DD

    trackingNumber: string;

    trackingUrl: string;

    carrier: 'VNPost' | 'Giao Hàng Nhanh' | 'Viettel Post';

    status: 'processing' | 'shipped' | 'delivered' | 'failed';

    instructions?: string; // Các yêu cầu đặc biệt
  };
}