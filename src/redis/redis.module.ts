import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: 'localhost', // Địa chỉ Redis
      port: 6379, // Cổng Redis (mặc định)
      ttl: 300, // Thời gian cache (tính bằng giây), ví dụ: 300s = 5 phút
    }),
  ],
  controllers: [RedisController],
  providers: [RedisService],
  exports:[RedisService]
})
export class RedisModule {}
