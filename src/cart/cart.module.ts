import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Product } from 'src/product/entities/product.entity';
import { CartProduct } from './entities/cartProduct.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Cart,Product,CartProduct])],
  controllers: [CartController],
  providers: [CartService],
  exports:[CartService]
})
export class CartModule {}
