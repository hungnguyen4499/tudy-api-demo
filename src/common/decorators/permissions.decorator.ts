import { SetMetadata, applyDecorators } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const PERMISSIONS_MODE_KEY = 'permissions_mode';

export type PermissionsMode = 'ALL' | 'ANY';

/**
 * Require a single permission
 * Usage: @RequirePermission('product.create')
 */
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSIONS_KEY, [permission]);

/**
 * Require ALL of the specified permissions (AND logic)
 * Usage: @RequirePermissions('product.read', 'product.update')
 */
export const RequirePermissions = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MODE_KEY, 'ALL'),
  );

/**
 * Require ANY of the specified permissions (OR logic)
 * Usage: @RequireAnyPermission('product.create', 'product.update')
 */
export const RequireAnyPermission = (...permissions: string[]) =>
  applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    SetMetadata(PERMISSIONS_MODE_KEY, 'ANY'),
  );

/**
 * Mark endpoint as requiring no permissions (override class-level permissions)
 * Usage: @NoPermissionsRequired()
 */
export const NoPermissionsRequired = () => SetMetadata(PERMISSIONS_KEY, null);
