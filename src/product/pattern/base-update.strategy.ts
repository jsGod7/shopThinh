import { UpdateProductDto } from "../dto/update-product.dto";
import { Product } from "../entities/product.entity";

export abstract class BaseStrategy {
    abstract update(product:Product,updateData:UpdateProductDto)
}