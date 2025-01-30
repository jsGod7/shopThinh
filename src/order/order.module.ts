import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from 'src/cart/entities/cart.entity';
import { Discount } from 'src/discount/entities/discount.entity';
import { Product } from 'src/product/entities/product.entity';
import { CartProduct } from 'src/cart/entities/cartProduct.entity';
import { User } from 'src/user/entities/user.entity';
import { OrderProduct } from './entities/orderProduct.entity';
import { Order } from './entities/order.entity';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports:[TypeOrmModule.forFeature([Cart,Discount , Product , User , OrderProduct , Order]),RedisModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports:[OrderService]
})
export class OrderModule {}
