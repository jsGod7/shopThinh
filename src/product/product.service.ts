import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStrategyFactory } from './pattern/product-strategy.factory';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { UpdateStatusProductDto } from './dto/update-productStatus.dto';
import { SearchProductDto } from './dto/search-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly productRepository:Repository<Product>
  ){}

  async updateStatus(id:number,updateStatusProductDto:UpdateStatusProductDto) {
    const foundProduct = await this.productRepository.findOne({where:{id}})
    if(!foundProduct) throw new NotFoundException('Something went wrong about product')
    if(updateStatusProductDto.isDraft !== undefined) 
      foundProduct.isDraft = updateStatusProductDto.isDraft
    if(updateStatusProductDto.isPublished !== undefined) 
      foundProduct.isPublished = updateStatusProductDto.isPublished
    return this.productRepository.save(foundProduct)
  }
  async searchProducts(searchDto: SearchProductDto){
    const {
      product_name,
      product_type,
      min_price,
      max_price,
      page = 1,
      limit = 10,
    } = searchDto;
    const query = this.productRepository.createQueryBuilder('product');
    if (product_name) {
      query.andWhere('product.product_name ILIKE :product_name', { product_name: `%${product_name}%` });
    }

    // Filter by product_type
    if (product_type) {
      query.andWhere('product.product_type = :product_type', { product_type });
    }
    if (min_price !== undefined) {
      query.andWhere('product.product_price >= :min_price', { min_price });
    }
    if (max_price !== undefined) {
      query.andWhere('product.product_price <= :max_price', { max_price });
    }
    query.skip((page - 1) * limit).take(limit);

    // Execute query
    const [products, total] = await query.getManyAndCount();

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    
  }
  async updateProduct(id:number,updateData:Product) {
    await this.productRepository.update(id,updateData)
    return this.findById(id)
    
    
  }
  
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
  async findDraftProducts(
    page: number = 1,
    limit: number = 10,
    filters?: { [key: string]: any },
  ): Promise<{ data: Product[]; total: number }> {
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .where('product.isDraft = :isDraft', { isDraft: true });

    // Áp dụng filter nếu có
    if (filters?.name) {
      queryBuilder.andWhere('product.product_name ILIKE :name', { name: `%${filters.name}%` });
    }
    if (filters?.priceFrom && filters?.priceTo) {
      queryBuilder.andWhere('product.product_price BETWEEN :priceFrom AND :priceTo', {
        priceFrom: filters.priceFrom,
        priceTo: filters.priceTo,
      });
    }

    // Phân trang
    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }
  async findPublishedProducts(
    page: number = 1,
    limit: number = 10,
    filters?: { [key: string]: any },
  ): Promise<{ data: Product[]; total: number }> {
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .where('product.isPublished = :isPublished', { isPublished: true });

    // Áp dụng filter nếu có
    if (filters?.name) {
      queryBuilder.andWhere('product.product_name ILIKE :name', { name: `%${filters.name}%` });
    }
    if (filters?.priceFrom && filters?.priceTo) {
      queryBuilder.andWhere('product.product_price BETWEEN :priceFrom AND :priceTo', {
        priceFrom: filters.priceFrom,
        priceTo: filters.priceTo,
      });
    }
    if (filters?.type) {
      queryBuilder.andWhere('product.product_type = :type', { type: filters.type });
    }

    // Phân trang
    const [data, total] = await queryBuilder
      .leftJoinAndSelect('product.electronic', 'electronic')
      .leftJoinAndSelect('product.clothing', 'clothing')
      .leftJoinAndSelect('product.furniture', 'furniture')
      .orderBy('product.createdAt', 'DESC') // Sắp xếp theo ngày tạo
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  
    

  }

