import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
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
export class DataScopeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DataScopeInterceptor.name);

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
        const userContext = await this.userContextService.loadContext(
          user.userId,
        );

        const contextId = ContextIdFactory.getByRequest(request);
        const dataScopeContext = await this.moduleRef.resolve(
          DataScopeContext,
          contextId,
          { strict: false },
        );

        // Initialize data scope context
        dataScopeContext.initialize(userContext);
      } catch (error) {
        // If context loading fails, throw error - user context is required
        // This ensures user validation (status, roles) happens in UserContextService
        this.logger.error(
          `Failed to load user context for user ${user.userId}:`,
          error,
        );
        throw new Error(
          `Failed to load user context: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    return next.handle();
  }
}
