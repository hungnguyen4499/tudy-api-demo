import { Injectable, Logger } from '@nestjs/common';
import { UserContextService } from '@/common/services/user-context.service';

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);

  constructor(private readonly userContextService: UserContextService) {}

  async hasPermission(
    userId: number,
    requiredPermission: string,
  ): Promise<boolean> {
    const permissions = await this.userContextService.loadPermissions(userId);
    return this.checkPermission(permissions, requiredPermission);
  }

  async hasAllPermissions(
    userId: number,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const permissions = await this.userContextService.loadPermissions(userId);
    return requiredPermissions.every((required) =>
      this.checkPermission(permissions, required),
    );
  }

  async hasAnyPermission(
    userId: number,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const permissions = await this.userContextService.loadPermissions(userId);
    return requiredPermissions.some((required) =>
      this.checkPermission(permissions, required),
    );
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    return this.userContextService.loadPermissions(userId);
  }

  private checkPermission(
    userPermissions: string[],
    requiredPermission: string,
  ): boolean {
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    if (userPermissions.includes('*.*')) {
      return true;
    }

    const [resource] = requiredPermission.split('.');
    const resourceWildcard = `${resource}.*`;

    return userPermissions.includes(resourceWildcard);
  }

  async getPermissionsByResource(
    userId: number,
    resource: string,
  ): Promise<string[]> {
    const permissions = await this.userContextService.loadPermissions(userId);

    return permissions.filter((perm) => {
      const [permResource] = perm.split('.');
      return permResource === resource || permResource === '*';
    });
  }

  async canPerformAction(
    userId: number,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const permissionCode = `${resource}.${action}`;
    return this.hasPermission(userId, permissionCode);
  }

  async getActionsForResource(
    userId: number,
    resource: string,
  ): Promise<string[]> {
    const permissions = await this.getPermissionsByResource(userId, resource);
    const actions = permissions.map((perm) => {
      const [, action] = perm.split('.');
      return action;
    });

    return [...new Set(actions)];
  }
}
