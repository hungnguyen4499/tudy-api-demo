# Menu-Based Permissions - Hybrid Approach

## 🎯 Overview

The Kiggle platform now implements a **Hybrid Menu-Permission System** that combines:

1. **Permission-Based** (Backend Logic) - For API authorization
2. **Menu-Based** (Frontend UI) - For dynamic UI rendering

This approach provides the **best of both worlds**:
- ✅ Fine-grained backend API security (Permission)
- ✅ Dynamic UI management (Menu)
- ✅ Admin can manage UI without code changes
- ✅ Consistent UX across different roles

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   HYBRID ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────┘

Backend Logic              Frontend UI
┌──────────────┐          ┌──────────────┐
│  Permission  │◄────┐    │     Menu     │
│  (Reusable)  │     │    │ (UI-Specific)│
└──────────────┘     │    └──────────────┘
       ▲             │           ▲
       │             └───────────┤ references
       │                         │
┌──────┴────────┐         ┌─────┴────────┐
│RolePermission │         │   RoleMenu   │
└───────────────┘         └──────────────┘
       ▲                         ▲
       └────────┬────────────────┘
                │
            ┌───┴───┐
            │  Role │
            └───────┘
```

### Key Concept

**Menu CAN reference Permission** (optional):
- Menu without permission: Pure UI element (e.g., dashboard link)
- Menu with permission: UI element + backend authorization

**Benefits:**
- One Permission can be used by multiple Menus
- One Menu can represent one UI element
- Backend security is decoupled from UI structure

---

## 📊 Database Schema

### Menu Table

```prisma
model Menu {
  id   Int    @id @default(autoincrement())
  code String @unique // e.g., "menu.products", "btn.product.create"
  
  // UI Properties
  type      MenuType // MENU | BUTTON | TAB
  name      String   // "Products", "Add Product"
  nameEn    String?
  icon      String?  // "ProductIcon", "fa-plus"
  path      String?  // "/products" (for MENU type)
  component String?  // "ProductList" (React component name)
  
  // Hierarchy
  parentId  Int?
  sortOrder Int @default(0)
  
  // Visibility
  isVisible Boolean @default(true)
  isEnabled Boolean @default(true)
  
  // ⭐ HYBRID: Optional reference to Permission
  permissionId Int?
  
  // Metadata
  description String?
  metadata    Json? // Extra config
  
  // Relations
  parent     Menu?
  children   Menu[]
  permission Permission?
  roles      RoleMenu[]
}

enum MenuType {
  MENU   // Sidebar navigation (e.g., "Products", "Reports")
  BUTTON // Action button (e.g., "Add", "Edit", "Delete", "Export")
  TAB    // Tab item (e.g., "Basic Info", "Settings")
}
```

### RoleMenu Table

```prisma
model RoleMenu {
  id     Int @id
  roleId Int
  menuId Int
  
  role Role
  menu Menu
  
  @@unique([roleId, menuId])
}
```

---

## 💡 Use Cases & Examples

### Use Case 1: Sidebar Menu (No Backend Permission Needed)

**Scenario:** Dashboard menu item - just navigation, no API call

```typescript
// Database
{
  code: 'menu.dashboard',
  type: 'MENU',
  name: 'Dashboard',
  icon: 'DashboardIcon',
  path: '/dashboard',
  component: 'DashboardPage',
  permissionId: null, // ⭐ No backend permission needed
  sortOrder: 1
}

// Frontend renders this as:
<SidebarItem 
  icon={<DashboardIcon />}
  label="Dashboard"
  to="/dashboard"
/>
```

### Use Case 2: Products Menu (With Backend Permission)

**Scenario:** Products menu needs backend read permission

```typescript
// 1. Create Permission first
const productReadPermission = {
  code: 'product.read',
  resource: 'product',
  action: 'read',
  displayName: 'View Products'
}

// 2. Create Menu referencing Permission
{
  code: 'menu.products',
  type: 'MENU',
  name: 'Products',
  icon: 'ProductIcon',
  path: '/products',
  component: 'ProductList',
  permissionId: productReadPermission.id, // ⭐ References permission
  sortOrder: 2
}

// Backend API checks permission
@RequirePermission('product.read')
@Get('/api/products')
async getProducts() { }

