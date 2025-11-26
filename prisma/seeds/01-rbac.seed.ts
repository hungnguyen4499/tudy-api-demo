import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRBAC() {
  console.log('🌱 Seeding RBAC (Permissions & Roles)...');

  // ============================================
  // 1. CREATE PERMISSIONS
  // ============================================
  console.log('  → Creating permissions...');

  const permissions = await Promise.all([
    // Product permissions
    prisma.permission.upsert({
      where: { code: 'product.create' },
      update: {},
      create: {
        code: 'product.create',
        resource: 'product',
        action: 'create',
        displayName: 'Create Product',
        description: 'Ability to create new products',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'product.read' },
      update: {},
      create: {
        code: 'product.read',
        resource: 'product',
        action: 'read',
        displayName: 'View Products',
        description: 'Ability to view products',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'product.update' },
      update: {},
      create: {
        code: 'product.update',
        resource: 'product',
        action: 'update',
        displayName: 'Update Product',
        description: 'Ability to update existing products',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'product.delete' },
      update: {},
      create: {
        code: 'product.delete',
        resource: 'product',
        action: 'delete',
        displayName: 'Delete Product',
        description: 'Ability to delete products',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'product.export' },
      update: {},
      create: {
        code: 'product.export',
        resource: 'product',
        action: 'export',
        displayName: 'Export Products',
        description: 'Ability to export product data',
      },
    }),

    // Booking permissions
    prisma.permission.upsert({
      where: { code: 'booking.create' },
      update: {},
      create: {
        code: 'booking.create',
        resource: 'booking',
        action: 'create',
        displayName: 'Create Booking',
        description: 'Ability to create bookings',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'booking.read' },
      update: {},
      create: {
        code: 'booking.read',
        resource: 'booking',
        action: 'read',
        displayName: 'View Bookings',
        description: 'Ability to view bookings',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'booking.update' },
      update: {},
      create: {
        code: 'booking.update',
        resource: 'booking',
        action: 'update',
        displayName: 'Update Booking',
        description: 'Ability to update bookings',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'booking.delete' },
      update: {},
      create: {
        code: 'booking.delete',
        resource: 'booking',
        action: 'delete',
        displayName: 'Delete Booking',
        description: 'Ability to delete bookings',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'booking.approve' },
      update: {},
      create: {
        code: 'booking.approve',
        resource: 'booking',
        action: 'approve',
        displayName: 'Approve Booking',
        description: 'Ability to approve bookings',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'booking.cancel' },
      update: {},
      create: {
        code: 'booking.cancel',
        resource: 'booking',
        action: 'cancel',
        displayName: 'Cancel Booking',
        description: 'Ability to cancel bookings',
      },
    }),

    // Report permissions
    prisma.permission.upsert({
      where: { code: 'report.view' },
      update: {},
      create: {
        code: 'report.view',
        resource: 'report',
        action: 'view',
        displayName: 'View Reports',
        description: 'Ability to view reports and analytics',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'report.export' },
      update: {},
      create: {
        code: 'report.export',
        resource: 'report',
        action: 'export',
        displayName: 'Export Reports',
        description: 'Ability to export report data',
      },
    }),

    // Member permissions
    prisma.permission.upsert({
      where: { code: 'member.manage' },
      update: {},
      create: {
        code: 'member.manage',
        resource: 'member',
        action: 'manage',
        displayName: 'Manage Members',
        description: 'Ability to manage organization members',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'member.invite' },
      update: {},
      create: {
        code: 'member.invite',
        resource: 'member',
        action: 'invite',
        displayName: 'Invite Members',
        description: 'Ability to invite new members',
      },
    }),

    // Organization permissions
    prisma.permission.upsert({
      where: { code: 'organization.manage' },
      update: {},
      create: {
        code: 'organization.manage',
        resource: 'organization',
        action: 'manage',
        displayName: 'Manage Organizations',
        description: 'Ability to manage organizations (admin only)',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'organization.view' },
      update: {},
      create: {
        code: 'organization.view',
        resource: 'organization',
        action: 'view',
        displayName: 'View Organizations',
        description: 'Ability to view all organizations',
      },
    }),

    // User permissions
    prisma.permission.upsert({
      where: { code: 'user.manage' },
      update: {},
      create: {
        code: 'user.manage',
        resource: 'user',
        action: 'manage',
        displayName: 'Manage Users',
        description: 'Ability to manage all users (admin only)',
      },
    }),

    // Role management permissions
    prisma.permission.upsert({
      where: { code: 'role.create' },
      update: {},
      create: {
        code: 'role.create',
        resource: 'role',
        action: 'create',
        displayName: 'Create Role',
        description: 'Ability to create new roles',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'role.read' },
      update: {},
      create: {
        code: 'role.read',
        resource: 'role',
        action: 'read',
        displayName: 'View Roles',
        description: 'Ability to view roles',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'role.update' },
      update: {},
      create: {
        code: 'role.update',
        resource: 'role',
        action: 'update',
        displayName: 'Update Role',
        description: 'Ability to update roles and assign permissions',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'role.delete' },
      update: {},
      create: {
        code: 'role.delete',
        resource: 'role',
        action: 'delete',
        displayName: 'Delete Role',
        description: 'Ability to delete roles',
      },
    }),

    // Permission management permissions
    prisma.permission.upsert({
      where: { code: 'permission.create' },
      update: {},
      create: {
        code: 'permission.create',
        resource: 'permission',
        action: 'create',
        displayName: 'Create Permission',
        description: 'Ability to create new permissions',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'permission.read' },
      update: {},
      create: {
        code: 'permission.read',
        resource: 'permission',
        action: 'read',
        displayName: 'View Permissions',
        description: 'Ability to view permissions',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'permission.update' },
      update: {},
      create: {
        code: 'permission.update',
        resource: 'permission',
        action: 'update',
        displayName: 'Update Permission',
        description: 'Ability to update permissions',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'permission.delete' },
      update: {},
      create: {
        code: 'permission.delete',
        resource: 'permission',
        action: 'delete',
        displayName: 'Delete Permission',
        description: 'Ability to delete permissions',
      },
    }),

    // Menu management permissions
    prisma.permission.upsert({
      where: { code: 'menu.create' },
      update: {},
      create: {
        code: 'menu.create',
        resource: 'menu',
        action: 'create',
        displayName: 'Create Menu',
        description: 'Ability to create new menus',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'menu.read' },
      update: {},
      create: {
        code: 'menu.read',
        resource: 'menu',
        action: 'read',
        displayName: 'View Menus',
        description: 'Ability to view menus',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'menu.update' },
      update: {},
      create: {
        code: 'menu.update',
        resource: 'menu',
        action: 'update',
        displayName: 'Update Menu',
        description: 'Ability to update menus',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'menu.delete' },
      update: {},
      create: {
        code: 'menu.delete',
        resource: 'menu',
        action: 'delete',
        displayName: 'Delete Menu',
        description: 'Ability to delete menus',
      },
    }),

    // Admin wildcard
    prisma.permission.upsert({
      where: { code: '*.*' },
      update: {},
      create: {
        code: '*.*',
        resource: '*',
        action: '*',
        displayName: 'All Permissions',
        description: 'Full access to all resources and actions',
      },
    }),
  ]);

  console.log(`  ✅ Created ${permissions.length} permissions`);

  // ============================================
  // 2. CREATE ROLES
  // ============================================
  console.log('  → Creating roles...');

  // 2.1 KIGGLE_ADMIN (GLOBAL data access)
  const kiggleAdminRole = await prisma.role.upsert({
    where: { name: 'kiggle_admin' },
    update: { dataScope: 'GLOBAL' },
    create: {
      name: 'kiggle_admin',
      displayName: 'Kiggle Administrator',
      description: 'Full platform access with all permissions',
      dataScope: 'GLOBAL',
      isSystem: true,
    },
  });

  // 2.2 KIGGLE_STAFF (GLOBAL data access)
  const kiggleStaffRole = await prisma.role.upsert({
    where: { name: 'kiggle_staff' },
    update: { dataScope: 'GLOBAL' },
    create: {
      name: 'kiggle_staff',
      displayName: 'Kiggle Staff',
      description: 'Platform staff with read-only access',
      dataScope: 'GLOBAL',
      isSystem: true,
    },
  });

  // 2.3 PARTNER_ADMIN (ORGANIZATION data access)
  const partnerAdminRole = await prisma.role.upsert({
    where: { name: 'partner_admin' },
    update: { dataScope: 'ORGANIZATION' },
    create: {
      name: 'partner_admin',
      displayName: 'Partner Administrator',
      description: 'Full access within organization',
      dataScope: 'ORGANIZATION',
      isSystem: true,
    },
  });

  // 2.4 PARTNER_STAFF (ORGANIZATION data access)
  const partnerStaffRole = await prisma.role.upsert({
    where: { name: 'partner_staff' },
    update: { dataScope: 'ORGANIZATION' },
    create: {
      name: 'partner_staff',
      displayName: 'Partner Staff',
      description: 'Limited access within organization',
      dataScope: 'ORGANIZATION',
      isSystem: true,
    },
  });

  // 2.5 TUTOR (ORGANIZATION data access)
  const tutorRole = await prisma.role.upsert({
    where: { name: 'tutor' },
    update: { dataScope: 'ORGANIZATION' },
    create: {
      name: 'tutor',
      displayName: 'Tutor',
      description: 'Access to own resources within organization',
      dataScope: 'ORGANIZATION',
      isSystem: true,
    },
  });

  // 2.6 PARENT (USER data access)
  const parentRole = await prisma.role.upsert({
    where: { name: 'parent' },
    update: { dataScope: 'USER' },
    create: {
      name: 'parent',
      displayName: 'Parent',
      description: 'View all products, manage own bookings',
      dataScope: 'USER',
      isSystem: true,
    },
  });

  console.log('  ✅ Created 6 roles');

  // ============================================
  // 3. ASSIGN PERMISSIONS TO ROLES
  // ============================================
  console.log('  → Assigning permissions to roles...');

  // Get permission IDs
  const permissionMap = Object.fromEntries(
    permissions.map((p) => [p.code, p.id]),
  );

  // 3.1 KIGGLE_ADMIN: All permissions
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: kiggleAdminRole.id,
        permissionId: permissionMap['*.*'],
      },
    },
    update: {},
    create: {
      roleId: kiggleAdminRole.id,
      permissionId: permissionMap['*.*'],
    },
  });

  // 3.2 KIGGLE_STAFF: Read-only permissions
  const kiggleStaffPermissions = [
    'product.read',
    'booking.read',
    'report.view',
    'organization.view',
  ];
  for (const permCode of kiggleStaffPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: kiggleStaffRole.id,
          permissionId: permissionMap[permCode],
        },
      },
      update: {},
      create: {
        roleId: kiggleStaffRole.id,
        permissionId: permissionMap[permCode],
      },
    });
  }

  // 3.3 PARTNER_ADMIN: Full organization permissions
  const partnerAdminPermissions = [
    'product.create',
    'product.read',
    'product.update',
    'product.delete',
    'product.export',
    'booking.read',
    'booking.update',
    'booking.approve',
    'booking.cancel',
    'report.view',
    'report.export',
    'member.manage',
    'member.invite',
  ];
  for (const permCode of partnerAdminPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: partnerAdminRole.id,
          permissionId: permissionMap[permCode],
        },
      },
      update: {},
      create: {
        roleId: partnerAdminRole.id,
        permissionId: permissionMap[permCode],
      },
    });
  }

  // 3.4 PARTNER_STAFF: Limited permissions
  const partnerStaffPermissions = [
    'product.read',
    'booking.read',
    'booking.update',
    'report.view',
  ];
  for (const permCode of partnerStaffPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: partnerStaffRole.id,
          permissionId: permissionMap[permCode],
        },
      },
      update: {},
      create: {
        roleId: partnerStaffRole.id,
        permissionId: permissionMap[permCode],
      },
    });
  }

  // 3.5 TUTOR: Own resources only
  const tutorPermissions = [
    'product.read',
    'booking.read',
    'booking.update',
  ];
  for (const permCode of tutorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: tutorRole.id,
          permissionId: permissionMap[permCode],
        },
      },
      update: {},
      create: {
        roleId: tutorRole.id,
        permissionId: permissionMap[permCode],
      },
    });
  }

  // 3.6 PARENT: View all + manage own
  const parentPermissions = [
    'product.read',
    'booking.create',
    'booking.read',
    'booking.cancel',
  ];
  for (const permCode of parentPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: parentRole.id,
          permissionId: permissionMap[permCode],
        },
      },
      update: {},
      create: {
        roleId: parentRole.id,
        permissionId: permissionMap[permCode],
      },
    });
  }

  console.log('  ✅ Assigned permissions to roles');

  console.log('✅ RBAC seeding completed!\n');

  return {
    permissions: permissionMap,
    roles: {
      kiggleAdmin: kiggleAdminRole,
      kiggleStaff: kiggleStaffRole,
      partnerAdmin: partnerAdminRole,
      partnerStaff: partnerStaffRole,
      tutor: tutorRole,
      parent: parentRole,
    },
  };
}

