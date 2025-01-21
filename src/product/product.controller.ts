import { BadGatewayException, BadRequestException, Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
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

@Controller('products')
export class ProductController {
  constructor(private readonly productStrategyFactory:ProductStrategyFactory,
              private readonly productService:ProductService,
              private readonly updateProductStrategyFactory:StrategyFactoryService
  ){}
  @Post('create')
  async createProduct(@Body()createProductDto:CreateProductDto) {
    const {product_type} = createProductDto
    const strategy = this.productStrategyFactory.getStrategy(product_type)
    return strategy.createProduct(createProductDto)
  }
  @Patch(':id')
  async updateProduct(@Param('id') id:string,@Body() updateProduct:UpdateProductDto) {
    const product = await this.productService.findById(+id)
    if(!product) throw new BadGatewayException('Product not found')
    const productType:ProductType = product.product_type;
    if(!productType) throw new BadRequestException('Product type is not specified')
    const strategy = this.updateProductStrategyFactory.createStrategy(productType)
    const update = strategy.update(product,updateProduct)
    return await this.productService.updateProduct(+id,update)
  }
  @Delete(':id')
  async deleteProduct(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return await this.productService.deleteProduct(id);
  }
  @Post(':id/status')
  async updateStatus(@Param('id') id:string,updateStatusProductDto:UpdateStatusProductDto) {
    const res = await this.productService.updateStatus(+id,updateStatusProductDto)
    return res
  }
  @Get('/drafts')
  async getDraftProducts(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('name') name?: string,
    @Query('priceFrom') priceFrom?: number,
    @Query('priceTo') priceTo?: number,
  ): Promise<{ data: Product[]; total: number }> {
    return await this.productService.findDraftProducts(page, limit, { name, priceFrom, priceTo });
  }
  @Get('/published')
  async getPublishedProducts(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('name') name?: string,
    @Query('priceFrom') priceFrom?: number,
    @Query('priceTo') priceTo?: number,
    @Query('type') type?: string,
  ): Promise<{ data: Product[]; total: number }> {
    return await this.productService.findPublishedProducts(page, limit, { name, priceFrom, priceTo, type });
  }
  


  
}