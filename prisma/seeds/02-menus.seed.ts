import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedContext {
  permissions: Record<string, number>;
  roles: {
    kiggleAdmin: { id: number };
    kiggleStaff: { id: number };
    partnerAdmin: { id: number };
    partnerStaff: { id: number };
    tutor: { id: number };
    parent: { id: number };
  };
}

export async function seedMenus(context: SeedContext) {
  console.log('🌱 Seeding Menu System...');

  const { permissions, roles } = context;

  // ============================================
  // 1. CREATE MAIN MENUS (Sidebar Navigation)
  // ============================================
  console.log('  → Creating main menus...');

  // 1.1 Dashboard (No permission needed - pure navigation)
  const dashboardMenu = await prisma.menu.upsert({
    where: { code: 'menu.dashboard' },
    update: {},
    create: {
      code: 'menu.dashboard',
      type: 'MENU',
      name: 'Dashboard',
      icon: 'DashboardIcon',
      path: '/dashboard',
      component: 'DashboardPage',
      permissionId: null, // No API permission needed
      sortOrder: 1,
      isVisible: true,
      isEnabled: true,
    },
  });

  // 1.2 Products Menu
  const productsMenu = await prisma.menu.upsert({
    where: { code: 'menu.products' },
    update: {},
    create: {
      code: 'menu.products',
      type: 'MENU',
      name: 'Products',
      icon: 'ProductIcon',
      path: '/products',
      component: 'ProductList',
      permissionId: permissions['product.read'],
      sortOrder: 2,
      isVisible: true,
      isEnabled: true,
    },
  });

  // 1.3 Bookings Menu
  const bookingsMenu = await prisma.menu.upsert({
    where: { code: 'menu.bookings' },
    update: {},
    create: {
      code: 'menu.bookings',
      type: 'MENU',
      name: 'Bookings',
      icon: 'BookingIcon',
      path: '/bookings',
      component: 'BookingList',
      permissionId: permissions['booking.read'],
      sortOrder: 3,
      isVisible: true,
      isEnabled: true,
    },
  });

  // 1.4 Reports Menu
  const reportsMenu = await prisma.menu.upsert({
    where: { code: 'menu.reports' },
    update: {},
    create: {
      code: 'menu.reports',
      type: 'MENU',
      name: 'Reports',
      icon: 'ChartIcon',
      path: '/reports',
      component: 'ReportsPage',
      permissionId: permissions['report.view'],
      sortOrder: 4,
      isVisible: true,
      isEnabled: true,
    },
  });

  // 1.5 Members Menu (Admin only)
  const membersMenu = await prisma.menu.upsert({
    where: { code: 'menu.members' },
    update: {},
    create: {
      code: 'menu.members',
      type: 'MENU',
      name: 'Members',
      icon: 'UsersIcon',
      path: '/members',
      component: 'MemberList',
      permissionId: permissions['member.manage'],
      sortOrder: 5,
      isVisible: true,
      isEnabled: true,
    },
  });

  console.log('  ✅ Created 5 main menus');

  // ============================================
  // 2. CREATE PRODUCT ACTION BUTTONS
  // ============================================
  console.log('  → Creating product action buttons...');

  await prisma.menu.upsert({
    where: { code: 'btn.product.create' },
    update: {},
    create: {
      code: 'btn.product.create',
      type: 'BUTTON',
      name: 'Add Product',
      icon: 'PlusIcon',
      permissionId: permissions['product.create'],
      parentId: productsMenu.id,
      sortOrder: 1,
      isVisible: true,
      isEnabled: true,
    },
  });

  await prisma.menu.upsert({
    where: { code: 'btn.product.edit' },
    update: {},
    create: {
      code: 'btn.product.edit',
      type: 'BUTTON',
      name: 'Edit',
      icon: 'EditIcon',
      permissionId: permissions['product.update'],
      parentId: productsMenu.id,
      sortOrder: 2,
      isVisible: true,
      isEnabled: true,
    },
  });

  await prisma.menu.upsert({
    where: { code: 'btn.product.delete' },
    update: {},
    create: {
      code: 'btn.product.delete',
      type: 'BUTTON',
      name: 'Delete',
      icon: 'DeleteIcon',
      permissionId: permissions['product.delete'],
      parentId: productsMenu.id,
      sortOrder: 3,
      isVisible: true,
      isEnabled: true,
    },
  });

  await prisma.menu.upsert({
    where: { code: 'btn.product.export' },
    update: {},
    create: {
      code: 'btn.product.export',
      type: 'BUTTON',
      name: 'Export',
      icon: 'DownloadIcon',
      permissionId: permissions['product.export'],
      parentId: productsMenu.id,
      sortOrder: 4,
      isVisible: true,
      isEnabled: true,
    },
  });

  console.log('  ✅ Created 4 product buttons');

  // ============================================
  // 3. CREATE BOOKING ACTION BUTTONS
  // ============================================
  console.log('  → Creating booking action buttons...');

  await prisma.menu.upsert({
    where: { code: 'btn.booking.approve' },
    update: {},
    create: {
      code: 'btn.booking.approve',
      type: 'BUTTON',
      name: 'Approve',
      icon: 'CheckIcon',
      permissionId: permissions['booking.approve'],
      parentId: bookingsMenu.id,
      sortOrder: 1,
      isVisible: true,
      isEnabled: true,
    },
  });

  await prisma.menu.upsert({
    where: { code: 'btn.booking.cancel' },
    update: {},
    create: {
      code: 'btn.booking.cancel',
      type: 'BUTTON',
      name: 'Cancel',
      icon: 'XIcon',
      permissionId: permissions['booking.cancel'],
      parentId: bookingsMenu.id,
      sortOrder: 2,
      isVisible: true,
      isEnabled: true,
    },
  });

  await prisma.menu.upsert({
    where: { code: 'btn.booking.edit' },
    update: {},
    create: {
      code: 'btn.booking.edit',
      type: 'BUTTON',
      name: 'Edit',
      icon: 'EditIcon',
      permissionId: permissions['booking.update'],
      parentId: bookingsMenu.id,
      sortOrder: 3,
      isVisible: true,
      isEnabled: true,
    },
  });

  console.log('  ✅ Created 3 booking buttons');

  // ============================================
  // 4. CREATE REPORT ACTION BUTTONS
  // ============================================
  console.log('  → Creating report action buttons...');

  await prisma.menu.upsert({
    where: { code: 'btn.report.export' },
    update: {},
    create: {
      code: 'btn.report.export',
      type: 'BUTTON',
      name: 'Export Report',
      icon: 'DownloadIcon',
      permissionId: permissions['report.export'],
      parentId: reportsMenu.id,
      sortOrder: 1,
      isVisible: true,
      isEnabled: true,
    },
  });

  console.log('  ✅ Created 1 report button');

  // ============================================
  // 5. CREATE MEMBER ACTION BUTTONS
  // ============================================
  console.log('  → Creating member action buttons...');

  await prisma.menu.upsert({
    where: { code: 'btn.member.invite' },
    update: {},
    create: {
      code: 'btn.member.invite',
      type: 'BUTTON',
      name: 'Invite Member',
      icon: 'UserPlusIcon',
      permissionId: permissions['member.invite'],
      parentId: membersMenu.id,
      sortOrder: 1,
      isVisible: true,
      isEnabled: true,
    },
  });

  console.log('  ✅ Created 1 member button');

  // ============================================
  // 6. ASSIGN MENUS TO ROLES
  // ============================================
  console.log('  → Assigning menus to roles...');

  // Get all menus
  const allMenus = await prisma.menu.findMany();

  // 6.1 KIGGLE_ADMIN: All menus
  for (const menu of allMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: roles.kiggleAdmin.id,
          menuId: menu.id,
        },
      },
      update: {},
      create: {
        roleId: roles.kiggleAdmin.id,
        menuId: menu.id,
      },
    });
  }
  console.log(`    → Kiggle Admin: ${allMenus.length} menus`);

  // 6.2 KIGGLE_STAFF: Read-only menus
  const kiggleStaffMenuCodes = [
    'menu.dashboard',
    'menu.products',
    'menu.bookings',
    'menu.reports',
  ];
  const kiggleStaffMenus = allMenus.filter((m) =>
    kiggleStaffMenuCodes.includes(m.code),
  );
  for (const menu of kiggleStaffMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: roles.kiggleStaff.id,
          menuId: menu.id,
        },
      },
      update: {},
      create: {
        roleId: roles.kiggleStaff.id,
        menuId: menu.id,
      },
    });
  }
  console.log(`    → Kiggle Staff: ${kiggleStaffMenus.length} menus`);

  // 6.3 PARTNER_ADMIN: All except system menus
  const partnerAdminMenus = allMenus.filter(
    (m) => !m.code.includes('organization') && !m.code.includes('user'),
  );
  for (const menu of partnerAdminMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: roles.partnerAdmin.id,
          menuId: menu.id,
        },
      },
      update: {},
      create: {
        roleId: roles.partnerAdmin.id,
        menuId: menu.id,
      },
    });
  }
  console.log(`    → Partner Admin: ${partnerAdminMenus.length} menus`);

  // 6.4 PARTNER_STAFF: Limited menus
  const partnerStaffMenuCodes = [
    'menu.dashboard',
    'menu.products',
    'menu.bookings',
    'menu.reports',
    'btn.booking.edit',
  ];
  const partnerStaffMenus = allMenus.filter((m) =>
    partnerStaffMenuCodes.includes(m.code),
  );
  for (const menu of partnerStaffMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: roles.partnerStaff.id,
          menuId: menu.id,
        },
      },
      update: {},
      create: {
        roleId: roles.partnerStaff.id,
        menuId: menu.id,
      },
    });
  }
  console.log(`    → Partner Staff: ${partnerStaffMenus.length} menus`);

  // 6.5 TUTOR: Own resources menus
  const tutorMenuCodes = [
    'menu.dashboard',
    'menu.products',
    'menu.bookings',
    'btn.booking.edit',
  ];
  const tutorMenus = allMenus.filter((m) => tutorMenuCodes.includes(m.code));
  for (const menu of tutorMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: roles.tutor.id,
          menuId: menu.id,
        },
      },
      update: {},
      create: {
        roleId: roles.tutor.id,
        menuId: menu.id,
      },
    });
  }
  console.log(`    → Tutor: ${tutorMenus.length} menus`);

  // 6.6 PARENT: Marketplace menus
  const parentMenuCodes = [
    'menu.dashboard',
    'menu.products',
    'menu.bookings',
    'btn.booking.cancel',
  ];
  const parentMenus = allMenus.filter((m) => parentMenuCodes.includes(m.code));
  for (const menu of parentMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: roles.parent.id,
          menuId: menu.id,
        },
      },
      update: {},
      create: {
        roleId: roles.parent.id,
        menuId: menu.id,
      },
    });
  }
  console.log(`    → Parent: ${parentMenus.length} menus`);

  console.log('✅ Menu system seeding completed!\n');
}

