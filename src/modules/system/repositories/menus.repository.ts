import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/db/prisma.service';
import { MenuMapper } from '../mappers/menu.mapper';
import { Menu } from '../entities/menu.entity';
import { CreateMenuRequest, UpdateMenuRequest } from '../dto';

/**
 * Menus Repository - Database access layer
 */
@Injectable()
export class MenusRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: MenuMapper,
  ) {}

  private get menuDelegate() {
    return (this.prisma as PrismaService & { menu: typeof this.prisma['role'] }).menu;
  }

  /**
   * Find all menus
   */
  async findAll(): Promise<Menu[]> {
    const menus = await this.menuDelegate.findMany({
      include: {
        permission: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return this.mapper.toEntityList(menus);
  }

  /**
   * Find visible menus by code list
   */
  async findVisibleByCodes(codes: string[]): Promise<Menu[]> {
    if (codes.length === 0) {
      return [];
    }

    const menus = await this.menuDelegate.findMany({
      where: {
        code: { in: codes },
        isVisible: true,
      },
      include: {
        permission: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return this.mapper.toEntityList(menus);
  }

  /**
   * Find menu by ID
   */
  async findById(id: number): Promise<Menu | null> {
    const menu = await this.menuDelegate.findUnique({
      where: { id },
      include: {
        permission: true,
        parent: true,
        children: {
          include: {
            permission: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!menu) {
      return null;
    }

    return this.mapper.toEntity(menu);
  }

  /**
   * Find menu by ID with children count
   */
  async findByIdWithCounts(
    id: number,
  ): Promise<{ menu: Menu; childrenCount: number } | null> {
    const menu = await this.menuDelegate.findUnique({
      where: { id },
      include: {
        permission: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!menu) {
      return null;
    }

    return {
      menu: this.mapper.toEntity(menu),
      childrenCount: menu._count.children,
    };
  }

  /**
   * Find menu by code
   */
  async findByCode(code: string): Promise<Menu | null> {
    const menu = await this.menuDelegate.findUnique({
      where: { code },
      include: {
        permission: true,
      },
    });

    if (!menu) {
      return null;
    }

    return this.mapper.toEntity(menu);
  }

  /**
   * Find root menus (no parent) with children
   */
  async findTree(): Promise<Menu[]> {
    const menus = await this.menuDelegate.findMany({
      where: { parentId: null },
      include: {
        permission: true,
        children: {
          include: {
            permission: true,
            children: {
              include: {
                permission: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return this.mapper.toEntityList(menus);
  }

  /**
   * Create new menu
   */
  async create(data: CreateMenuRequest): Promise<Menu> {
    const menu = await this.menuDelegate.create({
      data: {
        code: data.code,
        type: data.type,
        name: data.name,
        icon: data.icon,
        path: data.path,
        component: data.component,
        parentId: data.parentId,
        permissionId: data.permissionId,
        sortOrder: data.sortOrder ?? 0,
        isVisible: data.isVisible ?? true,
        isEnabled: data.isEnabled ?? true,
        description: data.description,
        metadata: data.metadata,
      },
      include: {
        permission: true,
      },
    });

    return this.mapper.toEntity(menu);
  }

  /**
   * Update menu
   */
  async update(id: number, data: UpdateMenuRequest): Promise<Menu> {
    const menu = await this.menuDelegate.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon,
        path: data.path,
        component: data.component,
        parentId: data.parentId,
        permissionId: data.permissionId,
        sortOrder: data.sortOrder,
        isVisible: data.isVisible,
        isEnabled: data.isEnabled,
        description: data.description,
        metadata: data.metadata,
      },
      include: {
        permission: true,
      },
    });

    return this.mapper.toEntity(menu);
  }

  /**
   * Delete menu
   */
  async delete(id: number): Promise<void> {
    await this.menuDelegate.delete({ where: { id } });
  }

  /**
   * Update menu sort order
   */
  async updateSortOrder(id: number, sortOrder: number): Promise<Menu> {
    const menu = await this.menuDelegate.update({
      where: { id },
      data: { sortOrder },
      include: {
        permission: true,
      },
    });

    return this.mapper.toEntity(menu);
  }

  /**
   * Update menu visibility
   */
  async updateVisibility(id: number, isVisible: boolean): Promise<Menu> {
    const menu = await this.menuDelegate.update({
      where: { id },
      data: { isVisible },
      include: {
        permission: true,
      },
    });

    return this.mapper.toEntity(menu);
  }

  /**
   * Get menu codes that reference a specific permission
   */
  async findCodesByPermission(permissionCode: string): Promise<string[]> {
    const menus = await this.menuDelegate.findMany({
      where: {
        permission: {
          code: permissionCode,
        },
      },
      select: {
        code: true,
      },
    });

    return menus.map((menu) => menu.code);
  }
}
