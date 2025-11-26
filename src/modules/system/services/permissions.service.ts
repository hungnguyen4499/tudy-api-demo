import { Injectable } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/business.exception';
import { SystemErrors } from '@/common/constants/error-codes.constant';
import { PermissionsRepository } from '../repositories/permissions.repository';
import { PermissionMapper } from '../mappers/permission.mapper';
import {
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PermissionResponse,
  PermissionGroupResponse,
} from '../dto';

/**
 * Permissions Service - Business logic layer
 */
@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
    private readonly mapper: PermissionMapper,
  ) {}

  /**
   * List all permissions
   */
  async findAll(): Promise<PermissionResponse[]> {
    const permissions = await this.permissionsRepository.findAll();
    return this.mapper.toResponseList(permissions);
  }

  /**
   * Get permissions grouped by resource
   */
  async findGrouped(): Promise<PermissionGroupResponse[]> {
    const grouped = await this.permissionsRepository.findGrouped();

    const result: PermissionGroupResponse[] = [];

    for (const [resource, permissions] of grouped) {
      result.push({
        resource,
        permissions: this.mapper.toResponseList(permissions),
        count: permissions.length,
      });
    }

    return result;
  }

  /**
   * Get permission by ID
   */
  async findOne(id: number): Promise<PermissionResponse> {
    const permission = await this.permissionsRepository.findById(id);

    if (!permission) {
      throw new BusinessException(SystemErrors.PERMISSION_NOT_FOUND);
    }

    return this.mapper.toResponse(permission);
  }

  /**
   * Create new permission
   */
  async create(request: CreatePermissionRequest): Promise<PermissionResponse> {
    const existing = await this.permissionsRepository.findByCode(request.code);
    if (existing) {
      throw new BusinessException(SystemErrors.PERMISSION_CODE_EXISTS);
    }

    const permission = await this.permissionsRepository.create(request);
    return this.mapper.toResponse(permission);
  }

  /**
   * Update permission
   */
  async update(id: number, request: UpdatePermissionRequest): Promise<PermissionResponse> {
    const permission = await this.permissionsRepository.findById(id);

    if (!permission) {
      throw new BusinessException(SystemErrors.PERMISSION_NOT_FOUND);
    }

    const updated = await this.permissionsRepository.update(id, request);
    return this.mapper.toResponse(updated);
  }

  /**
   * Delete permission
   */
  async delete(id: number): Promise<void> {
    const result = await this.permissionsRepository.findByIdWithCounts(id);

    if (!result) {
      throw new BusinessException(SystemErrors.PERMISSION_NOT_FOUND);
    }

    if (result.rolesCount > 0 || result.menusCount > 0) {
      throw new BusinessException(
        SystemErrors.PERMISSION_IN_USE,
        `Cannot delete: ${result.rolesCount} roles and ${result.menusCount} menus using this permission`,
      );
    }

    await this.permissionsRepository.delete(id);
  }
}
