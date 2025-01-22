import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException, UseInterceptors } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Discount } from './entities/discount.entity';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { BadRequest } from 'src/util/handleError/handleError';

@Controller('discount')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post('create')
  async createDiscountCode(@Body() payload:CreateDiscountDto):Promise<Discount> {
    return this.discountService.createDiscountCode(payload)
  }
  @Patch(':id')
  async updateDiscount(
    @Param('id') discountId: number,
    @Body() payload: CreateDiscountDto,
  ):Promise<Discount> {
    return this.discountService.updateDiscount(discountId, payload);
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

  
}
