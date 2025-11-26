import { Injectable, Logger } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/business.exception';
import { ErrorCodes, DataScopeType } from '@/common/constants';
import { UserContextService } from '@/common/services/user-context.service';
import { PrismaService } from '@/infrastructure/db/prisma.service';
import { RolesRepository } from '@/modules/system';
import { RoleMapper } from '@/modules/system';
import { Role } from '@/modules/system';
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
    private readonly prisma: PrismaService,
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
      throw new BusinessException(ErrorCodes.ROLE_NOT_FOUND);
    }

    return this.mapper.toDetailResponse(result.role, result.assignedUsers);
  }

  /**
   * Create new role
   */
  async create(request: CreateRoleRequest): Promise<RoleResponse> {
    const existing = await this.rolesRepository.findByName(request.name);
    if (existing) {
      throw new BusinessException(ErrorCodes.ROLE_NAME_EXISTS);
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
      throw new BusinessException(ErrorCodes.ROLE_NOT_FOUND);
    }

    if (!role.isModifiable) {
      throw new BusinessException(ErrorCodes.ROLE_NOT_MODIFIABLE);
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
      throw new BusinessException(ErrorCodes.ROLE_NOT_FOUND);
    }

    if (!role.isModifiable) {
      throw new BusinessException(ErrorCodes.ROLE_NOT_MODIFIABLE);
    }

    if (!role.canDelete()) {
      throw new BusinessException(ErrorCodes.ROLE_HAS_USERS);
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
      throw new BusinessException(ErrorCodes.ROLE_NOT_FOUND);
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
      throw new BusinessException(ErrorCodes.ROLE_NOT_FOUND);
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
      throw new BusinessException(ErrorCodes.ROLE_NOT_FOUND);
    }

    await this.rolesRepository.assignMenus(roleId, menuIds);
    await this.invalidateRoleUsers(roleId);
  }

  /**
   * Assign role to user with scope validation
   */
  async assignRoleToUser(
    currentUserId: number,
    targetUserId: number,
    roleId: number,
  ): Promise<void> {
    // 1. Load current user context (dataScope, organizationId)
    const currentUserContext =
      await this.userContextService.loadContext(currentUserId);

    // 2. Get target role
    const role = await this.rolesRepository.findById(roleId);
    if (!role) {
      throw new BusinessException(ErrorCodes.ROLE_NOT_FOUND);
    }

    // 3. Get target user's organization ID
    const targetUserOrg = await (
      this.prisma as any
    ).organizationMember.findUnique({
      where: { userId: targetUserId },
      select: { organizationId: true },
    });

    // 4. Validate scope rules
    this.validateRoleAssignment(
      currentUserContext,
      role,
      targetUserOrg?.organizationId || null,
    );

    // 5. Check if role is already assigned
    const isAssigned = await this.rolesRepository.isRoleAssignedToUser(
      targetUserId,
      roleId,
    );
    if (isAssigned) {
      throw new BusinessException(ErrorCodes.ROLE_ALREADY_ASSIGNED);
    }

    // 6. Assign role
    await this.rolesRepository.assignRoleToUser(
      targetUserId,
      roleId,
      currentUserId,
    );

    // 7. Invalidate target user's cache
    await this.userContextService.invalidateContext(targetUserId);

    this.logger.log(
      `User ${currentUserId} assigned role ${roleId} to user ${targetUserId}`,
    );
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(
    currentUserId: number,
    targetUserId: number,
    roleId: number,
  ): Promise<void> {
    // Check if role is assigned
    const isAssigned = await this.rolesRepository.isRoleAssignedToUser(
      targetUserId,
      roleId,
    );
    if (!isAssigned) {
      throw new BusinessException(ErrorCodes.ROLE_NOT_FOUND);
    }

    // Remove role
    await this.rolesRepository.removeRoleFromUser(targetUserId, roleId);

    // Invalidate target user's cache
    await this.userContextService.invalidateContext(targetUserId);

    this.logger.log(
      `User ${currentUserId} removed role ${roleId} from user ${targetUserId}`,
    );
  }

  /**
   * Get assignable roles based on current user's data scope
   */
  async getAssignableRoles(currentUserId: number): Promise<RoleResponse[]> {
    const currentUserContext =
      await this.userContextService.loadContext(currentUserId);

    const roles = await this.rolesRepository.findByDataScope(
      currentUserContext.dataScope,
    );

    return this.mapper.toResponseList(roles);
  }

  /**
   * Validate role assignment based on scope rules
   */
  private validateRoleAssignment(
    currentUserContext: {
      dataScope: DataScopeType;
      organizationId: number | null;
    },
    targetRole: Role,
    targetUserOrgId: number | null,
  ): void {
    const currentScope = currentUserContext.dataScope;
    const targetScope = targetRole.dataScope;

    // Rule 1: USER scope cannot assign roles
    if (currentScope === DataScopeType.USER) {
      throw new BusinessException(ErrorCodes.INSUFFICIENT_SCOPE_TO_ASSIGN_ROLE);
    }

    // Rule 2: ORGANIZATION scope can only assign ORGANIZATION scope roles
    if (currentScope === DataScopeType.ORGANIZATION) {
      // Cannot assign GLOBAL roles
      if (targetScope === DataScopeType.GLOBAL) {
        throw new BusinessException(ErrorCodes.CANNOT_ASSIGN_GLOBAL_ROLE);
      }

      // Cannot assign USER scope roles (only ORGANIZATION scope)
      if (targetScope === DataScopeType.USER) {
        throw new BusinessException(
          ErrorCodes.INSUFFICIENT_SCOPE_TO_ASSIGN_ROLE,
          'ORGANIZATION scope can only assign ORGANIZATION scope roles',
        );
      }

      // Must assign to same organization
      if (
        currentUserContext.organizationId === null ||
        targetUserOrgId === null
      ) {
        throw new BusinessException(
          ErrorCodes.CANNOT_ASSIGN_ROLE_DIFFERENT_ORG,
        );
      }

      if (currentUserContext.organizationId !== targetUserOrgId) {
        throw new BusinessException(
          ErrorCodes.CANNOT_ASSIGN_ROLE_DIFFERENT_ORG,
        );
      }
    }

    // Rule 3: GLOBAL scope can assign any scope role
    // (No additional validation needed - already handled above)
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
