import { IsArray, IsNumber } from 'class-validator';

export class UpdateCartDto {
  @IsArray()
  shop_order_ids: Array<{
    item_products: Array<{
      productId: number;
      quantity: number;
      old_quantity: number;
    }>;
  }>;
}
