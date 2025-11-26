import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure';
import { RedisService } from '@/infrastructure';

export interface UserContext {
  userId: number;
  role: string;
  organizationId: number | null;
  tutorId: number | null;
  permissions: string[];
  menuCodes: string[];
  dataScope: 'GLOBAL' | 'ORGANIZATION' | 'USER'; // Determined from user roles (Role.dataScope)
}

@Injectable()
export class UserContextService {
  private readonly logger = new Logger(UserContextService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'user:context:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Load complete user context with permissions and menus
   * Uses Redis cache for performance
   */
  async loadContext(userId: number): Promise<UserContext> {
    // Try cache first
    const cached = await this.getCachedContext(userId);
    if (cached) {
      this.logger.debug(`Context loaded from cache for user ${userId}`);
      return cached;
    }

    // Load from database
    this.logger.debug(`Loading context from DB for user ${userId}`);
    const context = await this.loadContextFromDatabase(userId);

    // Cache for future requests
    await this.setCachedContext(userId, context);

    return context;
  }

  /**
   * Load user context from database
   */
  private async loadContextFromDatabase(userId: number): Promise<UserContext> {
    // Load user with all related data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organizationMember: {
          include: {
            organization: true,
          },
        },
        tutor: true,
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
                menus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Extract permissions from user roles
    const permissions = this.extractPermissions(user.userRoles);

    // Extract menu codes from user roles
    const menuCodes = this.extractMenuCodes(user.userRoles);

    // Determine data scope from user roles (highest scope wins)
    const dataScope = this.determineDataScope(user.userRoles);

    // Get primary role name from UserRole
    const primaryUserRole = user.userRoles.find(
      (ur) => !ur.expiresAt || ur.expiresAt > new Date(),
    );
    const roleName = primaryUserRole?.role.name || 'parent'; // Default fallback

    // Build context
    const context: UserContext = {
      userId: user.id,
      role: roleName,
      organizationId: user.organizationMember?.organizationId || null,
      tutorId: user.tutor?.id || null,
      permissions,
      menuCodes,
      dataScope,
    };

    return context;
  }

  /**
   * Extract unique permissions from user roles
   */
  private extractPermissions(userRoles: any[]): string[] {
    const permissionSet = new Set<string>();

    for (const userRole of userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        permissionSet.add(rolePermission.permission.code);
      }
    }

    return Array.from(permissionSet);
  }

  /**
   * Extract unique menu codes from user roles
   */
  private extractMenuCodes(userRoles: any[]): string[] {
    const menuCodeSet = new Set<string>();

    for (const userRole of userRoles) {
      for (const roleMenu of userRole.role.menus) {
        menuCodeSet.add(roleMenu.menu.code);
      }
    }

    return Array.from(menuCodeSet);
  }

  /**
   * Determine data scope from user roles
   * Priority: GLOBAL > ORGANIZATION > USER
   * If user has multiple roles, highest scope wins
   */
  private determineDataScope(
    userRoles: any[],
  ): 'GLOBAL' | 'ORGANIZATION' | 'USER' {
    if (userRoles.length === 0) {
      return 'USER'; // Default: most restrictive
    }

    // Get all data scopes from assigned roles
    const dataScopes = userRoles.map((userRole) => userRole.role.dataScope);

    // Priority: GLOBAL > ORGANIZATION > USER
    if (dataScopes.includes('GLOBAL')) {
      return 'GLOBAL';
    }
    if (dataScopes.includes('ORGANIZATION')) {
      return 'ORGANIZATION';
    }
    return 'USER';
  }

  /**
   * Get cached context from Redis
   */
  private async getCachedContext(userId: number): Promise<UserContext | null> {
    try {
      const key = this.getCacheKey(userId);
      const cached = await this.redis.get(key);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      this.logger.warn(
        `Failed to get cached context for user ${userId}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Cache context in Redis
   */
  private async setCachedContext(
    userId: number,
    context: UserContext,
  ): Promise<void> {
    try {
      const key = this.getCacheKey(userId);
      await this.redis.set(key, JSON.stringify(context), this.CACHE_TTL);
    } catch (error) {
      this.logger.warn(`Failed to cache context for user ${userId}:`, error);
      // Don't throw - caching is not critical
    }
  }

  /**
   * Invalidate cached context (call when permissions/roles change)
   */
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

  /**
   * Invalidate context for multiple users
   */
  async invalidateContexts(userIds: number[]): Promise<void> {
    await Promise.all(userIds.map((id) => this.invalidateContext(id)));
  }

  /**
   * Generate cache key
   */
  private getCacheKey(userId: number): string {
    return `${this.CACHE_PREFIX}${userId}`;
  }

  /**
   * Load only permissions (lightweight)
   */
  async loadPermissions(userId: number): Promise<string[]> {
    const context = await this.loadContext(userId);
    return context.permissions;
  }

  /**
   * Load only menu codes (lightweight)
   */
  async loadMenuCodes(userId: number): Promise<string[]> {
    const context = await this.loadContext(userId);
    return context.menuCodes;
  }
}
