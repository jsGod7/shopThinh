import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CheckoutReviewDto } from './dto/checkout.order.dto';

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
  
}
