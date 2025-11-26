import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserResponse, UpdateUserRequest, UsersQuery } from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermission } from '@/common/decorators/permissions.decorator';
import { PageResult } from '@/common/dto/page-result.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermission('user.manage')
  @ApiOperation({ summary: 'Get all users with pagination (Admin only)' })
  async findAll(@Query() query: UsersQuery) {
    const result = await this.usersService.findAll(query);
    return PageResult.create(result.items, result.page, result.pageSize, result.total);
  }

  @Get(':id')
  @RequirePermission('user.manage')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('user.manage')
  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id', ParseIntPipe) id: number, @Body() request: UpdateUserRequest) {
    return this.usersService.update(id, request);
  }

  @Delete(':id')
  @RequirePermission('user.manage')
  @ApiOperation({ summary: 'Delete user (soft delete) (Admin only)' })
  @ApiParam({ name: 'id', type: Number })
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.delete(id);
  }
}
