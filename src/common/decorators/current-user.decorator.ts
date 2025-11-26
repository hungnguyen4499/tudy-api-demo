import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '@/common/interfaces/user-request.interface';

/**
 * Current User Decorator
 * Extracts user from request (set by JWT guard)
 *
 * Usage:
 * @CurrentUser() user - Get full user object
 * @CurrentUser('userId') userId - Get specific field
 * @CurrentUser('roles') roles - Get all active roles
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser;

    return data ? user?.[data] : user;
  },
);
