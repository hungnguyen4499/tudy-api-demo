import { Injectable } from '@nestjs/common';
import { UserContextService } from '@/common/services/user-context.service';
import { MenuResponse } from '../dto';
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