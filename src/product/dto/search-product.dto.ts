// src/product/dto/search-product.dto.ts
import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ProductType } from 'src/util/common/product.type.enum';

export class SearchProductDto {
  @IsOptional()
  @IsString()
  product_name?: string;

  @IsOptional()
  @IsEnum(ProductType)
  product_type?: ProductType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  min_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
