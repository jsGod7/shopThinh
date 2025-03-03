import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Electronic } from "../entities/subEntities/electronic.entity";
import { Repository } from "typeorm";
import { Product } from "../entities/product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { ProductType } from "src/util/common/product.type.enum";
import { ProductStrategy } from "./product-strategy.interface";
import { AmqpConnection } from "@golevelup/nestjs-rabbitmq";

@Injectable()
export class ElectronicStrategy implements ProductStrategy {
    constructor(
        @InjectRepository(Electronic) private readonly electronicRepository:Repository<Electronic>,
        @InjectRepository(Product) private readonly productRepository:Repository<Product>,
        private readonly anqoConnection:AmqpConnection
    ) {}
    async createProduct(dto: CreateProductDto): Promise<any> {
        const product = this.productRepository.create({
            ...dto,
            product_type:ProductType.ELECTRONIC
        })
        const saveProduct = await this.productRepository.save(product)
        const electronic = this.electronicRepository.create({
            id:saveProduct.id,
            ...dto.product_attributes,
            electroncProduct:product
        })
        const saveItem = await this.electronicRepository.save(electronic)
        await this.anqoConnection.publish('inventory_exchange','inventory_create',
            {
                productId: saveProduct.id,
                quantity: dto.product_quantity || 0,
                location: dto.product_location || "unknown",
            }
          ) 
        return saveItem
    }
    
    
}