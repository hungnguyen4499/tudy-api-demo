import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface SeedContext {
  roles: {
    kiggleAdmin: { id: number };
    kiggleStaff: { id: number };
    partnerAdmin: { id: number };
    partnerStaff: { id: number };
    tutor: { id: number };
    parent: { id: number };
  };
}

const DEFAULT_PASSWORD = '123456';
const SALT_ROUNDS = 10;

export async function seedUsers(context: SeedContext) {
  console.log('🌱 Seeding Users...');

  const { roles } = context;

  // Hash password once for all users
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  // ============================================
  // 1. KIGGLE ADMIN
  // ============================================
  console.log('  → Creating Kiggle Admin...');
  const kiggleAdmin = await prisma.user.upsert({
    where: { email: 'admin@kiggle.com' },
    update: {},
    create: {
      email: 'admin@kiggle.com',
      phone: '+84901234567',
      passwordHash,
      firstName: 'Kiggle',
      lastName: 'Administrator',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // Assign role
  const existingKiggleAdminRole = await prisma.userRole.findFirst({
    where: {
      userId: kiggleAdmin.id,
      roleId: roles.kiggleAdmin.id,
    },
  });
  if (!existingKiggleAdminRole) {
    await prisma.userRole.create({
      data: {
        userId: kiggleAdmin.id,
        roleId: roles.kiggleAdmin.id,
      },
    });
  }

  console.log(`    ✅ Created: ${kiggleAdmin.email}`);

  // ============================================
  // 2. KIGGLE STAFF
  // ============================================
  console.log('  → Creating Kiggle Staff...');
  const kiggleStaff = await prisma.user.upsert({
    where: { email: 'staff@kiggle.com' },
    update: {},
    create: {
      email: 'staff@kiggle.com',
      phone: '+84901234568',
      passwordHash,
      firstName: 'Kiggle',
      lastName: 'Staff',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  const existingKiggleStaffRole = await prisma.userRole.findFirst({
    where: {
      userId: kiggleStaff.id,
      roleId: roles.kiggleStaff.id,
    },
  });
  if (!existingKiggleStaffRole) {
    await prisma.userRole.create({
      data: {
        userId: kiggleStaff.id,
        roleId: roles.kiggleStaff.id,
      },
    });
  }

  console.log(`    ✅ Created: ${kiggleStaff.email}`);

  // ============================================
  // 3. PARTNER ADMIN (with Organization)
  // ============================================
  console.log('  → Creating Partner Admin...');
  const partnerAdmin = await prisma.user.upsert({
    where: { email: 'admin@partner.com' },
    update: {},
    create: {
      email: 'admin@partner.com',
      phone: '+84901234569',
      passwordHash,
      firstName: 'Partner',
      lastName: 'Administrator',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // Create organization
  const partnerOrg = await prisma.organization.upsert({
    where: { slug: 'partner-education-center' },
    update: {},
    create: {
      type: 'COMPANY',
      name: 'Partner Education Center',
      nameEn: 'Partner Education Center',
      slug: 'partner-education-center',
      description: 'A sample partner organization',
      status: 'APPROVED',
    },
  });

  // Create organization member
  // Note: OrganizationMember is required for users in organizations
  // For non-tutors, we can create it directly
  const existingOrgMember = await prisma.organizationMember.findUnique({
    where: { userId: partnerAdmin.id },
  });
  if (!existingOrgMember) {
    try {
      await prisma.organizationMember.create({
        data: {
          userId: partnerAdmin.id,
          organizationId: partnerOrg.id,
        },
      });
    } catch (error: any) {
      // If foreign key constraint error, user might be a tutor - skip
      if (error.code !== 'P2003') {
        throw error;
      }
    }
  }

  // Assign role
  const existingPartnerAdminRole = await prisma.userRole.findFirst({
    where: {
      userId: partnerAdmin.id,
      roleId: roles.partnerAdmin.id,
    },
  });
  if (!existingPartnerAdminRole) {
    await prisma.userRole.create({
      data: {
        userId: partnerAdmin.id,
        roleId: roles.partnerAdmin.id,
      },
    });
  }

  console.log(`    ✅ Created: ${partnerAdmin.email} (Org: ${partnerOrg.name})`);

  // ============================================
  // 4. PARTNER STAFF (same organization)
  // ============================================
  console.log('  → Creating Partner Staff...');
  const partnerStaff = await prisma.user.upsert({
    where: { email: 'staff@partner.com' },
    update: {},
    create: {
      email: 'staff@partner.com',
      phone: '+84901234570',
      passwordHash,
      firstName: 'Partner',
      lastName: 'Staff',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // Add to same organization
  const existingPartnerStaffOrgMember = await prisma.organizationMember.findUnique({
    where: { userId: partnerStaff.id },
  });
  if (!existingPartnerStaffOrgMember) {
    try {
      await prisma.organizationMember.create({
        data: {
          userId: partnerStaff.id,
          organizationId: partnerOrg.id,
        },
      });
    } catch (error: any) {
      // If foreign key constraint error, user might be a tutor - skip
      if (error.code !== 'P2003') {
        throw error;
      }
    }
  }

  // Assign role
  const existingPartnerStaffRole = await prisma.userRole.findFirst({
    where: {
      userId: partnerStaff.id,
      roleId: roles.partnerStaff.id,
    },
  });
  if (!existingPartnerStaffRole) {
    await prisma.userRole.create({
      data: {
        userId: partnerStaff.id,
        roleId: roles.partnerStaff.id,
      },
    });
  }

  console.log(`    ✅ Created: ${partnerStaff.email} (Org: ${partnerOrg.name})`);

  // ============================================
  // 5. TUTOR (freelance - individual organization)
  // ============================================
  console.log('  → Creating Tutor (Freelance)...');
  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@example.com' },
    update: {},
    create: {
      email: 'tutor@example.com',
      phone: '+84901234571',
      passwordHash,
      firstName: 'John',
      lastName: 'Tutor',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // Create individual organization for freelance tutor
  const tutorOrg = await prisma.organization.upsert({
    where: { slug: 'john-tutor-freelance' },
    update: {},
    create: {
      type: 'INDIVIDUAL',
      name: 'John Tutor - Freelance',
      nameEn: 'John Tutor - Freelance',
      slug: 'john-tutor-freelance',
      description: 'Freelance tutor services',
      status: 'APPROVED',
    },
  });

  // Create tutor profile first (before OrganizationMember)
  await prisma.tutor.upsert({
    where: { userId: tutor.id },
    update: {},
    create: {
      userId: tutor.id,
      organizationId: tutorOrg.id,
      bio: 'Experienced tutor specializing in mathematics and physics',
      university: 'University of Science',
      major: 'Mathematics',
      applicationStatus: 'APPROVED',
      isFreelance: true,
    },
  });

  // Create organization member (after Tutor, as it references Tutor via relation)
  const existingTutorOrgMember = await prisma.organizationMember.findUnique({
    where: { userId: tutor.id },
  });
  if (!existingTutorOrgMember) {
    await prisma.organizationMember.create({
      data: {
        userId: tutor.id,
        organizationId: tutorOrg.id,
      },
    });
  }

  // Assign role
  const existingTutorRole = await prisma.userRole.findFirst({
    where: {
      userId: tutor.id,
      roleId: roles.tutor.id,
    },
  });
  if (!existingTutorRole) {
    await prisma.userRole.create({
      data: {
        userId: tutor.id,
        roleId: roles.tutor.id,
      },
    });
  }

  console.log(`    ✅ Created: ${tutor.email} (Freelance Tutor)`);

  // ============================================
  // 6. PARENT
  // ============================================
  console.log('  → Creating Parent...');
  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: {
      email: 'parent@example.com',
      phone: '+84901234572',
      passwordHash,
      firstName: 'Jane',
      lastName: 'Parent',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // Create parent profile
  await prisma.parent.upsert({
    where: { userId: parent.id },
    update: {},
    create: {
      userId: parent.id,
      preferredCommunication: 'EMAIL',
    },
  });

  // Assign role
  const existingParentRole = await prisma.userRole.findFirst({
    where: {
      userId: parent.id,
      roleId: roles.parent.id,
    },
  });
  if (!existingParentRole) {
    await prisma.userRole.create({
      data: {
        userId: parent.id,
        roleId: roles.parent.id,
      },
    });
  }

  console.log(`    ✅ Created: ${parent.email}`);

  // ============================================
  // 7. ADDITIONAL PARENTS (for testing)
  // ============================================
  console.log('  → Creating additional parents...');
  const additionalParents = [
    {
      email: 'parent1@example.com',
      phone: '+84901234573',
      firstName: 'Alice',
      lastName: 'Smith',
    },
    {
      email: 'parent2@example.com',
      phone: '+84901234574',
      firstName: 'Bob',
      lastName: 'Johnson',
    },
  ];

  for (const parentData of additionalParents) {
    const additionalParent = await prisma.user.upsert({
      where: { email: parentData.email },
      update: {},
      create: {
        email: parentData.email,
        phone: parentData.phone,
        passwordHash,
        firstName: parentData.firstName,
        lastName: parentData.lastName,
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
      },
    });

    await prisma.parent.upsert({
      where: { userId: additionalParent.id },
      update: {},
      create: {
        userId: additionalParent.id,
      },
    });

    const existingAdditionalParentRole = await prisma.userRole.findFirst({
      where: {
        userId: additionalParent.id,
        roleId: roles.parent.id,
      },
    });
    if (!existingAdditionalParentRole) {
      await prisma.userRole.create({
        data: {
          userId: additionalParent.id,
          roleId: roles.parent.id,
        },
      });
    }

    console.log(`    ✅ Created: ${additionalParent.email}`);
  }

  console.log('✅ Users seeding completed!\n');

  return {
    users: {
      kiggleAdmin,
      kiggleStaff,
      partnerAdmin,
      partnerStaff,
      tutor,
      parent,
    },
    organizations: {
      partnerOrg,
      tutorOrg,
    },
  };
}

