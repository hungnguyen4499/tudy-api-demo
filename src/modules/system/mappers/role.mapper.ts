import { Injectable } from '@nestjs/common';
import { Role as PrismaRole, Permission as PrismaPermission, Menu as PrismaMenu } from '@prisma/client';
import { Role } from '../entities/role.entity';
import { RoleResponse, RoleDetailResponse, AssignedUserResponse } from '../dto';
import { PermissionMapper } from './permission.mapper';
import { MenuMapper } from './menu.mapper';

type PrismaRoleWithRelations = PrismaRole & {
  permissions?: Array<{ permission: PrismaPermission }>;
  menus?: Array<{ menu: PrismaMenu }>;
  _count?: { userRoles: number };
};

/**
 * Role Mapper
 * Handles mapping between Prisma models, Role entities, and DTOs
 */
@Injectable()
export class RoleMapper {
  constructor(
    private readonly permissionMapper: PermissionMapper,
    private readonly menuMapper: MenuMapper,
  ) {}

  /**
   * Prisma Model → Entity
   */
  toEntity(prismaRole: PrismaRoleWithRelations): Role {
    return new Role({
      id: prismaRole.id,
      name: prismaRole.name,
      displayName: prismaRole.displayName,
      description: prismaRole.description,
      isSystem: prismaRole.isSystem,
      createdAt: prismaRole.createdAt,
      updatedAt: prismaRole.updatedAt,
      permissions: prismaRole.permissions?.map((rp) =>
        this.permissionMapper.toEntity(rp.permission),
      ),
      menus: prismaRole.menus?.map((rm) =>
        this.menuMapper.toEntity(rm.menu as any),
      ),
      usersCount: prismaRole._count?.userRoles,
    });
  }

  /**
   * Entity → Response DTO (list view)
   */
  toResponse(entity: Role): RoleResponse {
    return {
      id: entity.id,
      name: entity.name,
      displayName: entity.displayName,
      description: entity.description,
      isSystem: entity.isSystem,
      permissionsCount: entity.permissions?.length ?? 0,
      menusCount: entity.menus?.length ?? 0,
      usersCount: entity.usersCount ?? 0,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Entity → Response DTO (detail view)
   */
  toDetailResponse(
    entity: Role,
    assignedUsers?: AssignedUserResponse[],
  ): RoleDetailResponse {
    return {
      id: entity.id,
      name: entity.name,
      displayName: entity.displayName,
      description: entity.description,
      isSystem: entity.isSystem,
      permissions:
        entity.permissions?.map((p) => this.permissionMapper.toResponse(p)) ?? [],
      menus: entity.menus?.map((m) => this.menuMapper.toResponse(m)) ?? [],
      assignedUsers: assignedUsers ?? [],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map array of Prisma roles to entities
   */
  toEntityList(prismaRoles: PrismaRoleWithRelations[]): Role[] {
    return prismaRoles.map((r) => this.toEntity(r));
  }

  /**
   * Map array of entities to response DTOs
   */
  toResponseList(entities: Role[]): RoleResponse[] {
    return entities.map((e) => this.toResponse(e));
  }
}
