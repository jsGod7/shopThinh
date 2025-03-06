import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStrategyFactory } from './pattern/product-strategy.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, Repository } from 'typeorm';
import { UpdateStatusProductDto } from './dto/update-productStatus.dto';
import { AmqpConnection, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepository:Repository<Product>,
  ){}

  
  a
  
  async findById(id:number) {
    const product  = await this.productRepository.findOne({where:{id}})
    if(!product) throw new NotFoundException('Product not found')
    return product
    
  }
 
  







  async deleteProduct(id: number): Promise<{ message: string }> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    await this.productRepository.delete(id);

    return { message: `Product with id ${id} has been successfully deleted` };
  }
  

  
    

  }

