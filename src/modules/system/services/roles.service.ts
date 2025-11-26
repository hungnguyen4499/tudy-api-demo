import { Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/business.exception';
import { SystemErrors } from '@/common/constants/error-codes.constant';
import { UserContextService } from '@/common/services/user-context.service';
import { RolesRepository } from '@/modules/system';
import { RoleMapper } from '@/modules/system';
import {
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleResponse,
  RoleDetailResponse,
} from '../dto';

/**
 * Roles Service - Business logic layer
 */
@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    private readonly rolesRepository: RolesRepository,
    private readonly mapper: RoleMapper,
    private readonly userContextService: UserContextService,
  ) {}

  /**
   * List all roles
   */
  async findAll(): Promise<RoleResponse[]> {
    const roles = await this.rolesRepository.findAll();
    return this.mapper.toResponseList(roles);
  }

  /**
   * Get role by ID with details
   */
  async findOne(id: number): Promise<RoleDetailResponse> {
    const result = await this.rolesRepository.findByIdWithUsers(id);

    if (!result) {
      throw new BusinessException(SystemErrors.ROLE_NOT_FOUND);
    }

    return this.mapper.toDetailResponse(result.role, result.assignedUsers);
  }

  /**
   * Create new role
   */
  async create(request: CreateRoleRequest): Promise<RoleResponse> {
    const existing = await this.rolesRepository.findByName(request.name);
    if (existing) {
      throw new BusinessException(SystemErrors.ROLE_NAME_EXISTS);
    }

    const role = await this.rolesRepository.create(request);
    return this.mapper.toResponse(role);
  }

  /**
   * Update role
   */
  async update(id: number, request: UpdateRoleRequest): Promise<RoleResponse> {
    const role = await this.rolesRepository.findById(id);

    if (!role) {
      throw new BusinessException(SystemErrors.ROLE_NOT_FOUND);
    }

    if (!role.isModifiable) {
      throw new BusinessException(SystemErrors.ROLE_NOT_MODIFIABLE);
    }

    const updated = await this.rolesRepository.update(id, request);
    await this.invalidateRoleUsers(id);

    return this.mapper.toResponse(updated);
  }

  /**
   * Delete role
   */
  async delete(id: number): Promise<void> {
    const role = await this.rolesRepository.findById(id);

    if (!role) {
      throw new BusinessException(SystemErrors.ROLE_NOT_FOUND);
    }

    if (!role.isModifiable) {
      throw new BusinessException(SystemErrors.ROLE_NOT_MODIFIABLE);
    }

    if (!role.canDelete()) {
      throw new BusinessException(SystemErrors.ROLE_HAS_USERS);
    }

    await this.rolesRepository.delete(id);
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    const role = await this.rolesRepository.findById(roleId);

    if (!role) {
      throw new BusinessException(SystemErrors.ROLE_NOT_FOUND);
    }

    await this.rolesRepository.assignPermissions(roleId, permissionIds);
    await this.invalidateRoleUsers(roleId);
  }

  /**
   * Remove permission from role
   */
  async removePermission(roleId: number, permissionId: number): Promise<void> {
    const role = await this.rolesRepository.findById(roleId);

    if (!role) {
      throw new BusinessException(SystemErrors.ROLE_NOT_FOUND);
    }

    await this.rolesRepository.removePermission(roleId, permissionId);
    await this.invalidateRoleUsers(roleId);
  }

  /**
   * Assign menus to role
   */
  async assignMenus(roleId: number, menuIds: number[]): Promise<void> {
    const role = await this.rolesRepository.findById(roleId);

    if (!role) {
      throw new BusinessException(SystemErrors.ROLE_NOT_FOUND);
    }

    await this.rolesRepository.assignMenus(roleId, menuIds);
    await this.invalidateRoleUsers(roleId);
  }

  /**
   * Invalidate cache for all users with this role
   */
  private async invalidateRoleUsers(roleId: number): Promise<void> {
    const userIds = await this.rolesRepository.getAssignedUserIds(roleId);

    if (userIds.length > 0) {
      this.logger.debug(`Invalidating cache for ${userIds.length} users`);
      await this.userContextService.invalidateContexts(userIds);
    }
  }
}
