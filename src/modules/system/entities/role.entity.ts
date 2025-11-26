import { Permission } from './permission.entity';
import { Menu } from './menu.entity';

/**
 * Role Entity - Domain model
 */
export class Role {
  readonly id: number;
  readonly name: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Relations (loaded optionally)
  readonly permissions?: Permission[];
  readonly menus?: Menu[];
  readonly usersCount?: number;

  constructor(props: {
    id: number;
    name: string;
    displayName: string;
    description: string | null;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    permissions?: Permission[];
    menus?: Menu[];
    usersCount?: number;
  }) {
    this.id = props.id;
    this.name = props.name;
    this.displayName = props.displayName;
    this.description = props.description;
    this.isSystem = props.isSystem;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.permissions = props.permissions;
    this.menus = props.menus;
    this.usersCount = props.usersCount;
  }

  /**
   * Check if role can be modified
   */
  get isModifiable(): boolean {
    return !this.isSystem;
  }

  /**
   * Check if role can be deleted
   */
  canDelete(): boolean {
    return !this.isSystem && (this.usersCount === undefined || this.usersCount === 0);
  }

  /**
   * Get permission codes
   */
  get permissionCodes(): string[] {
    return this.permissions?.map((p) => p.code) ?? [];
  }

  /**
   * Get menu codes
   */
  get menuCodes(): string[] {
    return this.menus?.map((m) => m.code) ?? [];
  }
}
