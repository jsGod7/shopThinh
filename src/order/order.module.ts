import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from 'src/cart/entities/cart.entity';
import { Discount } from 'src/discount/entities/discount.entity';
import { Product } from 'src/product/entities/product.entity';
import { CartProduct } from 'src/cart/entities/cartProduct.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Cart,Discount])],
  controllers: [OrderController],
  providers: [OrderService],
  exports:[OrderService]
})
export class OrderModule {}
