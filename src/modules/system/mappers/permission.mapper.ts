import { Injectable } from '@nestjs/common';
import { Permission as PrismaPermission } from '@prisma/client';
import { Permission } from '../entities/permission.entity';
import { PermissionResponse } from '../dto';

/**
 * Permission Mapper
 * Handles mapping between Prisma models, Permission entities, and DTOs
 */
@Injectable()
export class PermissionMapper {
  /**
   * Prisma Model → Entity
   */
  toEntity(prismaPermission: PrismaPermission): Permission {
    return new Permission({
      id: prismaPermission.id,
      code: prismaPermission.code,
      resource: prismaPermission.resource,
      action: prismaPermission.action,
      displayName: prismaPermission.displayName,
      description: prismaPermission.description,
      createdAt: prismaPermission.createdAt,
      updatedAt: prismaPermission.updatedAt,
    });
  }

  /**
   * Entity → Response DTO
   */
  toResponse(entity: Permission): PermissionResponse {
    return {
      id: entity.id,
      code: entity.code,
      resource: entity.resource,
      action: entity.action,
      displayName: entity.displayName,
      description: entity.description,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map array of Prisma permissions to entities
   */
  toEntityList(prismaPermissions: PrismaPermission[]): Permission[] {
    return prismaPermissions.map((p) => this.toEntity(p));
  }

  /**
   * Map array of entities to response DTOs
   */
  toResponseList(entities: Permission[]): PermissionResponse[] {
    return entities.map((e) => this.toResponse(e));
  }
}

