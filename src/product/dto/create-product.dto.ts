// src/product/dto/create-product.dto.ts
import { IsEnum, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';
import { ProductType } from 'src/util/common/product.type.enum';

export class CreateProductDto {
  @IsNotEmpty()
  product_name: string;

  @IsOptional()
  product_description?: string;

  @IsNotEmpty()
  product_price: number;

  @IsNotEmpty()
  product_quantity: number;

  
  product_type: ProductType;

  @IsUUID()
  product_shop: string;

  product_location?:string

  @ValidateNested()
  @Type(() => Object)
  product_attributes: Record<string, any>;
}