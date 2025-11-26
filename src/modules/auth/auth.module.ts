import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JWTConfigService } from '@/config';
import { DbModule } from '@/infrastructure/db/db.module';

// Controllers
import { AuthController } from './auth.controller';

// Services
import { AuthService } from './auth.service';

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

/**
 * Authentication Module
 * Handles ONLY authentication concerns:
 * - User login/register
 * - JWT token generation & validation
 * - OAuth providers (Google, Facebook, Apple) - TODO
 * - Password reset - TODO
 * - Email verification - TODO
 *
 * Authorization (RBAC, Menus) is handled by SystemModule
 * Scope-based access control is handled by ScopeModule
 */
@Module({
  imports: [
    DbModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (jwtConfig: JWTConfigService) => {
        const config = jwtConfig.getConfig();
        return {
          secret: config.secret,
        };
      },
      inject: [JWTConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
