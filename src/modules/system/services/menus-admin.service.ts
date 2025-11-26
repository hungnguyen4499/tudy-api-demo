import { Injectable } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions/business.exception';
import { SystemErrors } from '@/common/constants/error-codes.constant';
import { MenusRepository } from '../repositories/menus.repository';
import { MenuMapper } from '../mappers/menu.mapper';
import { CreateMenuRequest, UpdateMenuRequest, MenuResponse } from '../dto';

/**
 * Menus Admin Service - Business logic layer
 */
@Injectable()
export class MenusAdminService {
  constructor(
    private readonly menusRepository: MenusRepository,
    private readonly mapper: MenuMapper,
  ) {}

  /**
   * List all menus
   */
  async findAll(): Promise<MenuResponse[]> {
    const menus = await this.menusRepository.findAll();
    return this.mapper.toResponseList(menus);
  }

  /**
   * Get menu tree (hierarchical structure)
   */
  async getMenuTree(): Promise<MenuResponse[]> {
    const menus = await this.menusRepository.findTree();
    return this.mapper.toResponseList(menus);
  }

  /**
   * Get menu by ID
   */
  async findOne(id: number): Promise<MenuResponse> {
    const menu = await this.menusRepository.findById(id);

    if (!menu) {
      throw new BusinessException(SystemErrors.MENU_NOT_FOUND);
    }

    return this.mapper.toResponse(menu);
  }

  /**
   * Create new menu
   */
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
    return this.mapper.toResponse(menu);
  }

  /**
   * Update menu
   */
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
    return this.mapper.toResponse(updated);
  }

  /**
   * Delete menu
   */
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

  /**
   * Update menu order
   */
  async updateOrder(id: number, sortOrder: number): Promise<MenuResponse> {
    const menu = await this.menusRepository.findById(id);

    if (!menu) {
      throw new BusinessException(SystemErrors.MENU_NOT_FOUND);
    }

    const updated = await this.menusRepository.updateSortOrder(id, sortOrder);
    return this.mapper.toResponse(updated);
  }

  /**
   * Toggle menu visibility
   */
  async toggleVisibility(id: number, isVisible: boolean): Promise<MenuResponse> {
    const menu = await this.menusRepository.findById(id);

    if (!menu) {
      throw new BusinessException(SystemErrors.MENU_NOT_FOUND);
    }

    const updated = await this.menusRepository.updateVisibility(id, isVisible);
    return this.mapper.toResponse(updated);
  }
}
