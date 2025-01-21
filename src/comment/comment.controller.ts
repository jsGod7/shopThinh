import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, BadRequestException, Query, UseInterceptors } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post(':productId')
  async createComment(
    @Param('productId',ParseIntPipe) productId:number,
    @Body() createCommentDto:CreateCommentDto
  )
  {
    try {
      return await this.commentService.createComment(createCommentDto,productId)
    } catch (error) {
      throw new BadRequestException(error.message)
    }
  }
  @Get()
  async getComments(
    @Query('productId') productId: number,
    @Query('parentCommentId') parentCommentId?: number,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    return this.commentService.getCommentByParentId({
      productId,
      parentCommentId,
      limit: Number(limit),
      offset: Number(offset),
    });
  }
  @Delete()
  async deleteComment(@Query('productId') productId:number , @Query('commentId')commentId:number)
  {
    return this.commentService.deleteComments({productId,commentId})
  } 
  @Get(':productId')
  @UseInterceptors(CacheInterceptor)
  async getCommentsWithCache(@Param('productId') productId:string) {
    return this.commentService.getCommentsWithCache(+productId)
  }

  
}
