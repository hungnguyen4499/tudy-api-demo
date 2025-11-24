import { SetMetadata } from '@nestjs/common';

/**
 * Public Decorator
 * Marks route as public (no authentication required)
 */
export const Public = () => SetMetadata('isPublic', true);

