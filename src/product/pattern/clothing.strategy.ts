

// src/product/strategies/clothing.strategy.ts
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Clothing } from "../entities/subEntities/clothing.entity";
import { Product } from "../entities/product.entity";
import { CreateProductDto } from "../dto/create-product.dto";
import { ProductType } from "src/util/common/product.type.enum";
import { ProductStrategy } from "./product-strategy.interface";
import { Inventory } from "src/inventory/entities/inventory.entity";

@Injectable()
export class ClothingStrategy implements ProductStrategy {
  constructor(
    @InjectRepository(Clothing)
    private clothingRepository: Repository<Clothing>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository:Repository<Inventory>
  ) {}

  async createProduct(dto: CreateProductDto): Promise<any> {
    const product = this.productRepository.create({
      ...dto,
      product_type: ProductType.CLOTHING,
    });
    const saveProduct= await this.productRepository.save(product);

    const clothing = this.clothingRepository.create({
        id:saveProduct.id,
      ...dto.product_attributes,
      clothingProduct: product,
    });
    const saveItem = await this.clothingRepository.save(clothing);
    const inventory = this.inventoryRepository.create({
      inven_product:saveProduct,
      inven_stock:dto.product_quantity || 0 ,
      inven_location:dto.product_location || 'unknown'
    })
    await this.inventoryRepository.save(inventory)
    return saveItem

  }
}