import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@/common/constants';
import { BusinessException } from '@/common/exceptions/business.exception';
import { ErrorCodes } from '@/common/constants';
import { UserContextService } from '@/common/services/user-context.service';

/**
 * Roles Guard
 * Checks if user has required role(s)
 * 
 * OPTIMIZATION: Uses UserContextService to load roles (cached)
 * instead of relying on JWT Strategy data
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(
    private reflector: Reflector,
    private userContextService: UserContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      throw new BusinessException(ErrorCodes.UNAUTHORIZED);
    }

    try {
      // Load user context (with Redis caching)
      const userContext = await this.userContextService.loadContext(
        user.userId,
      );

      // Check if user has ANY of the required roles
      const hasRole = requiredRoles.some((role) =>
        userContext.roles.includes(role),
      );

      if (!hasRole) {
        throw new BusinessException(ErrorCodes.INSUFFICIENT_PERMISSIONS);
      }

      return true;
    } catch (error) {
      if (error instanceof BusinessException) {
        throw error;
      }
      this.logger.error('Error checking roles:', error);
      throw new BusinessException(ErrorCodes.UNAUTHORIZED);
    }
  }
}
