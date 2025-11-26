import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure';
import { RedisService } from '@/infrastructure';
import { DataScopeType } from '@/common/constants';

export interface UserContext {
  userId: number;
  role: string;
  roles: string[];
  organizationId: number | null;
  tutorId: number | null;
  permissions: string[];
  menuCodes: string[];
  dataScope: DataScopeType;
}

// Type for Prisma query result
type UserWithContext = {
  id: number;
  status: string;
  organizationMember: { organizationId: number } | null;
  tutor: { id: number } | null;
  userRoles: Array<{
    expiresAt: Date | null;
    role: {
      id: number;
      name: string;
      dataScope: DataScopeType;
      permissions: Array<{
        permission: { code: string };
      }>;
      menus: Array<{
        menu: { code: string };
      }>;
    };
  }>;
};

type UserRole = UserWithContext['userRoles'][number];

@Injectable()
export class UserContextService {
  private readonly logger = new Logger(UserContextService.name);
  private readonly CACHE_TTL = 300;
  private readonly CACHE_PREFIX = 'user:context:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async loadContext(userId: number): Promise<UserContext> {
    const cached = await this.getCachedContext(userId);
    if (cached) {
      this.logger.debug(`Context loaded from cache for user ${userId}`);
      return cached;
    }

    this.logger.debug(`Loading context from DB for user ${userId}`);
    const context = await this.loadContextFromDatabase(userId);
    await this.setCachedContext(userId, context);

    return context;
  }

  private async loadContextFromDatabase(userId: number): Promise<UserContext> {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        status: true,
        organizationMember: {
          select: {
            organizationId: true,
          },
        },
        tutor: {
          select: {
            id: true,
          },
        },
        userRoles: {
          select: {
            expiresAt: true,
            role: {
              select: {
                id: true,
                name: true,
                dataScope: true,
                permissions: {
                  select: {
                    permission: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
                menus: {
                  select: {
                    menu: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    })) as UserWithContext | null;

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    if (user.status !== 'ACTIVE') {
      throw new Error(`User ${userId} is not active`);
    }

    const activeUserRoles = this.getActiveUserRoles(user.userRoles);

    if (activeUserRoles.length === 0) {
      throw new Error(`User ${userId} has no active roles`);
    }

    return this.buildUserContext(user, activeUserRoles);
  }

  private getActiveUserRoles(userRoles: UserRole[]): UserRole[] {
    return userRoles.filter(
      (ur) => !ur.expiresAt || ur.expiresAt > new Date(),
    );
  }

  private buildUserContext(
    user: UserWithContext,
    activeUserRoles: UserRole[],
  ): UserContext {
    const permissions = this.extractPermissions(activeUserRoles);
    const menuCodes = this.extractMenuCodes(activeUserRoles);
    const dataScope = this.determineDataScope(activeUserRoles);
    const roleNames = activeUserRoles.map((ur) => ur.role.name);
    const primaryRoleName = activeUserRoles[0]?.role.name ?? 'parent';

    return {
      userId: user.id,
      role: primaryRoleName,
      roles: roleNames,
      organizationId: user.organizationMember?.organizationId ?? null,
      tutorId: user.tutor?.id ?? null,
      permissions,
      menuCodes,
      dataScope,
    };
  }

  private extractPermissions(userRoles: UserRole[]): string[] {
    const permissionSet = new Set<string>();

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        permissionSet.add(rolePermission.permission.code);
      }
    }

    return Array.from(permissionSet);
  }

  private extractMenuCodes(userRoles: UserRole[]): string[] {
    const menuCodeSet = new Set<string>();

    for (const userRole of userRoles) {
      for (const roleMenu of userRole.role.menus) {
        menuCodeSet.add(roleMenu.menu.code);
      }
    }

    return Array.from(menuCodeSet);
  }

  private determineDataScope(userRoles: UserRole[]): DataScopeType {
    if (userRoles.length === 0) {
      return DataScopeType.USER;
    }

    const dataScopes = userRoles.map((userRole) => userRole.role.dataScope);

    if (dataScopes.includes(DataScopeType.GLOBAL)) {
      return DataScopeType.GLOBAL;
    }
    if (dataScopes.includes(DataScopeType.ORGANIZATION)) {
      return DataScopeType.ORGANIZATION;
    }
    return DataScopeType.USER;
  }

  private async getCachedContext(
    userId: number,
  ): Promise<UserContext | null> {
    try {
      const key = this.getCacheKey(userId);
      const cached = await this.redis.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached) as UserContext;
    } catch (error) {
      this.logger.warn(
        `Failed to get cached context for user ${userId}:`,
        error,
      );
      return null;
    }
  }

  private async setCachedContext(
    userId: number,
    context: UserContext,
  ): Promise<void> {
    try {
      const key = this.getCacheKey(userId);
      await this.redis.set(key, JSON.stringify(context), this.CACHE_TTL);
    } catch (error) {
      this.logger.warn(`Failed to cache context for user ${userId}:`, error);
    }
  }

  async invalidateContext(userId: number): Promise<void> {
    try {
      const key = this.getCacheKey(userId);
      await this.redis.del(key);
      this.logger.debug(`Invalidated context cache for user ${userId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate context for user ${userId}:`,
        error,
      );
    }
  }

  async invalidateContexts(userIds: number[]): Promise<void> {
    await Promise.all(userIds.map((id) => this.invalidateContext(id)));
  }

  private getCacheKey(userId: number): string {
    return `${this.CACHE_PREFIX}${userId}`;
  }

  async loadPermissions(userId: number): Promise<string[]> {
    const context = await this.loadContext(userId);
    return context.permissions;
  }

  async loadMenuCodes(userId: number): Promise<string[]> {
    const context = await this.loadContext(userId);
    return context.menuCodes;
  }
}
