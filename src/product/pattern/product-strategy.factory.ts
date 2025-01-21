import { Injectable } from "@nestjs/common";
import { ElectronicStrategy } from "./electronic.strategy";
import { FurnitureStrategy } from "./furniture.strategy";
import { ClothingStrategy } from "./clothing.strategy";
import { ProductType } from "src/util/common/product.type.enum";

@Injectable()
export class ProductStrategyFactory {
    constructor(
        private electronicStrategy:ElectronicStrategy,
        private furnitureStrategy:FurnitureStrategy,
        private clothingStrategy:ClothingStrategy
    ){}
    getStrategy(type:ProductType) {
        switch(type) {
            case ProductType.ELECTRONIC: {
                return this.electronicStrategy;
            }
            case ProductType.CLOTHING:{
                return this.clothingStrategy;
                
            }
            case ProductType.FURNITURE:{
                return this.furnitureStrategy
            }
            default:{
                throw new Error('Unsupported product type ' + type)
            }
            }
        }
    }