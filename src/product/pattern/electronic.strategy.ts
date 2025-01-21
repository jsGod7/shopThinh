import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Electronic } from "../entities/subEntities/electronic.entity";
import { Repository } from "typeorm";
import { Product } from "../entities/product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { ProductType } from "src/util/common/product.type.enum";
import { ProductStrategy } from "./product-strategy.interface";
import { Inventory } from "src/inventory/entities/inventory.entity";

@Injectable()
export class ElectronicStrategy implements ProductStrategy {
    constructor(
        @InjectRepository(Electronic) private readonly electronicRepository:Repository<Electronic>,
        @InjectRepository(Product) private readonly productRepository:Repository<Product>,
        @InjectRepository(Inventory) private readonly inventoryRepository:Repository<Inventory>
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
        const inventory = this.inventoryRepository.create({
            inven_product:saveProduct,
            inven_stock:dto.product_quantity || 0 ,
            inven_location:dto.product_location || 'unknown'
          })
          await this.inventoryRepository.save(inventory)
        return saveItem
    }
    
    
}