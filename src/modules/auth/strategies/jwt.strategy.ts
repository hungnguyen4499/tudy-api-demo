import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWTConfigService } from '@/config';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { PrismaService } from '@/infrastructure/db/prisma.service';

/**
 * JWT Strategy
 * Validates JWT tokens and extracts basic user info
 * Full context loading and scope initialization is handled by DataScopeInterceptor
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private jwtConfig: JWTConfigService,
    private prisma: PrismaService,
  ) {
    const config = jwtConfig.getConfig();
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secret,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email || !payload.role) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const userId =
      typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;

    // Load basic user info to verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        status: true,
        organizationMember: {
          select: { organizationId: true },
        },
        tutor: {
          select: { id: true },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Get primary role from UserRole (use role from JWT payload as fallback)
    // Full context (permissions, menuCodes) is loaded by DataScopeInterceptor
    const roleName = payload.role || 'parent'; // Fallback to parent if not in payload

    return {
      userId: user.id,
      email: user.email,
      role: roleName, // Use role from JWT payload (set during token generation)
      organizationId: user.organizationMember?.organizationId || null,
      tutorId: user.tutor?.id || null,
    };
  }
}
