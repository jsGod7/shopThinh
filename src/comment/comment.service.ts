import { BadRequestException, Body, Inject, Injectable, NotFoundException , } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/product/entities/product.entity';
import { DataSource, MoreThanOrEqual, Repository  , TreeRepository} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Comment } from './entities/comment.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Product) 
    private readonly productRepository:Repository<Product>,
    @InjectRepository(User) 
    private readonly userRepository:Repository<User>,
    @InjectRepository(Comment)
    private readonly commentRepository:Repository<Comment>,
    private readonly dataSource:DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager:Cache
  ){}

  async createComment(createCommentDto:CreateCommentDto , productId:number) {
    const {content , userId  , parentCommentId} = createCommentDto
    const product = await this.productRepository.findOne({where:{id:productId}});
    const user = await this.userRepository.findOne({where:{id:userId}});
    if(!product || !user) throw new NotFoundException('Product or User not found')
      const comment = new Comment();
    comment.product = product; 
    comment.user = user;
    comment.content = content;
    comment.parent = parentCommentId ? await this.commentRepository.findOne({where:{id:parentCommentId}}) : null;
    let rightValue :number
    if(parentCommentId) {
      const parentComment = await this.commentRepository.findOne({where:{id:parentCommentId}})
      if(!parentComment) throw new NotFoundException('Parent Comment not found')
      rightValue = parentComment.right;
      await this.commentRepository.update(
        {product:product,right:MoreThanOrEqual(rightValue)},
        {right:()=> "right + 2"}
      )
      await this.commentRepository.update(
        { product: product, left: MoreThanOrEqual(rightValue) },  // Dùng MoreThanOrEqual
        { left: () => "left + 2" }
      );
    }
    else {
      const maxRightValue = await this.commentRepository.findOne({
        where: { product: product },
        order: { right: 'DESC' },
      });
  
      rightValue = maxRightValue ? maxRightValue.right + 1 : 1;
    }
    comment.left = rightValue
    comment.right = rightValue+1
    return this.commentRepository.save(comment)
  }

  async getCommentByParentId({
    productId,
    parentCommentId = null,
    limit = 50,
    offset = 0,
  }) {
    if(parentCommentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentCommentId },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
    }
    const childComments = await this.commentRepository
    .createQueryBuilder('comment')
    .where('comment.productId = :productId', { productId })
    .andWhere('comment.left > :left', { left: parentComment.left })
    .andWhere('comment.right <= :right', { right: parentComment.right })
    .orderBy('comment.left', 'ASC')
    .skip(offset)
    .take(limit)
    .select([
      'comment.left',
      'comment.right',
      'comment.content',
      'comment.parent',
    ])
    .getMany();

  return childComments;
  }
    const rootComments = await this.commentRepository.find({
    where: { product: { id: productId }, parent: null },
    order: { left: 'ASC' },
    skip: offset,
    take: limit,
    select: ['id', 'left', 'right', 'content', 'parent'],
  });

    return rootComments;
  }
  async deleteComments({
    productId,
    commentId,
  }: {
    productId: number;
    commentId: number;
  }): Promise<boolean>  {
    const isValid = await this.validateTreeStructure(productId)
    if(!isValid) throw new BadRequestException('Tree structure is invalid. Please fix the issue before deleting comments.');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const foundProduct = await queryRunner.manager.findOne(Product,{
        where:{id:productId}
      })
      if(!foundProduct) throw new NotFoundException('Product not found')
      const comment = await queryRunner.manager.findOne(Comment ,
    {
      where:{id:commentId,product:{id:productId}}
    })
    if(!comment) throw new NotFoundException('Comment not found')
    const leftValue = comment.left;
    const rightValue = comment.right;
    const width = rightValue - leftValue + 1;

    await queryRunner.manager
    .createQueryBuilder()
    .delete()
    .from(Comment)
    .where('productId = :productId', { productId })
    .andWhere('left >= :leftValue', { leftValue })
    .andWhere('right <= :rightValue', { rightValue })
    .execute();
    
    await queryRunner.manager
        .createQueryBuilder()
        .update(Comment)
        .set({
          left: () => `CASE WHEN left > ${rightValue} THEN left - ${width} ELSE left END`,
          right: () => `CASE WHEN right > ${rightValue} THEN right - ${width} ELSE right END`,
        })
        .where('productId = :productId', { productId })
        .andWhere('(left > :rightValue OR right > :rightValue)', { rightValue })
        .execute();

    await queryRunner.commitTransaction()
    return true
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    }
    finally {
      await queryRunner.release()
    }

  }
  async getCommentsWithCache(productId: number): Promise<Comment[]> {
    const cacheKey = `comments:${productId}`;
    const cachedComments = await this.cacheManager.get<Comment[]>(cacheKey);

    if (cachedComments) {
      return cachedComments;
    }

    const comments = await this.commentRepository.find({
      where: { product: { id: productId } },
      order: { left: 'ASC' },
    });

    await this.cacheManager.set(cacheKey, comments , 3600 ); 
    return comments;
  }
  async validateTreeStructure(productId: number): Promise<boolean> {
    const invalidNodes = await this.commentRepository
      .createQueryBuilder('comment')
      .select('comment.id')
      .where('comment.left >= comment.right')
      .andWhere('comment.productId = :productId', { productId })
      .getMany();

    return invalidNodes.length === 0; 
  }

}

