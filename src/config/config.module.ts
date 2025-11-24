import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppConfigService } from './app.config';
import { DatabaseConfigService } from './database.config';
import { JWTConfigService } from './jwt.config';
import { RedisConfigService } from './redis.config';
import { StorageConfigService } from './storage.config';
import { MongoConfigService } from './mongo.config';

/**
 * Configuration Module
 * Provides type-safe configuration services for the entire application
 * Infrastructure modules will inject these config services to initialize their services
 */
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [
    AppConfigService,
    DatabaseConfigService,
    JWTConfigService,
    RedisConfigService,
    StorageConfigService,
    MongoConfigService,
  ],
  exports: [
    AppConfigService,
    DatabaseConfigService,
    JWTConfigService,
    RedisConfigService,
    StorageConfigService,
    MongoConfigService,
  ],
})
export class ConfigModule {}

