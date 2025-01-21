
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Electronic } from "../entities/subEntities/electronic.entity";
import { Repository } from "typeorm";
import { Furniture } from "../entities/subEntities/furniture.entity";
import { ProductType } from "src/util/common/product.type.enum";
import { CreateProductDto } from "../dto/create-product.dto";
import { Product } from "../entities/product.entity";
import { ProductStrategy } from "./product-strategy.interface";
import { Inventory } from "src/inventory/entities/inventory.entity";
import { scan } from "rxjs";

@Injectable()
export class FurnitureStrategy implements ProductStrategy {
    constructor(
        @InjectRepository(Furniture) private readonly electronicRepository:Repository<Furniture>,
        @InjectRepository(Product) private readonly productRepository:Repository<Product>,
        @InjectRepository(Inventory) private readonly inventoryRepository:Repository<Inventory>
    ) {}
    async createProduct(dto: CreateProductDto): Promise<any> {
        const product = this.productRepository.create({
            ...dto,
            product_type:ProductType.FURNITURE
        })
        const saveProduct = await this.productRepository.save(product)
        const furniture = this.electronicRepository.create({
            id:saveProduct.id,
            ...dto.product_attributes,
            furnitureProduct:product
        })
        const saveItem = await this.electronicRepository.save(furniture)
        const inventory = this.inventoryRepository.create({
            inven_product:saveProduct,
            inven_stock:dto.product_quantity || 0 ,
            inven_location:dto.product_location || 'unknown'
          })
          await this.inventoryRepository.save(inventory)
        return saveItem
    }
    
}