import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@/common/constants';

/**
 * Roles Decorator
 * Specifies which roles can access the route
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

