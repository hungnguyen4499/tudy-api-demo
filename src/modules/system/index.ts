/**
 * System Module Exports
 *
 * This module is @Global, so all services are automatically available
 * in other modules without importing.
 *
 * Architecture: Controller → Service → Repository → Database
 */

// Module
export * from './system.module';

// Entities (domain models)
export * from './entities';

// DTOs (request/response)
export * from './dto';

// Mappers (layer conversion)
export * from './mappers';

// Repositories (data access)
export * from './repositories';

// Services (business logic)
export * from './services/roles.service';
export * from './services/permissions.service';
export * from './services/permission.service';
export * from './services/menu.service';

// Common services (exported globally)
export {
  DataScopeContext,
  DataScopeType,
} from '@/common/services/data-scope-context.service';
export { UserContextService } from '@/common/services/user-context.service';
