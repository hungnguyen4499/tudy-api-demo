import { Permission } from './permission.entity';

/**
 * Menu Entity - Domain model
 */
export class Menu {
  readonly id: number;
  readonly code: string;
  readonly type: 'MENU' | 'BUTTON' | 'TAB';
  readonly name: string;
  readonly nameEn: string | null;
  readonly icon: string | null;
  readonly path: string | null;
  readonly component: string | null;
  readonly parentId: number | null;
  readonly permissionId: number | null;
  readonly sortOrder: number;
  readonly isVisible: boolean;
  readonly isEnabled: boolean;
  readonly description: string | null;
  readonly metadata: any;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // Relations (loaded optionally)
  readonly children?: Menu[];
  readonly permission?: Permission;

  constructor(props: {
    id: number;
    code: string;
    type: 'MENU' | 'BUTTON' | 'TAB';
    name: string;
    nameEn: string | null;
    icon: string | null;
    path: string | null;
    component: string | null;
    parentId: number | null;
    permissionId: number | null;
    sortOrder: number;
    isVisible: boolean;
    isEnabled: boolean;
    description: string | null;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
    children?: Menu[];
    permission?: Permission;
  }) {
    this.id = props.id;
    this.code = props.code;
    this.type = props.type;
    this.name = props.name;
    this.nameEn = props.nameEn;
    this.icon = props.icon;
    this.path = props.path;
    this.component = props.component;
    this.parentId = props.parentId;
    this.permissionId = props.permissionId;
    this.sortOrder = props.sortOrder;
    this.isVisible = props.isVisible;
    this.isEnabled = props.isEnabled;
    this.description = props.description;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.children = props.children;
    this.permission = props.permission;
  }

  /**
   * Check if menu is a root menu
   */
  get isRoot(): boolean {
    return this.parentId === null;
  }

  /**
   * Check if menu has children
   */
  get hasChildren(): boolean {
    return (this.children?.length ?? 0) > 0;
  }

  /**
   * Check if menu is accessible (visible and enabled)
   */
  get isAccessible(): boolean {
    return this.isVisible && this.isEnabled;
  }
}

