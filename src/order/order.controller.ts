import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, Query, Res } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutReviewDto } from './dto/checkout.order.dto';
import { OrderPlaceDto } from './dto/place.order.dto';
import { ReturnOrderDto } from './dto/return.order.dto';
import { Order } from './entities/order.entity';
import { Response } from 'express';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout-review')
  async checkoutReview(@Body() payload:CheckoutReviewDto) {
    try {
      const rs = await this.orderService.checkoutReview(payload)
      return rs
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }
  @Post('order-place')
  async orderPlace(@Body()payload :OrderPlaceDto) {

    return this.orderService.orderPlace(payload)
  }
 
  @Get(':orderId')
  async getOrder(@Param('orderId')orderId:number):Promise<Order> {
    return await this.orderService.getAllOrder(orderId)
  }
  @Get(':userId')
  async getOrderHistory(@Param('userId') userId:number , @Query('limit') limit:string , @Query('page') page:string , @Res() res:Response) {
    const limitValue = limit ? parseInt(limit,10) : 10
    const pageValue = page ? parseInt(page,10) : 1
    const order = await this.orderService.getOrderHistory(userId,pageValue,limitValue)
    console.log(order)
    try {
      // const order = await this.orderService.getOrderHistory(userId,pageValue,limitValue)
      // console.log(order)
      return res.status(200).json({
        data:order,
        success:true
      })
    } catch (error) {
      throw new BadRequestException('400')
    }
  }
  @Post(':orderId/return')
  async returnOrder(@Body() returnOrderDto:ReturnOrderDto , @Param('orderId')orderId:number):Promise<Order> {
    const {reason} = returnOrderDto
    return this.orderService.returnOrder(orderId,reason)
  }
  @Delete(':orderId')
  async cancelOrder(@Param('orderId')orderId:number):Promise<Order> {
    return await this.orderService.cancelOrder(orderId)
  }
}
