import { PrismaClient } from '@prisma/client';
import { seedRBAC } from './seeds/01-rbac.seed';
import { seedMenus } from './seeds/02-menus.seed';
import { seedUsers } from './seeds/03-users.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed RBAC (Permissions & Roles)
    const rbacContext = await seedRBAC();

    // 2. Seed Menu System
    await seedMenus(rbacContext);

    // 3. Seed Users
    await seedUsers(rbacContext);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

