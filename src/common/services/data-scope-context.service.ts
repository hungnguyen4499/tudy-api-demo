import { Injectable, Scope } from '@nestjs/common';
import { UserContext } from './user-context.service';
import { DataScopeType } from '@/common/constants';

/**
 * Data Scope Context Service
 * Request-scoped service that manages data access scope
 *
 * Usage with RBAC:
 * - RBAC (PermissionsGuard) → "Can user DO this action?"
 * - DataScopeContext → "What DATA can user access?"
 */
@Injectable({ scope: Scope.REQUEST })
export class DataScopeContext {
  private _context: UserContext | null = null;
  private _type: DataScopeType | null = null;

  /**
   * Initialize data scope from user context
   * Called by DataScopeInterceptor after authentication
   * DataScope is loaded from database (Role.dataScope) via UserContext
   */
  initialize(context: UserContext): void {
    this._context = context;
    // Use dataScope from UserContext (loaded from Role.dataScope in database)
    this._type = context.dataScope;
  }

  /**
   * Check if initialized
   */
  get isInitialized(): boolean {
    return this._context !== null && this._type !== null;
  }

  /**
   * Get data scope type
   */
  get type(): DataScopeType {
    this.ensureInitialized();
    return this._type!;
  }

  /**
   * Get user ID
   */
  get userId(): number {
    this.ensureInitialized();
    return this._context!.userId;
  }

  /**
   * Get organization ID
   */
  get organizationId(): number | null {
    this.ensureInitialized();
    return this._context!.organizationId;
  }

  /**
   * Get tutor ID
   */
  get tutorId(): number | null {
    this.ensureInitialized();
    return this._context!.tutorId;
  }

  /**
   * Get all user roles (multi-role support)
   */
  get roles(): string[] {
    this.ensureInitialized();
    return this._context!.roles;
  }

  /**
   * Get user permissions
   */
  get permissions(): string[] {
    this.ensureInitialized();
    return this._context!.permissions;
  }

  /**
   * Check data scope type helpers
   */
  get isGlobal(): boolean {
    return this.type === DataScopeType.GLOBAL;
  }

  get isOrganizationScoped(): boolean {
    return this.type === DataScopeType.ORGANIZATION;
  }

  get isUserScoped(): boolean {
    return this.type === DataScopeType.USER;
  }

  /**
   * Apply data scope filter to a base query filter
   * Used in repositories to automatically filter data by scope
   */
  applyFilter(
    baseFilter: Record<string, unknown> = {},
  ): Record<string, unknown> {
    switch (this.type) {
      case DataScopeType.GLOBAL:
        return baseFilter; // No additional filters

      case DataScopeType.ORGANIZATION:
        return {
          ...baseFilter,
          organizationId: this.organizationId,
        };

      case DataScopeType.USER:
        return {
          ...baseFilter,
          userId: this.userId,
        };

      default:
        return baseFilter;
    }
  }

  /**
   * Get organization filter (for explicit use)
   */
  getOrganizationFilter(): { organizationId?: number } {
    if (this.isGlobal) return {};
    if (this.organizationId) return { organizationId: this.organizationId };
    return {};
  }

  /**
   * Get user filter (for explicit use)
   */
  getUserFilter(): { userId?: number } {
    if (this.isGlobal) return {};
    return { userId: this.userId };
  }

  /**
   * Get parent filter (for bookings, children, etc.)
   */
  getParentFilter(): { parentId?: number } {
    if (this.isGlobal) return {};
    return { parentId: this.userId };
  }

  /**
   * Check if user can access a specific organization
   */
  canAccessOrganization(organizationId: number): boolean {
    if (this.isGlobal) return true;
    if (this.isOrganizationScoped) {
      return this.organizationId === organizationId;
    }
    return false;
  }

  /**
   * Check if user can access a resource
   */
  canAccessResource(resource: {
    organizationId?: number;
    userId?: number;
    createdByTutorId?: number;
    parentId?: number;
  }): boolean {
    if (this.isGlobal) return true;

    if (this.isOrganizationScoped) {
      if (resource.organizationId) {
        return resource.organizationId === this.organizationId;
      }
      if (resource.createdByTutorId && this.tutorId) {
        return resource.createdByTutorId === this.tutorId;
      }
      return false;
    }

    if (this.isUserScoped) {
      if (resource.userId) {
        return resource.userId === this.userId;
      }
      if (resource.parentId) {
        return resource.parentId === this.userId;
      }
      return false;
    }

    return false;
  }

  /**
   * Ensure context is initialized
   */
  private ensureInitialized(): void {
    if (!this._context || !this._type) {
      throw new Error(
        'DataScopeContext not initialized. Ensure DataScopeInterceptor is applied.',
      );
    }
  }
}
