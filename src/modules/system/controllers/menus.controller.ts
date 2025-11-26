import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { MenuService } from '../services/menu.service';
import { PermissionService } from '../services/permission.service';

/**
 * Menus Controller
 * Provides endpoints for loading user's menus and permissions
 */
@Controller('system')
@UseGuards(JwtAuthGuard)
export class MenusController {
  constructor(
    private readonly menuService: MenuService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Get user's accessible menus (for rendering UI)
   */
  @Get('menus')
  async getMenus(@CurrentUser() user: { userId: number }) {
    const menus = await this.menuService.getUserMenus(user.userId);
    return { menus };
  }

  /**
   * Get user's permissions (for checking on frontend)
   */
  @Get('permissions')
  async getPermissions(@CurrentUser() user: { userId: number }) {
    const permissions = await this.permissionService.getUserPermissions(
      user.userId,
    );
    return { permissions };
  }

  /**
   * Get user's sidebar menus
   */
  @Get('menus/sidebar')
  async getSidebarMenus(@CurrentUser() user: { userId: number }) {
    const menus = await this.menuService.getSidebarMenus(user.userId);
    return { menus };
  }

  /**
   * Get permissions for a specific resource
   * Example: GET /auth/permissions/product → ["product.create", "product.read", ...]
   */
  @Get('permissions/:resource')
  async getResourcePermissions(
    @CurrentUser() user: { userId: number },
    resource: string,
  ) {
    const permissions = await this.permissionService.getPermissionsByResource(
      user.userId,
      resource,
    );
    return { resource, permissions };
  }
}
