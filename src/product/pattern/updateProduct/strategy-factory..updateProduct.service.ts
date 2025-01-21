import { BadRequestException, Injectable } from "@nestjs/common";
import { ProductType } from "src/util/common/product.type.enum";
import { BaseStrategy } from "../base-update.strategy";
import { ElectronicStrategy } from "../electronic.strategy";
import { ElectronicStrategyUpdate } from "./electronic.strategy.updateProduct";
import { ClothingStrategyUpdate } from "./clothing.strategy.updateProduct";
import { FurnitureStrategyUpdate } from "./furniture.strategy.updateProduct";

@Injectable()
export class StrategyFactoryService {
    createStrategy(productType:ProductType):BaseStrategy {
        switch(productType)  {
            case ProductType.ELECTRONIC: {
                return new ElectronicStrategyUpdate();
            }
            case ProductType.CLOTHING: {
                return new ClothingStrategyUpdate()

            }
            case ProductType.FURNITURE: {
                return new FurnitureStrategyUpdate()
            }
            default: 
                throw new BadRequestException('Unsupported product type')
        }
    }
}