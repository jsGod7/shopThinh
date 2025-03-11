import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException, UseInterceptors } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Discount } from './entities/discount.entity';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { BadRequest, NotFound } from 'src/util/handleError/handleError';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Controller('discount')
export class DiscountController {
  constructor(
    private readonly discountService: DiscountService,
    private readonly amqpConnection:AmqpConnection

  ) {}

  @Post('create')
  async createDiscountCode(@Body() payload: CreateDiscountDto) {
    try {
      const res = await this.amqpConnection.request({
        exchange: 'discount_exchange',
        routingKey: 'discount_create',
        payload: payload
      });
      console.log('Received response from discount service:', res);
      return res;
    } catch (error) {
      throw new BadRequestException('Failed to create discount: ' + error.message);
    }
  }
  @Patch(':id')
  async updateDiscount(
    @Param('id') discountId: number,
    @Body() payload: CreateDiscountDto,
  ){
   try {
    const res = await this.amqpConnection.request({
      exchange:'discount_exchange',
      routingKey:'discount_update',
      payload: {
        discountId,
        payloadDiscount: payload
      }
    })
    console.log('Received response from discount service:', res);
    return res;
    
   } catch (error) {
    throw new BadRequestException('Failed to create discount: ' + error.message);
    
   }
  }
  @Get('product')
  @UseInterceptors(CacheInterceptor)
  async getAllDiscountCodesWithProduct(
    @Query('code') code: string,
    @Query('userId') userId: number,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    if(!code || !userId) {
      throw new BadRequestException('Code and userId are required')
    }
    const limitValue = limit ? parseInt(limit,10) : 10
    const pageValue = page ? parseInt(limit,10) : 1
    const products = await this.discountService.getAllDiscountCodeWithProduct({code,userId,limit:limitValue,page:pageValue})
    return {
      success:true,
      metadata:products,
      
    }
  }
  @Post('amount')
  async getDiscountAmount(
    @Body() body: { codeId: string; userId: number; products: { id: number; quantity: number; price: number }[] }
  ) {
    const { codeId, userId, products } = body;

    if (!codeId || !userId || !Array.isArray(products) || products.length === 0) {
      throw new BadRequest()
    }
    return this.discountService.getDiscountAmount({
      codeId,
      userId,
      products,
    });
  }
  @Delete(':userId/:codeId')
  async deleteDiscountCode(
    @Param('userId') userId: number,
    @Param('codeId') codeId: string,
  ) {
    return this.discountService.deleteDiscountCode({ userId, codeId });
  }
 
  @UseInterceptors(CacheInterceptor)
  @Get('shop-discounts')
  async getAllDiscountCodesByShop(
    @Query('userId') userId: number,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    
    const limitValue = limit ? parseInt(limit,10) : 10
    const pageValue = page ? parseInt(limit,10) : 1
    return this.discountService.getAllDiscountCodesByShop({limit:limitValue,page:pageValue,userId})
  }
  @Patch(':codeId/:userId')
  async cancelDiscount(
    @Param('codeId') codeId:string,
    @Param('userId') userId:number
  ) {
    if(!userId || !codeId) throw new NotFound()
    return this.discountService.cancelDiscountCode({codeId,userId})
  }

  @Get(':codeId')
  @UseInterceptors(CacheInterceptor)
  async findOneDiscount(@Param('codeId') codeId:string) {
    const res = await this.discountService.findOneDiscount(codeId)
    return res
  }

  
}
