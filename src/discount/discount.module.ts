import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discount } from './entities/discount.entity';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/product/entities/product.entity';
import { RedisModule } from 'src/redis/redis.module';
import { DiscountUsageHistory } from './entities/discountUsageHistory.entity';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports:[TypeOrmModule.forFeature([Discount,User , Product,DiscountUsageHistory]),
  RedisModule,
  RabbitMQModule.forRoot({
    exchanges: [
      { name: 'discount_exchange', type: 'topic' },
    ],
    uri:'amqp://guest:guest@localhost:5672',
    enableControllerDiscovery:true,
  }) ,
  ],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports:[DiscountService]
})
export class DiscountModule {}
