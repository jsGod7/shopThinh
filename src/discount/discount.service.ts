import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Discount } from './entities/discount.entity';
import { Code, In, Repository } from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { NotFoundError } from 'rxjs';
import { DsicountAppliesTo } from 'src/util/common/discount.type.enum';
import { Product } from 'src/product/entities/product.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DiscountUsageHistory } from './entities/discountUsageHistory.entity';
import { BadRequest, NotFound } from 'src/util/handleError/handleError';

@Injectable()
export class DiscountService {
  
  constructor(
              @InjectRepository(Discount) 
              private readonly discountRepository:Repository<Discount>,
              @InjectRepository(User) private readonly userRepository:Repository<User>,
              @InjectRepository(Product) private readonly  productRepository:Repository<Product>,
              @Inject(CACHE_MANAGER) private cacheManager:Cache,
              @InjectRepository(DiscountUsageHistory) private readonly discountUsageHistory:Repository<DiscountUsageHistory>

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

  async updateDiscount(discountId:number,payload:CreateDiscountDto) {
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
    if(discount_start_date && discount_end_date) {
      if(new Date(discount_start_date) > new Date(discount_end_date))
        throw new BadRequestException('Invalid start date or end date')
    }
    if(discount_code) {
      const foundDiscount = await this.discountRepository.findOne({
        where:{
          discount_code,
          discount_user:{id:discount_user},
          id:discountId
        }
      })
      if(foundDiscount && foundDiscount.discount_is_active) {
        throw new BadRequestException('Discount code already exists and is active')
      }
      let updateData :Partial<Discount>= {
        ...(discount_name && { discount_name: discount_name }),
        ...(discount_description && { discount_description: discount_description }),
        ...(discount_code && { discount_code: discount_code }),
        ...(discount_value && { discount_value: discount_value }),
        ...(discount_min_order_value !== undefined && { discount_min_order_value: discount_min_order_value }),
        ...(discount_max_value && { discount_max_value: discount_max_value }),
        ...(discount_start_date && { discount_start_date: new Date(discount_start_date) }),
        ...(discount_end_date && { discount_end_date: new Date(discount_end_date) }),
        ...(discount_max_uses && { discount_max_uses: discount_max_uses }),
        ...(discount_max_uses_per_users && { discount_max_uses_per_user:          discount_max_uses_per_users }),
        ...(discount_is_active !== undefined && { discount_is_active: discount_is_active }),
        ...(discount_applies_to && { discount_applies_to: discount_applies_to }),
        ...(discount_applies_to === 'specific' && discount_product_ids && { discount_product_ids: discount_product_ids }),
      };
      updateData = this.removeUndefinedObject(updateData)
      const updateDiscount = await this.discountRepository.findOne({
        where:{id:discountId}
      })
      if(!updateDiscount) throw new BadRequestException('Disocunt not found')
      Object.assign(updateDiscount,updateData)
      return this.discountRepository.save(updateDiscount)

    }

  }
  async getAllDiscountCodeWithProduct({
    code,
    userId,
    limit=10,
    page=1
  }: {
    code: any;
    userId: any;
    limit?: number;
    page?: number;}
  ):Promise<any> {
    const cacheKey = `discount:${code}:user:${userId}:page:${page}:limit:${limit}`;
    
    // Kiểm tra trong cache
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      console.log('Cache hit');
      return cachedData;
    }

    const foundDiscount = await this.discountRepository.findOne({
      where:{
        discount_code:code,
        discount_user:{id:userId}
      }
    })
    if(!foundDiscount || !foundDiscount.discount_is_active) throw new NotFoundException('Discount not found')
    const {discount_applies_to,discount_product_ids} = foundDiscount
    let products ;
    if(discount_applies_to === DsicountAppliesTo.ALL) {
      products = await this.productRepository.find({
        where:{
          user:{id:userId},
          isPublished: true,
        },
        take:limit,
        skip:(page - 1 ) * limit ,
        order:{createdAt:'DESC'},
        select:['id','product_name']
      })
    }
    if(discount_applies_to === DsicountAppliesTo.SPECIFIC) {
      products = await this.productRepository.find({
        where: {
          id: In(discount_product_ids),
          isDraft: true,
        },
        take: limit,
        skip: (page - 1) * limit,
        order:{createdAt:'DESC'},
        select: ['id', 'product_name'],
      });
      
      
    }
    if(!products || products.length === 0 ) throw new NotFoundException('no Product found for the given discount')
    await this.cacheManager.set(cacheKey,products,300)
    return products
  }
  async deleteDiscountCode({userId,codeId}:{userId:number,codeId:string}) {
    const deleteDiscount = await this.discountRepository.findOne({
      where:{
        discount_code:codeId,
        discount_user:{id:userId}
      }
    })
    if(!deleteDiscount) throw new NotFoundException('Discount not found')
    await this.discountRepository.remove(deleteDiscount)
  return {
    success:true,
    deleteDiscount
  }
    
  }
  async getDiscountAmount({
    codeId,
    userId,
    products = [],
  }: {
    codeId: string;
    userId: number;
    products: { id:number,quantity: number; price: number }[];
  }) {
      if(!Array.isArray(products) || products.length === 0 ) 
        throw new BadRequest()
      const cacheKey = `discount_${codeId}_${userId}`
      
      let foundDiscount:Discount = await this.cacheManager.get(cacheKey)
      if(!foundDiscount) {
        foundDiscount = await this.discountRepository.findOne({
          where:{discount_code:codeId,
            discount_user:{id:userId}
          }
        })
      }
      if(!foundDiscount) 
        throw new NotFoundException('Discount does not exists')
      await this.cacheManager.set(cacheKey,foundDiscount,300)

      const {
        discount_is_active,
        discount_max_uses,
        discount_min_order_value,
        discount_users_used,
        discount_value,
        discount_start_date,
        discount_type,
        discount_max_uses_per_users,
        discount_end_date,
        discount_product_ids,
        discount_max_value,
      } = foundDiscount;
      if (!discount_is_active) throw new BadRequestException('Discount is inactive');

      // Kiểm tra số lần sử dụng tối đa
      if (discount_max_uses <= foundDiscount.discount_uses_count) throw new BadRequestException('Discount has reached its usage limit');
      const now = new Date();
      if (now < discount_start_date || now > discount_end_date) {
        throw new BadRequestException('Discount is not valid at this time');
      }

      // Tính tổng giá trị đơn hàng
      
      let applicableProducts = products;
      if (foundDiscount.discount_applies_to === DsicountAppliesTo.SPECIFIC) {
        applicableProducts = products.filter(product =>
          discount_product_ids.includes(product.id.toString()),
        );
    
        if (applicableProducts.length === 0) {
          throw new BadRequestException('No products eligible for this discount');
        }
      }
      const totalOrder = applicableProducts.reduce(
        (acc, product) => acc + product.price * product.quantity,
        0,
      );
      if(totalOrder > BigInt(Number.MAX_SAFE_INTEGER)) 
        throw new BadRequest()
    
      // Kiểm tra giá trị đơn hàng tối thiểu
      if (totalOrder < discount_min_order_value) {
        throw new BadRequestException(
          `Order value must be at least ${discount_min_order_value} to use this discount`,
        );
      }
      const userUsageCount = discount_users_used.filter(
        user => user === userId.toString(),
      ).length;
      // if (userUsageCount >= discount_max_uses_per_users) {
      //   throw new BadRequestException(
      //     `You have reached the maximum usage limit for this discount`,
      //   );
      // }
      let discountAmount = 0;
      if (discount_type === 'fixed_amount') {
        discountAmount = discount_value;
      } else if (discount_type === 'percentage') {
        discountAmount = totalOrder * (discount_value / 100);
      }
      if (discount_max_value && discountAmount > discount_max_value) {
        discountAmount = discount_max_value;
      }
    
      const totalPrice = totalOrder - discountAmount;
      foundDiscount.discount_uses_count += 1;
      foundDiscount.discount_users_used.push(userId.toString());
      await this.discountRepository.save(foundDiscount);
      await this.discountUsageHistory.save({
        discount:foundDiscount,
        user:{id:userId} as any,
        discount_amount:discountAmount,
        order_total:totalOrder
      })
      return {
        totalOrder,
        discount: discountAmount,
        totalPrice,
      };
  }
  async cancelDiscountCode({codeId,userId}) {
    const discount = await this.foundDiscount({codeId,userId})
    if(!discount) throw new NotFound()
    const userIndex = (await discount).discount_users_used.indexOf(userId)
    if(userIndex === -1) throw new NotFound()
    discount.discount_users_used.splice(userIndex,1)
    discount.discount_max_uses +=1
    discount.discount_uses_count -=1
    await this.discountRepository.save(discount)
    return {
      success:true,
      updatedDiscount:discount
    }

  }

  
  private removeUndefinedObject(obj: Record<string, any>): Record<string, any> {
      if (obj === null || typeof obj !== 'object') return obj;
    
      const cleanedObj = Object.keys(obj).reduce((acc, key) => {
        if (obj[key] !== undefined) {
          acc[key] = obj[key];
        }
        return acc;
      }, {});
    
      return cleanedObj;
    }
  private  async foundDiscount({codeId,userId}) {
    const discount = await this.discountRepository.findOne({
      where:{discount_code:codeId,discount_user:{id:userId}}
    })
    return discount
  }


    
}
