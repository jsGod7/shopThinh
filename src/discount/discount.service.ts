import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Discount } from './entities/discount.entity';
import { Code, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { NotFoundError } from 'rxjs';

@Injectable()
export class DiscountService {
  
  constructor(@InjectRepository(Discount) private readonly discountRepository:Repository<Discount>,
              @InjectRepository(User) private readonly userRepository:Repository<User>
  ){}
  async createDiscountCode(payload:CreateDiscountDto) {
    const 
    {
      discount_name,
      discount_user,
      discount_description,
      discount_type,
      discount_value,
      discount_end_date,
      discount_start_date,
      discount_code,
      discount_max_uses,
      discount_uses_count,
      discount_users_used,
      discount_max_uses_per_users,
      discount_min_order_value,
      discount_is_active,
      discount_applies_to,
      discount_product_ids,
      discount_max_value

    } = payload
    if (new Date() < new Date(discount_start_date) || new Date() > new Date(discount_end_date)) {
      throw new BadRequestException('Invalid start date or end date');
    }
    if (new Date(discount_start_date) > new Date(discount_end_date)) {
      throw new BadRequestException('Start date cannot be after end date');
    }
    const foundDiscount = await this.discountRepository.findOne({
      where:{
        discount_code,
        discount_user:{id:discount_user}
      }
    })
    if(foundDiscount) throw new BadRequestException('Discount code already exists for this shop')
    const user = await this.userRepository.findOne({where:{id:discount_user}})
    if(!user) throw new NotFoundException('User does not exist')
    const discount = this.discountRepository.create({
      discount_code,
      discount_start_date,
      discount_end_date,
      discount_is_active,
      discount_user:user,
      discount_min_order_value,
      discount_product_ids:discount_applies_to ==='all' ? [] : discount_product_ids,
      discount_applies_to,
      discount_name,
      discount_description,
      discount_type,
      discount_value,
      discount_max_value,
      discount_max_uses,
      discount_uses_count,
      discount_max_uses_per_users,
      discount_users_used,
      
    })
    return this.discountRepository.save(discount)
  }
}
