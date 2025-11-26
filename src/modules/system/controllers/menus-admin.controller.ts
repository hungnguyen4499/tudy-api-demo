import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/permissions.decorator';
import { MenusAdminService } from '../services/menus-admin.service';
import {
  CreateMenuRequest,
  UpdateMenuRequest,
  UpdateMenuOrderRequest,
  UpdateMenuVisibilityRequest,
} from '../dto';

/**
 * Menus Admin Controller
 */
@ApiTags('System - Menus')
@ApiBearerAuth()
@Controller('system/menus')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MenusAdminController {
  constructor(private readonly menusAdminService: MenusAdminService) {}

  @ApiOperation({ summary: 'List all menus' })
  @RequirePermission('menu.read')
  @Get()
  findAll() {
    return this.menusAdminService.findAll();
  }

  @ApiOperation({ summary: 'Get menu tree' })
  @RequirePermission('menu.read')
  @Get('tree')
  getMenuTree() {
    return this.menusAdminService.getMenuTree();
  }

  @ApiOperation({ summary: 'Get menu by ID' })
  @RequirePermission('menu.read')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.menusAdminService.findOne(id);
  }

  @ApiOperation({ summary: 'Create menu' })
  @RequirePermission('menu.create')
  @Post()
  create(@Body() request: CreateMenuRequest) {
    return this.menusAdminService.create(request);
  }

  @ApiOperation({ summary: 'Update menu' })
  @RequirePermission('menu.update')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() request: UpdateMenuRequest) {
    return this.menusAdminService.update(id, request);
  }

  @ApiOperation({ summary: 'Delete menu' })
  @RequirePermission('menu.delete')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.menusAdminService.delete(id);
  }

  @ApiOperation({ summary: 'Update menu order' })
  @RequirePermission('menu.update')
  @Patch(':id/order')
  updateOrder(@Param('id', ParseIntPipe) id: number, @Body() request: UpdateMenuOrderRequest) {
    return this.menusAdminService.updateOrder(id, request.sortOrder);
  }

  @ApiOperation({ summary: 'Toggle menu visibility' })
  @RequirePermission('menu.update')
  @Patch(':id/visibility')
  toggleVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateMenuVisibilityRequest,
  ) {
    return this.menusAdminService.toggleVisibility(id, request.isVisible);
  }
}
