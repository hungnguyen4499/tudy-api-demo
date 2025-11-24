import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoService } from './mongo.service';

/**
 * MongoDB Module
 * Provides MongoDB connection globally
 */
@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/tudy_logs'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MongoService],
  exports: [MongoService],
})
export class MongoModule {}

