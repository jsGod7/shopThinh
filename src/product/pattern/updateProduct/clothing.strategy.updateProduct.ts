import { UpdateProductDto } from "src/product/dto/update-product.dto";
import { Product } from "src/product/entities/product.entity";
import { BaseStrategy } from "../base-update.strategy";

export class ClothingStrategyUpdate extends BaseStrategy {
    update(product: Product, updateData: UpdateProductDto):Product {
        if(updateData.product_attribute) {
            product.product_attributes = 
            {
                ...product.product_attributes,
                ...updateData.product_attribute
            }
        }
        return {...product , ...updateData}
    }
}