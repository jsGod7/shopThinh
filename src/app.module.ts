import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'db/data-source';
import { UserModule } from './user/user.module';
import { EmailModule } from './email/email.module';
import { CurrentUserMiddleware } from './util/middleware/currentUser.middlaware';
import { ApiKeyModule } from './api-key/api-key.module';
import { checkApiKeyMiddleware } from './util/middleware/check-apikey.middleware';
import { ProductModule } from './product/product.module';
import { CommentModule } from './comment/comment.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisModule } from './redis/redis.module';
import { InventoryModule } from './inventory/inventory.module';
import { DiscountModule } from './discount/discount.module';
import * as redisStore from 'cache-manager-redis-store'

@Module({
  imports:[
    TypeOrmModule.forRoot(dataSourceOptions),
    UserModule,
    EmailModule,
    ApiKeyModule,
    ProductModule,
    CommentModule,
    RedisModule ,
    CacheModule.register({
      store:redisStore,
      host:'localhost',
      isGlobal:true,
      port:6379
    }),
    InventoryModule,
    DiscountModule
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
     .apply(CurrentUserMiddleware)
     .forRoutes({path:'*',method:RequestMethod.ALL})
    consumer
    .apply(checkApiKeyMiddleware)
    .forRoutes('*')
  }
}
