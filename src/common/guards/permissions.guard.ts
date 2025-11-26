import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  PERMISSIONS_MODE_KEY,
  PermissionsMode,
} from '../decorators/permissions.decorator';
import { PermissionService } from '@/modules/system/services/permission.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly logger = new Logger(PermissionsGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No permissions required
    if (
      !requiredPermissions ||
      requiredPermissions.length === 0 ||
      requiredPermissions === null
    ) {
      return true;
    }

    // Get permissions mode (ALL or ANY)
    const mode = this.reflector.getAllAndOverride<PermissionsMode>(
      PERMISSIONS_MODE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      this.logger.warn('PermissionsGuard: No user found in request');
      throw new ForbiddenException('Authentication required');
    }

    // Check permissions
    try {
      const hasPermission = await this.checkPermissions(
        user.userId,
        requiredPermissions,
        mode || 'ALL',
      );

      if (!hasPermission) {
        this.logger.warn(
          `User ${user.userId} lacks required permissions: ${requiredPermissions.join(', ')}`,
        );
        throw new ForbiddenException(
          'Insufficient permissions to perform this action',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error('Error checking permissions:', error);
      throw new ForbiddenException('Failed to verify permissions');
    }
  }

  /**
   * Check permissions based on mode
   */
  private async checkPermissions(
    userId: number,
    requiredPermissions: string[],
    mode: PermissionsMode,
  ): Promise<boolean> {
    if (mode === 'ANY') {
      // User needs ANY of the permissions (OR logic)
      return this.permissionService.hasAnyPermission(
        userId,
        requiredPermissions,
      );
    } else {
      // User needs ALL permissions (AND logic) - default
      return this.permissionService.hasAllPermissions(
        userId,
        requiredPermissions,
      );
    }
  }
}
