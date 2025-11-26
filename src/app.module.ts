import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

// Configuration
import { ConfigModule } from '@/config';

// Infrastructure
import { DbModule } from '@/infrastructure';
import { MongoModule } from '@/infrastructure';
import { CacheModule } from '@/infrastructure';
import { FileModule } from '@/infrastructure';

// Business Modules
import { SystemModule } from '@/modules/system/system.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { FilesModule } from '@/modules/files/files.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

// Interceptors
import { DataScopeInterceptor } from './common/interceptors/data-scope.interceptor';

// Services
import { DataScopeContext } from './common/services/data-scope-context.service';
// Note: UserContextService is provided by SystemModule (@Global)

@Module({
  imports: [
    // Configuration (must be imported first)
    ConfigModule,

    // Infrastructure
    DbModule,
    MongoModule,
    CacheModule,
    FileModule,

    // System (@Global - RBAC, Menu, Settings)
    SystemModule,

    // Business Modules
    AuthModule,
    UsersModule,
    FilesModule,
  ],
  controllers: [],
  providers: [
    // Common services (request-scoped)
    DataScopeContext,
    // Note: UserContextService is provided by SystemModule (@Global)

    // Global JWT Guard - applies to all routes except @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Scope Interceptor - initializes scope for authenticated requests
    {
      provide: APP_INTERCEPTOR,
      useClass: DataScopeInterceptor,
    },
  ],
})
export class AppModule {}
