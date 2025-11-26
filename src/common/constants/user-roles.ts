/**
 * User Role Enum
 * Legacy enum for backward compatibility (e.g., registration)
 * 
 * Note: User roles are now managed via UserRole (RBAC) in database.
 * This enum is only used for:
 * - Registration (mapping to Role.name)
 * - Type safety in RegisterRequest
 * 
 * Role names in database should match these values (lowercase):
 * - PARENT → "parent"
 * - TUTOR → "tutor"
 * - PARTNER_STAFF → "partner_staff"
 * - PARTNER_ADMIN → "partner_admin"
 * - KIGGLE_STAFF → "kiggle_staff"
 * - KIGGLE_ADMIN → "kiggle_admin"
 */
export enum UserRole {
  PARENT = 'PARENT',
  TUTOR = 'TUTOR',
  PARTNER_STAFF = 'PARTNER_STAFF',
  PARTNER_ADMIN = 'PARTNER_ADMIN',
  KIGGLE_STAFF = 'KIGGLE_STAFF',
  KIGGLE_ADMIN = 'KIGGLE_ADMIN',
}

/**
 * Re-export UserStatus from Prisma
 */
export { UserStatus } from '@prisma/client';
