import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Cache Module
 * Provides Redis service globally
 */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class CacheModule {}

