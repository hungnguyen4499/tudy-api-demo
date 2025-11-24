import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

// Infrastructure
import { DbModule } from './infrastructure';
import { MongoModule } from './infrastructure';
import { CacheModule } from './infrastructure';
import { FileModule } from './infrastructure';

// Business Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Infrastructure
    DbModule,
    MongoModule,
    CacheModule,
    FileModule,

    // Business Modules
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [
    // Global JWT Guard - applies to all routes except @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
