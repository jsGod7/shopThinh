import { IsString, IsInt, IsBoolean, IsArray, IsEnum, IsDecimal, IsDate, IsOptional, IsNumber, isNumber } from 'class-validator';
import { User } from 'src/user/entities/user.entity';
import { DsicountAppliesTo } from 'src/util/common/discount.type.enum';


export class CreateDiscountDto {
  @IsString()
  discount_name: string;

  @IsNumber()
  discount_user:number

  @IsString()
  discount_description: string;

  @IsString()
  discount_type: string;

  @IsDecimal()
  discount_value: number;

  @IsString()
  discount_code: string;

  @IsDate()
  discount_start_date: Date;

  @IsDate()
  discount_end_date: Date;

  @IsInt()
  discount_max_uses: number;

  @IsOptional()
  @IsInt()
  discount_uses_count?: number;

  @IsArray()
  discount_users_used: string[];

  @IsInt()
  discount_max_uses_per_users: number;

  @IsDecimal()
  discount_min_order_value: number;

  @IsBoolean()
  discount_is_active: boolean;

  @IsEnum(DsicountAppliesTo)
  discount_applies_to: DsicountAppliesTo;

  @IsArray()
  discount_product_ids: string[];

  @IsNumber()
  discount_max_value:number
}
