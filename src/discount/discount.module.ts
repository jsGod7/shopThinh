import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discount } from './entities/discount.entity';
import { User } from 'src/user/entities/user.entity';
import { Product } from 'src/product/entities/product.entity';
import { RedisModule } from 'src/redis/redis.module';
import { DiscountUsageHistory } from './entities/discountUsageHistory.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Discount,User , Product,DiscountUsageHistory]),
  RedisModule
  ],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports:[DiscountService]
})
export class DiscountModule {}