// Frontend renders if user has menu access
if (userMenus.includes('menu.products')) {
  <SidebarItem label="Products" to="/products" />
}
```

### Use Case 3: Action Buttons (Multiple Buttons, Same Permission)

**Scenario:** "Add Product" button appears in multiple places

```typescript
// 1. Create Permission (reusable)
const productCreatePermission = {
  code: 'product.create',
  resource: 'product',
  action: 'create'
}

// 2. Create Multiple Menu Buttons referencing same Permission
const addButtonInProductList = {
  code: 'btn.product.create.list',
  type: 'BUTTON',
  name: 'Add Product',
  icon: 'PlusIcon',
  permissionId: productCreatePermission.id,
  parentId: productsMenu.id
}

const addButtonInDashboard = {
  code: 'btn.product.create.dashboard',
  type: 'BUTTON',
  name: 'Quick Add Product',
  icon: 'PlusIcon',
  permissionId: productCreatePermission.id, // ⭐ Same permission
  parentId: dashboardMenu.id
}

// Backend uses SAME permission check
@RequirePermission('product.create')
@Post('/api/products')
async createProduct() { }

// Frontend renders both buttons if user has menu access
{userMenus.includes('btn.product.create.list') && (
  <Button onClick={openCreateModal}>Add Product</Button>
)}
```

### Use Case 4: Action Button Group

**Scenario:** Product detail page with multiple action buttons

```typescript
// Menu Hierarchy
{
  code: 'menu.products',
  type: 'MENU',
  name: 'Products',
  children: [
    {
      code: 'btn.product.create',
      type: 'BUTTON',
      name: 'Add',
      icon: 'PlusIcon',
      permissionId: permission('product.create')
    },
    {
      code: 'btn.product.edit',
      type: 'BUTTON',
      name: 'Edit',
      icon: 'EditIcon',
      permissionId: permission('product.update')
    },
    {
      code: 'btn.product.delete',
      type: 'BUTTON',
      name: 'Delete',
      icon: 'DeleteIcon',
      permissionId: permission('product.delete')
    },
    {
      code: 'btn.product.export',
      type: 'BUTTON',
      name: 'Export',
      icon: 'DownloadIcon',
      permissionId: permission('product.export')
    }
  ]
}

// Frontend renders available buttons
function ProductActions() {
  const menus = useUserMenus(); // Load from API
  
  return (
    <ActionGroup>
      {menus.has('btn.product.create') && <AddButton />}
      {menus.has('btn.product.edit') && <EditButton />}
      {menus.has('btn.product.delete') && <DeleteButton />}
      {menus.has('btn.product.export') && <ExportButton />}
    </ActionGroup>
  );
}
```

### Use Case 5: Tab Navigation

**Scenario:** Product detail page with tabs

```typescript
{
  code: 'menu.product.detail',
  type: 'MENU',
  name: 'Product Detail',
  children: [
    {
      code: 'tab.product.basic',
      type: 'TAB',
      name: 'Basic Info',
      permissionId: permission('product.read')
    },
    {
      code: 'tab.product.pricing',
      type: 'TAB',
      name: 'Pricing',
      permissionId: permission('product.read')
    },
    {
      code: 'tab.product.analytics',
      type: 'TAB',
      name: 'Analytics',
      permissionId: permission('report.view') // Different permission!
    }
  ]
}

