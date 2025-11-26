import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateMenuRequest,
  UpdateMenuOrderRequest,
  UpdateMenuRequest,
  UpdateMenuVisibilityRequest,
} from '../dto';
import { RequirePermission } from '@/common/decorators/permissions.decorator';
import { MenuService } from '../services/menu.service';
import { PermissionService } from '../services/permission.service';

/**
 * Menus Controller
 * Provides endpoints for menu consumption (current user)
 * and menu administration (CRUD & configuration).
 */
@ApiTags('System')
@ApiBearerAuth()
@Controller('system/menus')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MenusController {
  constructor(
    private readonly menuService: MenuService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Get user's accessible menus (for rendering UI)
   */
  @Get('me')
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
  @Get('me/sidebar')
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
  // ------------------------------------------------------
  // Admin endpoints (CRUD & configuration)
  // ------------------------------------------------------

  @ApiOperation({ summary: 'List all menus' })
  @RequirePermission('menu.read')
  @Get()
  async findAll() {
    return this.menuService.findAll();
  }

  @ApiOperation({ summary: 'Get menu tree' })
  @RequirePermission('menu.read')
  @Get('tree')
  async getMenuTree() {
    return this.menuService.getMenuTree();
  }

  @ApiOperation({ summary: 'Get menu by ID' })
  @RequirePermission('menu.read')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.findOne(id);
  }

  @ApiOperation({ summary: 'Create menu' })
  @RequirePermission('menu.create')
  @Post()
  async create(@Body() request: CreateMenuRequest) {
    return this.menuService.create(request);
  }

  @ApiOperation({ summary: 'Update menu' })
  @RequirePermission('menu.update')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateMenuRequest,
  ) {
    return this.menuService.update(id, request);
  }

  @ApiOperation({ summary: 'Delete menu' })
  @RequirePermission('menu.delete')
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.delete(id);
  }

  @ApiOperation({ summary: 'Update menu order' })
  @RequirePermission('menu.update')
  @Patch(':id/order')
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateMenuOrderRequest,
  ) {
    return this.menuService.updateOrder(id, request.sortOrder);
  }

  @ApiOperation({ summary: 'Toggle menu visibility' })
  @RequirePermission('menu.update')
  @Patch(':id/visibility')
  async toggleVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateMenuVisibilityRequest,
  ) {
    return this.menuService.toggleVisibility(id, request.isVisible);
  }
}
