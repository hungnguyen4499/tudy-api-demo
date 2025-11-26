import { Injectable } from '@nestjs/common';
import { Menu as PrismaMenu, Permission as PrismaPermission } from '@prisma/client';
import { Menu } from '../entities/menu.entity';
import { MenuResponse } from '../dto';
import { PermissionMapper } from './permission.mapper';

type PrismaMenuWithRelations = PrismaMenu & {
  children?: PrismaMenuWithRelations[];
  permission?: PrismaPermission | null;
};

/**
 * Menu Mapper
 * Handles mapping between Prisma models, Menu entities, and DTOs
 */
@Injectable()
export class MenuMapper {
  constructor(private readonly permissionMapper: PermissionMapper) {}

  /**
   * Prisma Model → Entity
   */
  toEntity(prismaMenu: PrismaMenuWithRelations): Menu {
    return new Menu({
      id: prismaMenu.id,
      code: prismaMenu.code,
      type: prismaMenu.type as 'MENU' | 'BUTTON' | 'TAB',
      name: prismaMenu.name,
      nameEn: prismaMenu.nameEn,
      icon: prismaMenu.icon,
      path: prismaMenu.path,
      component: prismaMenu.component,
      parentId: prismaMenu.parentId,
      permissionId: prismaMenu.permissionId,
      sortOrder: prismaMenu.sortOrder,
      isVisible: prismaMenu.isVisible,
      isEnabled: prismaMenu.isEnabled,
      description: prismaMenu.description,
      metadata: prismaMenu.metadata,
      createdAt: prismaMenu.createdAt,
      updatedAt: prismaMenu.updatedAt,
      children: prismaMenu.children?.map((c) => this.toEntity(c)),
      permission: prismaMenu.permission
        ? this.permissionMapper.toEntity(prismaMenu.permission)
        : undefined,
    });
  }

  /**
   * Entity → Response DTO
   */
  toResponse(entity: Menu): MenuResponse {
    return {
      id: entity.id,
      code: entity.code,
      type: entity.type,
      name: entity.name,
      nameEn: entity.nameEn,
      icon: entity.icon,
      path: entity.path,
      component: entity.component,
      parentId: entity.parentId,
      permissionId: entity.permissionId,
      sortOrder: entity.sortOrder,
      isVisible: entity.isVisible,
      isEnabled: entity.isEnabled,
      description: entity.description,
      children: entity.children?.map((c) => this.toResponse(c)),
      permission: entity.permission
        ? this.permissionMapper.toResponse(entity.permission)
        : undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map array of Prisma menus to entities
   */
  toEntityList(prismaMenus: PrismaMenuWithRelations[]): Menu[] {
    return prismaMenus.map((m) => this.toEntity(m));
  }

  /**
   * Map array of entities to response DTOs
   */
  toResponseList(entities: Menu[]): MenuResponse[] {
    return entities.map((e) => this.toResponse(e));
  }
}

