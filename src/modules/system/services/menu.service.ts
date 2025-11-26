import { Injectable } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/business.exception';
import { SystemErrors } from '@/common/constants/error-codes.constant';
import { UserContextService } from '@/common/services/user-context.service';
import {
  CreateMenuRequest,
  MenuResponse,
  UpdateMenuRequest,
} from '../dto';
import { MenusRepository } from '../repositories/menus.repository';
import { MenuMapper } from '../mappers/menu.mapper';
import { Menu } from '../entities/menu.entity';

@Injectable()
export class MenuService {
  constructor(
    private readonly menusRepository: MenusRepository,
    private readonly userContextService: UserContextService,
    private readonly menuMapper: MenuMapper,
  ) {}

  // --------------------------------------------------------
  // User-facing helpers (current user's menus & permissions)
  // --------------------------------------------------------

  async getUserMenus(userId: number): Promise<MenuResponse[]> {
    const menuCodes = await this.userContextService.loadMenuCodes(userId);
    if (menuCodes.length === 0) {
      return [];
    }

    const menus = await this.menusRepository.findVisibleByCodes(menuCodes);
    const tree = this.buildMenuResponseTree(menus);
    return this.sortMenuResponseTree(tree);
  }

  async hasMenu(userId: number, menuCode: string): Promise<boolean> {
    const menuCodes = await this.userContextService.loadMenuCodes(userId);
    return menuCodes.includes(menuCode);
  }

  async getMenusByType(
    userId: number,
    type: 'MENU' | 'BUTTON' | 'TAB',
  ): Promise<MenuResponse[]> {
    const menus = await this.getUserMenus(userId);
    return this.filterMenusByType(menus, type);
  }

  async getSidebarMenus(userId: number): Promise<MenuResponse[]> {
    const menus = await this.getUserMenus(userId);
    return menus.filter((menu) => menu.type === 'MENU');
  }

  async getActionButtons(
    userId: number,
    parentMenuCode: string,
  ): Promise<MenuResponse[]> {
    const menus = await this.getUserMenus(userId);
    const parent = this.findMenuByCode(menus, parentMenuCode);
    if (!parent) {
      return [];
    }
    return parent.children?.filter((child) => child.type === 'BUTTON') ?? [];
  }

  async getMenuCodesByPermission(permissionCode: string): Promise<string[]> {
    return this.menusRepository.findCodesByPermission(permissionCode);
  }

  // --------------------------------------------------------
  // Administrative operations (CRUD & configuration)
  // --------------------------------------------------------

  async findAll(): Promise<MenuResponse[]> {
    const menus = await this.menusRepository.findAll();
    return this.menuMapper.toResponseList(menus);
  }

  async getMenuTree(): Promise<MenuResponse[]> {
    const menus = await this.menusRepository.findTree();
    return this.menuMapper.toResponseList(menus);
  }

  async findOne(id: number): Promise<MenuResponse> {
    const menu = await this.menusRepository.findById(id);
    if (!menu) {
      throw new BusinessException(SystemErrors.MENU_NOT_FOUND);
    }
    return this.menuMapper.toResponse(menu);
  }

  async create(request: CreateMenuRequest): Promise<MenuResponse> {
    const existing = await this.menusRepository.findByCode(request.code);
    if (existing) {
      throw new BusinessException(SystemErrors.MENU_CODE_EXISTS);
    }

    if (request.parentId) {
      const parent = await this.menusRepository.findById(request.parentId);
      if (!parent) {
        throw new BusinessException(SystemErrors.MENU_PARENT_NOT_FOUND);
      }
    }

    const menu = await this.menusRepository.create(request);
    return this.menuMapper.toResponse(menu);
  }

