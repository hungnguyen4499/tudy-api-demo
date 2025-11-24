import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoConfigService } from '@/config';
import { MongoService } from './mongo.service';

/**
 * MongoDB Module
 * Provides MongoDB connection globally
 */
@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (mongoConfig: MongoConfigService) => {
        const config = mongoConfig.getConfig();
        return {
          uri: config.uri,
        };
      },
      inject: [MongoConfigService],
    }),
  ],
  providers: [MongoService],
  exports: [MongoService],
})
export class MongoModule {}