// Frontend renders available tabs
function ProductTabs() {
  const menus = useUserMenus();
  
  return (
    <Tabs>
      {menus.has('tab.product.basic') && <Tab>Basic Info</Tab>}
      {menus.has('tab.product.pricing') && <Tab>Pricing</Tab>}
      {menus.has('tab.product.analytics') && <Tab>Analytics</Tab>}
    </Tabs>
  );
}
```

---

## 🔧 Implementation Guide

### 1. Backend: Load User's Menu Access

```typescript
@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getUserMenus(userId: number): Promise<Menu[]> {
    // Get user's roles
    const roleAssignments = await this.prisma.roleAssignment.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            menus: {
              include: {
                menu: {
                  include: {
                    permission: true,
                    children: {
                      include: {
                        permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // Flatten all menus
    const menus = roleAssignments
      .flatMap(ra => ra.role.menus)
      .map(rm => rm.menu)
      .filter((menu, index, self) =>
        index === self.findIndex(m => m.id === menu.id)
      ); // Deduplicate

    // Sort by sortOrder
    return this.buildMenuTree(menus);
  }

  private buildMenuTree(menus: Menu[]): Menu[] {
    const menuMap = new Map<number, Menu>();
    const roots: Menu[] = [];

    // Build map
    menus.forEach(menu => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    // Build tree
    menus.forEach(menu => {
      const node = menuMap.get(menu.id)!;
      
      if (menu.parentId === null) {
        roots.push(node);
      } else {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children.push(node);
        }
      }
    });

    // Sort by sortOrder
    const sortMenus = (items: Menu[]) => {
      items.sort((a, b) => a.sortOrder - b.sortOrder);
      items.forEach(item => {
        if (item.children.length > 0) {
          sortMenus(item.children);
        }
      });
    };

    sortMenus(roots);
    return roots;
  }
}
```

### 2. Frontend: Load & Cache Menus

```typescript
// React Hook
import { useQuery } from '@tanstack/react-query';

export function useUserMenus() {
  return useQuery({
    queryKey: ['user-menus'],
    queryFn: async () => {
      const response = await api.get('/api/auth/menus');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Menu Context
import React, { createContext, useContext } from 'react';

interface MenuContextValue {
  menus: Menu[];
  hasMenu: (code: string) => boolean;
  getMenu: (code: string) => Menu | undefined;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const { data: menus = [] } = useUserMenus();

  const value = {
    menus,
    hasMenu: (code: string) => menus.some(m => m.code === code),
    getMenu: (code: string) => menus.find(m => m.code === code),
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenus() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenus must be used within MenuProvider');
  }
  return context;
}
```

### 3. Frontend: Render Sidebar

```typescript
function Sidebar() {
  const { menus } = useMenus();

  // Filter only MENU type items
  const menuItems = menus.filter(m => m.type === 'MENU' && !m.parentId);

  return (
    <aside>
      {menuItems.map(menu => (
        <SidebarMenuItem key={menu.id} menu={menu} />
      ))}
    </aside>
  );
}

function SidebarMenuItem({ menu }: { menu: Menu }) {
  const Icon = getIcon(menu.icon);

  return (
    <Link to={menu.path}>
      {Icon && <Icon />}
      <span>{menu.name}</span>
      
      {menu.children.length > 0 && (
        <ul>
          {menu.children.map(child => (
            <SidebarMenuItem key={child.id} menu={child} />
          ))}
        </ul>
      )}
    </Link>
  );
}
```

### 4. Frontend: Render Action Buttons

```typescript
function ProductListPage() {
  const { hasMenu } = useMenus();

  return (
    <div>
      <h1>Products</h1>
      
      <ActionBar>
        {hasMenu('btn.product.create') && (
          <Button onClick={handleCreate}>
            <PlusIcon /> Add Product
          </Button>
        )}
        
        {hasMenu('btn.product.export') && (
          <Button onClick={handleExport}>
            <DownloadIcon /> Export
          </Button>
        )}
      </ActionBar>

      <ProductTable />
    </div>
  );
}

function ProductTable() {
  const { hasMenu } = useMenus();

  return (
    <Table>
      {products.map(product => (
        <tr key={product.id}>
          <td>{product.name}</td>
          <td>
            {hasMenu('btn.product.edit') && (
              <IconButton onClick={() => handleEdit(product)}>
                <EditIcon />
              </IconButton>
            )}
            
            {hasMenu('btn.product.delete') && (
              <IconButton onClick={() => handleDelete(product)}>
                <DeleteIcon />
              </IconButton>
            )}
          </td>
        </tr>
      ))}
    </Table>
  );
}
```

### 5. Admin: Manage Menus Dynamically

```typescript
// Admin can create/update menus without code changes
function MenuManagementPage() {
  const [menus, setMenus] = useState([]);

  async function createMenu(data: CreateMenuDto) {
    const newMenu = await api.post('/api/admin/menus', {
      code: data.code,
      type: data.type,
      name: data.name,
      icon: data.icon,
      path: data.path,
      parentId: data.parentId,
      permissionId: data.permissionId, // Optional: link to permission
      sortOrder: data.sortOrder,
    });

    setMenus([...menus, newMenu]);
  }

  return (
    <div>
      <h1>Menu Management</h1>
      
      <MenuTree menus={menus} />
      
      <Button onClick={() => openCreateModal()}>Add Menu</Button>
    </div>
  );
}
```

---

## 🎯 Comparison: Pure Menu-Based vs Hybrid

### Pure Menu-Based (Your Original Idea)

```typescript
// ❌ Permission embedded in Menu
{
  code: 'btn.product.delete',
  type: 'BUTTON',
  name: 'Delete Product',
  permission: 'product.delete' // Embedded string
}

// Backend checks menu code (❌ coupled to UI)
@RequireMenu('btn.product.delete')
async deleteProduct() { }
```

**Problems:**
- Backend coupled to UI structure
- Same action in multiple places = duplicate menu codes
- Mobile app has different UI = different menu codes
- Hard to maintain when UI changes

### Hybrid (Current Implementation)

```typescript
// ✅ Permission is separate, Menu references it
const permission = {
  code: 'product.delete',
  resource: 'product',
  action: 'delete'
}

const menu1 = {
  code: 'btn.product.delete.list',
  type: 'BUTTON',
  permissionId: permission.id // ⭐ Reference
}

const menu2 = {
  code: 'btn.product.delete.detail',
  type: 'BUTTON',
  permissionId: permission.id // ⭐ Same permission
}

// Backend checks permission (✅ decoupled from UI)
@RequirePermission('product.delete')
async deleteProduct() { }

// Frontend checks menu (✅ UI-specific)
{hasMenu('btn.product.delete.list') && <DeleteButton />}
```

**Benefits:**
- ✅ Backend decoupled from UI
- ✅ One permission, many UI elements
- ✅ Mobile/Web can have different menus, same backend
- ✅ Easy to refactor UI without touching backend

---

## 🔄 Complete Flow Example

### Scenario: Partner Staff wants to export products

```
1. User Login
   ↓
2. Load User Context
   - Roles: [partner_staff]
   - Permissions: [product.read, product.export, ...]
   - Menus: [menu.products, btn.product.export, ...]
   ↓
3. Frontend Renders
   - Show "Products" in sidebar (menu.products)
   - Show "Export" button (btn.product.export)
   ↓
4. User Clicks "Export" Button
   ↓
5. Frontend: POST /api/products/export
   ↓
6. Backend: @RequirePermission('product.export')
   - Check: Does user have 'product.export'? ✅ Yes
   ↓
7. Backend: Apply Scope Filter
   - WHERE organizationId = user.organizationId
   ↓
8. Return filtered export data
```

**Key Points:**
- Frontend checks **Menu** (`btn.product.export`) → Show/hide UI
- Backend checks **Permission** (`product.export`) → Allow/deny action
- Scope filter ensures data isolation

---

## 📋 Seed Data Example

```typescript
// prisma/seed-menus.ts

async function seedMenusAndPermissions() {
  // 1. Create Permissions (reusable backend logic)
  const permissions = await Promise.all([
    prisma.permission.create({
      data: {
        code: 'product.read',
        resource: 'product',
        action: 'read',
        displayName: 'View Products'
      }
    }),
    prisma.permission.create({
      data: {
        code: 'product.create',
        resource: 'product',
        action: 'create',
        displayName: 'Create Product'
      }
    }),
    prisma.permission.create({
      data: {
        code: 'product.update',
        resource: 'product',
        action: 'update',
        displayName: 'Update Product'
      }
    }),
    prisma.permission.create({
      data: {
        code: 'product.delete',
        resource: 'product',
        action: 'delete',
        displayName: 'Delete Product'
      }
    }),
    prisma.permission.create({
      data: {
        code: 'product.export',
        resource: 'product',
        action: 'export',
        displayName: 'Export Products'
      }
    }),
  ]);

  const [
    productRead,
    productCreate,
    productUpdate,
    productDelete,
    productExport
  ] = permissions;

  // 2. Create Menus (UI structure)
  const productsMenu = await prisma.menu.create({
    data: {
      code: 'menu.products',
      type: 'MENU',
      name: 'Products',
      nameEn: 'Products',
      icon: 'ProductIcon',
      path: '/products',
      component: 'ProductList',
      permissionId: productRead.id,
      sortOrder: 1
    }
  });

  // 2.1 Create child menus (buttons)
  await prisma.menu.createMany({
    data: [
      {
        code: 'btn.product.create',
        type: 'BUTTON',
        name: 'Add Product',
        nameEn: 'Add Product',
        icon: 'PlusIcon',
        permissionId: productCreate.id,
        parentId: productsMenu.id,
        sortOrder: 1
      },
      {
        code: 'btn.product.edit',
        type: 'BUTTON',
        name: 'Edit',
        nameEn: 'Edit',
        icon: 'EditIcon',
        permissionId: productUpdate.id,
        parentId: productsMenu.id,
        sortOrder: 2
      },
      {
        code: 'btn.product.delete',
        type: 'BUTTON',
        name: 'Delete',
        nameEn: 'Delete',
        icon: 'DeleteIcon',
        permissionId: productDelete.id,
        parentId: productsMenu.id,
        sortOrder: 3
      },
      {
        code: 'btn.product.export',
        type: 'BUTTON',
        name: 'Export',
        nameEn: 'Export',
        icon: 'DownloadIcon',
        permissionId: productExport.id,
        parentId: productsMenu.id,
        sortOrder: 4
      }
    ]
  });

  // 3. Assign to Roles

  // Partner Admin: Full access
  const partnerAdminRole = await prisma.role.findUnique({
    where: { name: 'partner_admin' }
  });

  await prisma.rolePermission.createMany({
    data: permissions.map(p => ({
      roleId: partnerAdminRole.id,
      permissionId: p.id
    }))
  });

  const allMenus = await prisma.menu.findMany();
  await prisma.roleMenu.createMany({
    data: allMenus.map(m => ({
      roleId: partnerAdminRole.id,
      menuId: m.id
    }))
  });

  // Partner Staff: Limited access (read + export only)
  const partnerStaffRole = await prisma.role.findUnique({
    where: { name: 'partner_staff' }
  });

  await prisma.rolePermission.createMany({
    data: [
      { roleId: partnerStaffRole.id, permissionId: productRead.id },
      { roleId: partnerStaffRole.id, permissionId: productExport.id }
    ]
  });

  const staffMenus = await prisma.menu.findMany({
    where: {
      code: {
        in: ['menu.products', 'btn.product.export']
      }
    }
  });

  await prisma.roleMenu.createMany({
    data: staffMenus.map(m => ({
      roleId: partnerStaffRole.id,
      menuId: m.id
    }))
  });
}
```

---

## ✅ Benefits of Hybrid Approach

| Aspect | Pure Permission-Based | Pure Menu-Based | ✅ Hybrid |
|--------|---------------------|----------------|-----------|
| **Backend Security** | ✅ Excellent | ❌ Coupled to UI | ✅ Excellent |
| **Frontend Flexibility** | ❌ Hardcoded | ✅ Dynamic | ✅ Dynamic |
| **Code Reusability** | ✅ High | ❌ Low | ✅ High |
| **Admin Management** | ❌ Code changes | ✅ UI config | ✅ UI config |
| **Mobile Support** | ✅ Same API | ❌ Different menus | ✅ Same API, different menus |
| **Maintenance** | ❌ Frontend hardcoded | ❌ Backend coupled | ✅ Decoupled |

---

## 🚀 Summary

The **Hybrid Menu-Permission System** provides:

1. **Permissions** (Backend)
   - Reusable across different UI contexts
   - Backend API authorization
   - Mobile/Web use same permissions

2. **Menus** (Frontend)
   - Dynamic UI rendering
   - Admin can manage without code changes
   - Different UIs (web/mobile) can have different menus

3. **Optional Link** (Menu → Permission)
   - Menu can reference Permission for backend logic
   - One Permission can be used by multiple Menus
   - Decoupled: UI changes don't affect backend

**This is the BEST approach for your admin requirements! ✨**

---

## 📚 Related Documentation

- [Hybrid Access Control](./HYBRID_ACCESS_CONTROL.md) - Complete RBAC + Scope guide
- [Database Design](./DATABASE_DESIGN.md) - Complete schema
- [Database ERD](./DATABASE_ERD.md) - Entity diagrams

