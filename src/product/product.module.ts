import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Electronic } from './entities/subEntities/electronic.entity';
import { Furniture } from './entities/subEntities/furniture.entity';
import { Clothing } from './entities/subEntities/clothing.entity';
import { ElectronicStrategy } from './pattern/electronic.strategy';
import { ClothingStrategy } from './pattern/clothing.strategy';
import { FurnitureStrategy } from './pattern/furniture.strategy';
import { Product } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductStrategyFactory } from './pattern/product-strategy.factory';
import { ProductService } from './product.service';
import { StrategyFactoryService } from './pattern/updateProduct/strategy-factory..updateProduct.service';
import { Inventory } from 'src/inventory/entities/inventory.entity';


@Module({
  imports:[TypeOrmModule.forFeature([Product, Electronic, Furniture, Clothing , Inventory])
],
  controllers: [ProductController],
  providers: [ProductStrategyFactory , ElectronicStrategy , ClothingStrategy , FurnitureStrategy ,ProductService,StrategyFactoryService],
  exports:[ProductStrategyFactory]
})
export class ProductModule {}