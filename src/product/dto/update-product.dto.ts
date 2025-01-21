import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { ProductType } from 'src/util/common/product.type.enum';
import { IsEnum, IsNumber, IsObject, IsString, isString } from 'class-validator';

export class UpdateProductDto {
    @IsString()
    product_name?:string
    
    @IsString()
    
    product_thumb?:string
    
    @IsString()
    product_description?:string
    
    @IsNumber()
    product_price?:number

    @IsNumber()
    product_quantity?:number

    @IsEnum(ProductType)
    product_type?:ProductType

    @IsObject()
    product_attribute?:Record<string,any>
}
