import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discount } from './entities/discount.entity';
import { User } from 'src/user/entities/user.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Discount,User])],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports:[DiscountService]
})
export class DiscountModule {}
