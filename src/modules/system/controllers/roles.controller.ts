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
import { RolesService } from '@/modules/system';
import {
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignPermissionsRequest,
  AssignMenusRequest,
} from '../dto';

/**
 * Roles Management Controller
 */
@ApiTags('System - Roles')
@ApiBearerAuth()
@Controller('system/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'List all roles' })
  @RequirePermission('role.read')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @ApiOperation({ summary: 'Get role by ID' })
  @RequirePermission('role.read')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @ApiOperation({ summary: 'Create role' })
  @RequirePermission('role.create')
  @Post()
  create(@Body() request: CreateRoleRequest) {
    return this.rolesService.create(request);
  }

  @ApiOperation({ summary: 'Update role' })
  @RequirePermission('role.update')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdateRoleRequest,
  ) {
    return this.rolesService.update(id, request);
  }

  @ApiOperation({ summary: 'Delete role' })
  @RequirePermission('role.delete')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.delete(id);
  }

  @ApiOperation({ summary: 'Assign permissions to role' })
  @RequirePermission('role.update')
  @Post(':id/permissions')
  assignPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: AssignPermissionsRequest,
  ) {
    return this.rolesService.assignPermissions(id, request.permissionIds);
  }

  @ApiOperation({ summary: 'Remove permission from role' })
  @RequirePermission('role.update')
  @Delete(':id/permissions/:permissionId')
  removePermission(
    @Param('id', ParseIntPipe) id: number,
    @Param('permissionId', ParseIntPipe) permissionId: number,
  ) {
    return this.rolesService.removePermission(id, permissionId);
  }

  @ApiOperation({ summary: 'Assign menus to role' })
  @RequirePermission('role.update')
  @Post(':id/menus')
  assignMenus(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: AssignMenusRequest,
  ) {
    return this.rolesService.assignMenus(id, request.menuIds);
  }
}
