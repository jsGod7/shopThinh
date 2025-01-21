import { Global, Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Product } from 'src/product/entities/product.entity';
import { User } from 'src/user/entities/user.entity';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { Keyv } from '@keyv/redis';

@Global()
@Module({
  imports:[TypeOrmModule.forFeature([Comment, Product , User]),
  CacheModule.registerAsync({
    useFactory: async() => {
      
      return  {
        stores:[
          new KeyvRedis('redis://localhost:6379')
        ]
      }
      
    }
  })
  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports:[CommentService]
})
export class CommentModule {}
