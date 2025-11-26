import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/db/prisma.service';
import { PermissionMapper } from '../mappers/permission.mapper';
import { Permission } from '../entities/permission.entity';
import { CreatePermissionRequest, UpdatePermissionRequest } from '../dto';

/**
 * Permissions Repository - Database access layer
 */
@Injectable()
export class PermissionsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: PermissionMapper,
  ) {}

  /**
   * Find all permissions
   */
  async findAll(): Promise<Permission[]> {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    return this.mapper.toEntityList(permissions);
  }

  /**
   * Find permission by ID
   */
  async findById(id: number): Promise<Permission | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      return null;
    }

    return this.mapper.toEntity(permission);
  }

  /**
   * Find permission by ID with usage counts
   */
  async findByIdWithCounts(
    id: number,
  ): Promise<{ permission: Permission; rolesCount: number; menusCount: number } | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            roles: true,
            menus: true,
          },
        },
      },
    });

    if (!permission) {
      return null;
    }

    return {
      permission: this.mapper.toEntity(permission),
      rolesCount: permission._count.roles,
      menusCount: permission._count.menus,
    };
  }

  /**
   * Find permission by code
   */
  async findByCode(code: string): Promise<Permission | null> {
    const permission = await this.prisma.permission.findUnique({
      where: { code },
    });

    if (!permission) {
      return null;
    }

    return this.mapper.toEntity(permission);
  }

  /**
   * Create new permission
   */
  async create(data: CreatePermissionRequest): Promise<Permission> {
    const permission = await this.prisma.permission.create({
      data: {
        code: data.code,
        resource: data.resource,
        action: data.action,
        displayName: data.displayName,
        description: data.description,
      },
    });

    return this.mapper.toEntity(permission);
  }

  /**
   * Update permission
   */
  async update(id: number, data: UpdatePermissionRequest): Promise<Permission> {
    const permission = await this.prisma.permission.update({
      where: { id },
      data: {
        displayName: data.displayName,
        description: data.description,
      },
    });

    return this.mapper.toEntity(permission);
  }

  /**
   * Delete permission
   */
  async delete(id: number): Promise<void> {
    await this.prisma.permission.delete({ where: { id } });
  }

  /**
   * Get permissions grouped by resource
   */
  async findGrouped(): Promise<Map<string, Permission[]>> {
    const permissions = await this.findAll();

    const grouped = new Map<string, Permission[]>();

    for (const permission of permissions) {
      const existing = grouped.get(permission.resource) ?? [];
      existing.push(permission);
      grouped.set(permission.resource, existing);
    }

    return grouped;
  }
}
