import { BadGatewayException, BadRequestException, Body, Controller, Delete, Get, InternalServerErrorException, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { ProductType } from 'src/util/common/product.type.enum.js';
import { ProductService } from './product.service.js';
import { ProductStrategyFactory } from './pattern/product-strategy.factory.js';
import { CurrentUserMiddleware } from 'src/util/middleware/currentUser.middlaware.js';
import { CurrentUser } from 'src/util/decorators/currentUser.decorator.js';
import { User } from 'src/user/entities/user.entity.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { StrategyFactoryService } from './pattern/updateProduct/strategy-factory..updateProduct.service.js';
import { UpdateStatusProductDto } from './dto/update-productStatus.dto.js';
import { Product } from './entities/product.entity.js';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { findProductDto } from './dto/search-product.dto.js';

@Controller('products')
export class ProductController {
  constructor(private readonly productStrategyFactory:ProductStrategyFactory,
              private readonly productService:ProductService,
              private readonly updateProductStrategyFactory:StrategyFactoryService,
              private readonly amqpConnection:AmqpConnection
  ){}
 
  @Post('create')
  async createProduct(@Body()createProductDto:CreateProductDto) {
    const res =  await this.amqpConnection.request({
      exchange:'product_exchange',
      routingKey:'product_create',
      payload:createProductDto
    })
    return res
  }
  @Patch(':id')
  async updateProduct(@Param('id') id:string,@Body() updateProduct:UpdateProductDto) {
    const payload = {id:+id , updateProduct}
    try {
      const res = await this.amqpConnection.request({
        exchange:'product_exchange',
        routingKey:'product_update',
        payload
      })
      if (!res) {
        throw new BadGatewayException('Failed to update product');
      }
      return res
    } catch (err) {
      throw new InternalServerErrorException('Error updating product');
    }
  }
  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return await this.productService.deleteProduct(id);
  }
  @Post(':id/status')
  async updateStatus(@Param('id') id:string,@Body() updateStatusProductDto:UpdateStatusProductDto) {
    const res = await this.amqpConnection.request({
      exchange:'product_exchange',
      routingKey:'product_updateStatus',
      payload:{id,...updateStatusProductDto}
    })
    return res
  }

  @Get('/published')
  async findAllProducts(@Query() query: findProductDto) {
    const filters = query.filters ?? {}; 

    const payload = {
        limit: query.limit || 10, 
        page: query.page || 1,
        sort: query.sort || 'createdAt:desc',
        filter: {
            product_name: filters.product_name || null,
            product_quantity: filters.product_quantity || null,
            product_ratingsAverage: filters.product_ratingsAverage || null,
        }
    };

    try {
        const res = await this.amqpConnection.request({
            exchange: 'product_exchange',
            routingKey: 'product_findall',
            payload
        });

        if (!res) {
            throw new BadRequestException('Error fetching products');
        }

        console.log(res);
        return res;
    } catch (error) {
        throw new BadRequestException('Failed to fetch products from RabbitMQ');
    }
}

  


  
}