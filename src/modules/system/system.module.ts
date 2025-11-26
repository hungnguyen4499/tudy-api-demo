import { Module, Global } from '@nestjs/common';
import { DbModule } from '@/infrastructure/db/db.module';
import { CacheModule } from '@/infrastructure/cache/cache.module';

// Controllers
import { RolesController } from './controllers/roles.controller';
import { PermissionsController } from './controllers/permissions.controller';
import { MenusAdminController } from './controllers/menus-admin.controller';
import { MenusController } from './controllers/menus.controller';

// Services
import { RolesService } from './services/roles.service';
import { PermissionsService } from './services/permissions.service';
import { MenusAdminService } from './services/menus-admin.service';

// Repositories
import { RolesRepository } from './repositories/roles.repository';
import { PermissionsRepository } from './repositories/permissions.repository';
import { MenusRepository } from './repositories/menus.repository';

// Mappers
import { RoleMapper } from './mappers/role.mapper';
import { PermissionMapper } from './mappers/permission.mapper';
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
 * - ScopeInterceptor (registered globally in AppModule)
 *
 * Architecture follows layered pattern:
 * Controller → Service → Repository → Database
 *
 * @Global - Available everywhere without importing
 */
@Global()
@Module({
  imports: [DbModule, CacheModule],
  controllers: [
    RolesController,
    PermissionsController,
    MenusAdminController,
    MenusController,
  ],
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
    MenusAdminService,

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
