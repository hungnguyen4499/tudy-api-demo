import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWTConfigService } from '@/config';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';

/**
 * JWT Strategy
 * Validates JWT tokens and extracts user ID from payload
 * 
 * OPTIMIZATION: No database queries here - only token validation
 * Full user context (roles, permissions, organization) is loaded by
 * UserContextService in DataScopeInterceptor with Redis caching
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private jwtConfig: JWTConfigService) {
    const config = jwtConfig.getConfig();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
    });
  }

  /**
   * Validate JWT payload
   * Only extracts userId and email from token - no DB queries
   * User validation (status, roles) happens in UserContextService
   */
  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const userId = parseInt(payload.sub, 10);

    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid user ID in token');
    }

    // Return minimal user info - full context loaded by UserContextService
    return {
      userId,
      email: payload.email,
    };
  }
}
