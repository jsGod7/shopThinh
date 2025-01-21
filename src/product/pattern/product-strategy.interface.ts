import { CreateProductDto } from "../dto/create-product.dto";

export interface ProductStrategy {
    createProduct(dto:CreateProductDto):Promise<any>
}