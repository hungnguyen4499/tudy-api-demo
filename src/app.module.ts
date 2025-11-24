import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

// Configuration
import { ConfigModule } from '@/config';

// Infrastructure
import { DbModule } from '@/infrastructure';
import { MongoModule } from '@/infrastructure';
import { CacheModule } from '@/infrastructure';
import { FileModule } from '@/infrastructure';

// Business Modules
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { FilesModule } from '@/modules/files/files.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Configuration (must be imported first)
    ConfigModule,

    // Infrastructure
    DbModule,
    MongoModule,
    CacheModule,
    FileModule,

    // Business Modules
    AuthModule,
    UsersModule,
    FilesModule,
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