  async update(id: number, request: UpdateMenuRequest): Promise<MenuResponse> {
    const menu = await this.menusRepository.findById(id);
    if (!menu) {
      throw new BusinessException(SystemErrors.MENU_NOT_FOUND);
    }

    if (request.parentId) {
      if (request.parentId === id) {
        throw new BusinessException(SystemErrors.MENU_SELF_PARENT);
      }

      const parent = await this.menusRepository.findById(request.parentId);
      if (!parent) {
        throw new BusinessException(SystemErrors.MENU_PARENT_NOT_FOUND);
      }
    }

    const updated = await this.menusRepository.update(id, request);
    return this.menuMapper.toResponse(updated);
  }

  async delete(id: number): Promise<void> {
    const result = await this.menusRepository.findByIdWithCounts(id);
    if (!result) {
      throw new BusinessException(SystemErrors.MENU_NOT_FOUND);
    }

    if (result.childrenCount > 0) {
      throw new BusinessException(
        SystemErrors.MENU_HAS_CHILDREN,
        `Cannot delete: menu has ${result.childrenCount} child menus`,
      );
    }

    await this.menusRepository.delete(id);
  }

  async updateOrder(id: number, sortOrder: number): Promise<MenuResponse> {
    const menu = await this.menusRepository.findById(id);
    if (!menu) {
      throw new BusinessException(SystemErrors.MENU_NOT_FOUND);
    }

    const updated = await this.menusRepository.updateSortOrder(id, sortOrder);
    return this.menuMapper.toResponse(updated);
  }

  async toggleVisibility(id: number, isVisible: boolean): Promise<MenuResponse> {
    const menu = await this.menusRepository.findById(id);
    if (!menu) {
      throw new BusinessException(SystemErrors.MENU_NOT_FOUND);
    }

    const updated = await this.menusRepository.updateVisibility(id, isVisible);
    return this.menuMapper.toResponse(updated);
  }

  private buildMenuResponseTree(menus: Menu[]): MenuResponse[] {
    const nodes = menus.map((menu) => {
      const dto = this.menuMapper.toResponse(menu);
      return { ...dto, children: [] as MenuResponse[] };
    });

    const nodeMap = new Map<number, MenuResponse & { children: MenuResponse[] }>();
    nodes.forEach((node) => nodeMap.set(node.id, node));

    const roots: MenuResponse[] = [];
    menus.forEach((menu) => {
      const node = nodeMap.get(menu.id);
      if (!node) {
        return;
      }
      if (menu.parentId === null || !nodeMap.has(menu.parentId)) {
        roots.push(node);
      } else {
        nodeMap.get(menu.parentId)!.children!.push(node);
      }
    });

    return roots.map((node) => this.stripChildrenProxy(node));
  }

  private stripChildrenProxy(node: MenuResponse): MenuResponse {
    return {
      ...node,
      children:
        node.children?.map((child) => this.stripChildrenProxy(child)) ?? [],
    };
  }

  private sortMenuResponseTree(items: MenuResponse[]): MenuResponse[] {
    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    sorted.forEach((item) => {
      if (item.children && item.children.length > 0) {
        item.children = this.sortMenuResponseTree(item.children);
      }
    });
    return sorted;
  }

  private filterMenusByType(
    menus: MenuResponse[],
    type: 'MENU' | 'BUTTON' | 'TAB',
  ): MenuResponse[] {
    const filtered: MenuResponse[] = [];
    menus.forEach((menu) => {
      if (menu.type === type) {
        filtered.push({
          ...menu,
          children: menu.children
            ? this.filterMenusByType(menu.children, type)
            : [],
        });
      } else if (menu.children && menu.children.length > 0) {
        filtered.push(...this.filterMenusByType(menu.children, type));
      }
    });
    return filtered;
  }

  private findMenuByCode(
    menus: MenuResponse[],
    code: string,
  ): MenuResponse | undefined {
    for (const menu of menus) {
      if (menu.code === code) {
        return menu;
      }
      if (menu.children && menu.children.length > 0) {
        const found = this.findMenuByCode(menu.children, code);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }
}