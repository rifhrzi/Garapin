import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed categories with minimum prices (IDR)
  const categories = [
    { name: 'Web Development', slug: 'web-development', minPrice: 100000 },
    { name: 'Mobile Development', slug: 'mobile-development', minPrice: 150000 },
    { name: 'UI/UX Design', slug: 'ui-ux-design', minPrice: 75000 },
    { name: 'Graphic Design', slug: 'graphic-design', minPrice: 50000 },
    { name: 'Data Entry', slug: 'data-entry', minPrice: 25000 },
    { name: 'Content Writing', slug: 'content-writing', minPrice: 30000 },
    { name: 'Translation', slug: 'translation', minPrice: 30000 },
    { name: 'Video Editing', slug: 'video-editing', minPrice: 75000 },
    { name: 'Digital Marketing', slug: 'digital-marketing', minPrice: 50000 },
    { name: 'Academic / Tugas', slug: 'academic-tugas', minPrice: 25000 },
    { name: 'Game Development', slug: 'game-development', minPrice: 200000 },
    { name: 'DevOps & Cloud', slug: 'devops-cloud', minPrice: 150000 },
    { name: 'Other', slug: 'other', minPrice: 20000 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, minPrice: cat.minPrice },
      create: cat,
    });
  }
  console.log(`Seeded ${categories.length} categories`);

  // Seed admin user — password from env to avoid hardcoded secrets
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!adminPassword) {
    console.warn('ADMIN_SEED_PASSWORD not set — skipping admin user seed');
  } else {
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: 'admin@platformjoki.com' },
      update: {},
      create: {
        email: 'admin@platformjoki.com',
        passwordHash: adminPasswordHash,
        role: 'ADMIN',
        emailVerified: true,
        phoneVerified: true,
      },
    });
    console.log('Seeded admin user (admin@platformjoki.com)');
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
