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
import { PermissionsService } from '@/modules/system';
import { CreatePermissionRequest, UpdatePermissionRequest } from '../dto';

/**
 * Permissions Management Controller
 */
@ApiTags('System - Permissions')
@ApiBearerAuth()
@Controller('system/permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({ summary: 'List all permissions' })
  @RequirePermission('permission.read')
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @ApiOperation({ summary: 'Get permissions grouped by resource' })
  @RequirePermission('permission.read')
  @Get('grouped')
  findGrouped() {
    return this.permissionsService.findGrouped();
  }

  @ApiOperation({ summary: 'Get permission by ID' })
  @RequirePermission('permission.read')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create permission' })
  @RequirePermission('permission.create')
  @Post()
  create(@Body() request: CreatePermissionRequest) {
    return this.permissionsService.create(request);
  }

  @ApiOperation({ summary: 'Update permission' })
  @RequirePermission('permission.update')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() request: UpdatePermissionRequest,
  ) {
    return this.permissionsService.update(id, request);
  }

  @ApiOperation({ summary: 'Delete permission' })
  @RequirePermission('permission.delete')
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.delete(id);
  }
}
