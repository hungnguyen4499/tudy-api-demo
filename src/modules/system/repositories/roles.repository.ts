import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/db/prisma.service';
import { RoleMapper } from '../mappers/role.mapper';
import { Role } from '../entities/role.entity';
import { CreateRoleRequest, UpdateRoleRequest } from '../dto';
import { DataScopeType } from '@/common/constants';

/**
 * Roles Repository - Database access layer
 * Returns Entity objects, not Prisma models
 */
@Injectable()
export class RolesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: RoleMapper,
  ) {}

  /**
   * Find all roles with relations
   */
  async findAll(): Promise<Role[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        menus: {
          include: {
            menu: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return this.mapper.toEntityList(roles);
  }

  /**
   * Find role by ID
   */
  async findById(id: number): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        menus: {
          include: {
            menu: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
    });

    if (!role) {
      return null;
    }

    return this.mapper.toEntity(role);
  }

  /**
   * Find role by ID with assigned users
   */
  async findByIdWithUsers(
    id: number,
  ): Promise<{
    role: Role;
    assignedUsers: Array<{ id: number; email: string; firstName: string; lastName: string }>;
  } | null> {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        menus: {
          include: {
            menu: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      return null;
    }

    const assignedUsers = role.userRoles.map((ur) => ({
      id: ur.user.id,
      email: ur.user.email,
      firstName: ur.user.firstName,
      lastName: ur.user.lastName,
    }));

    return {
      role: this.mapper.toEntity({
        ...role,
        _count: { userRoles: assignedUsers.length },
      }),
      assignedUsers,
    };
  }

  /**
   * Find role by name
   */
  async findByName(name: string): Promise<Role | null> {
    const role = await this.prisma.role.findUnique({
      where: { name },
    });

    if (!role) {
      return null;
    }

    return this.mapper.toEntity(role);
  }

  /**
   * Create new role
   */
  async create(data: CreateRoleRequest): Promise<Role> {
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        dataScope: data.dataScope,
        isSystem: false,
      },
    });

    return this.mapper.toEntity(role);
  }

  /**
   * Update role
   */
  async update(id: number, data: UpdateRoleRequest): Promise<Role> {
    const role = await this.prisma.role.update({
      where: { id },
      data: {
        displayName: data.displayName,
        description: data.description,
        dataScope: data.dataScope,
      },
    });

    return this.mapper.toEntity(role);
  }

  /**
   * Delete role
   */
  async delete(id: number): Promise<void> {
    await this.prisma.role.delete({ where: { id } });
  }

  /**
   * Assign permissions to role
   */
  async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    await this.prisma.$transaction([
      // Remove existing permissions
      this.prisma.rolePermission.deleteMany({
        where: { roleId },
      }),
      // Add new permissions
      this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  /**
   * Remove permission from role
   */
  async removePermission(roleId: number, permissionId: number): Promise<void> {
    await this.prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Assign menus to role
   */
  async assignMenus(roleId: number, menuIds: number[]): Promise<void> {
    await this.prisma.$transaction([
      // Remove existing menus
      this.prisma.roleMenu.deleteMany({
        where: { roleId },
      }),
      // Add new menus
      this.prisma.roleMenu.createMany({
        data: menuIds.map((menuId) => ({
          roleId,
          menuId,
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  /**
   * Get user IDs assigned to role
   */
  async getAssignedUserIds(roleId: number): Promise<number[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });

    return userRoles.map((ur) => ur.userId);
  }

  /**
   * Check if role is assigned to user
   */
  async isRoleAssignedToUser(userId: number, roleId: number): Promise<boolean> {
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });

    return userRole !== null;
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(
    userId: number,
    roleId: number,
    assignedBy: number,
  ): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
        assignedAt: new Date(),
      },
    });
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
    await this.prisma.userRole.delete({
      where: {
        userId_roleId: {
          userId,
          roleId,
        },
      },
    });
  }

  /**
   * Find roles by data scope (for filtering assignable roles)
   * 
   * Scope rules:
   * - GLOBAL: can assign GLOBAL, ORGANIZATION, USER roles
   * - ORGANIZATION: can only assign ORGANIZATION roles (not USER)
   * - USER: cannot assign any roles
   */
  async findByDataScope(maxScope: DataScopeType): Promise<Role[]> {
    let allowedScopes: DataScopeType[];

    if (maxScope === DataScopeType.GLOBAL) {
      // GLOBAL can assign all scopes
      allowedScopes = [DataScopeType.GLOBAL, DataScopeType.ORGANIZATION, DataScopeType.USER];
    } else if (maxScope === DataScopeType.ORGANIZATION) {
      // ORGANIZATION can only assign ORGANIZATION scope roles
      allowedScopes = [DataScopeType.ORGANIZATION];
    } else {
      // USER cannot assign any roles (should not reach here)
      allowedScopes = [];
    }

    const roles = await this.prisma.role.findMany({
      where: {
        dataScope: {
          in: allowedScopes,
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        menus: {
          include: {
            menu: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return this.mapper.toEntityList(roles);
  }
}
