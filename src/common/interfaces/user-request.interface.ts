import { Request } from 'express';

/**
 * User object attached to request by JWT Strategy
 * 
 * OPTIMIZATION: JWT Strategy only provides userId and email
 * Full context (roles, permissions, organizationId, tutorId) is loaded
 * by UserContextService in DataScopeInterceptor and available via DataScopeContext
 */
export interface RequestUser {
  userId: number;
  email: string;
  // Note: roles, organizationId, tutorId are loaded by UserContextService
  // Access via DataScopeContext or UserContextService instead
}

export interface UserRequest extends Request {
  user: RequestUser;
}

