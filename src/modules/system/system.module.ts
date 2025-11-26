import { Module, Global } from '@nestjs/common';
import { DbModule } from '@/infrastructure/db/db.module';
import { CacheModule } from '@/infrastructure/cache/cache.module';

// Controllers
import { RolesController } from './controllers/roles.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { MenusController } from './controllers/menus.controller';

// Services
import { RolesService } from './services/roles.service';
import { PermissionsService } from './services/permissions.service';

// Repositories
import { RolesRepository } from '@/modules/system/repositories';
import { PermissionsRepository } from '@/modules/system/repositories';
import { MenusRepository } from '@/modules/system/repositories';

// Mappers
import { RoleMapper } from './mappers/role.mapper';
import { PermissionMapper } from '@/modules/system/mappers';
import { MenuMapper } from './mappers/menu.mapper';

// Common Services
import { PermissionService } from './services/permission.service';
import { MenuService } from './services/menu.service';
import { UserContextService } from '@/common/services/user-context.service';

/**
 * System Module
 * Handles all system-level concerns:
 * - RBAC (Roles & Permissions)
 * - Menu system (Dynamic UI)
 * - System settings (Future)
 * - Audit logs (Future)
 *
 * Note: Scope-based access control is handled via:
 * - DataScopeContext service (common/services)
 * - DataScopeInterceptor (registered globally in AppModule)
 *
 * Architecture follows layered pattern:
 * Controller → Service → Repository → Database
 *
 * @Global - Available everywhere without importing
 */
@Global()
@Module({
  imports: [DbModule, CacheModule],
  controllers: [RolesController, PermissionsController, MenusController],
  providers: [
    // Mappers (shared across layers, order matters for DI)
    PermissionMapper,
    MenuMapper,
    RoleMapper,

    // Repositories (data access layer)
    RolesRepository,
    PermissionsRepository,
    MenusRepository,

    // Services (business logic layer)
    RolesService,
    PermissionsService,

    // Common authorization services
    PermissionService,
    MenuService,
    UserContextService,
  ],
  exports: [
    // Export for use in other modules
    PermissionService,
    MenuService,
    UserContextService,

    // Export mappers for reuse if needed
    RoleMapper,
    PermissionMapper,
    MenuMapper,
  ],
})
export class SystemModule {}
