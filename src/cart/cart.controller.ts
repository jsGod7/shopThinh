import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post(':userId/add')
  async addToCart(
    @Param('userId') userId:number,
    @Body() productData:CreateCartDto
  ) {
    return this.cartService.addToCart(userId,productData)
  }
  @Get(':userId')
  async getCartByUserId(@Param('userId')userId:number) {
    return await this.cartService.getCartByUserId(userId)
  }

  @Delete(':userId')
  async deleteItemInCart(@Param('userId')userId:number , @Body() productId:number){
    return this.cartService.deleteItemInCart(userId,productId)
  }
  @Patch(':userId/update') 
  async updateCart(
    @Param('userId')userId:number,
    @Body()shopOrderIds:any
  ) {
    try {
      console.log(shopOrderIds)
      const rs = await this.cartService.updateCart(userId,shopOrderIds)
      
      return rs
    } catch (error) {
      if(error instanceof NotFoundException || error instanceof BadRequestException)
        throw error
      throw new InternalServerErrorException()      
    }
    
  }
 
 
}
