import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ModuleRef, ContextIdFactory } from '@nestjs/core';
import { Observable } from 'rxjs';
import { DataScopeContext, UserContextService } from '@/common/services';

/**
 * Scope Interceptor
 * Initializes DataScopeContext for each authenticated request
 * Works alongside JwtAuthGuard - runs after authentication
 */
@Injectable()
export class ScopeInterceptor implements NestInterceptor {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly userContextService: UserContextService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only initialize scope for authenticated requests
    if (user?.userId) {
      try {
        // Load full user context (with Redis caching)
        const userContext = await this.userContextService.loadContext(user.userId);

        const contextId = ContextIdFactory.getByRequest(request);
        const dataScopeContext = await this.moduleRef.resolve(
          DataScopeContext,
          contextId,
          { strict: false },
        );

        // Initialize data scope context
        dataScopeContext.initialize(userContext);
      } catch {
        // If context loading fails, create minimal context from JWT data
        // Default to USER data scope (most restrictive) if we can't load from DB
        const minimalContext = {
          userId: user.userId,
          role: user.role || 'PARENT',
          organizationId: user.organizationId || null,
          tutorId: user.tutorId || null,
          permissions: [],
          menuCodes: [],
          dataScope: 'USER' as const, // Default to most restrictive
        };
        const contextId = ContextIdFactory.getByRequest(request);
        const dataScopeContext = await this.moduleRef.resolve(
          DataScopeContext,
          contextId,
          { strict: false },
        );
        dataScopeContext.initialize(minimalContext);
      }
    }

    return next.handle();
  }
}
