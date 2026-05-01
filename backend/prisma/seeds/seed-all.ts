import { PrismaClient } from '../../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { execSync } from 'child_process';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function seedAll() {
  console.log('🌱 Starting database seeding...\n');

  try {
    console.log('1️⃣ Seeding super admin...');
    execSync('npx tsx prisma/seeds/seed-super-admin.ts', { stdio: 'inherit' });

    console.log('\n2️⃣ Seeding niches...');
    execSync('npx tsx prisma/seeds/seed-niches.ts', { stdio: 'inherit' });

    console.log('\n✅ All seeds completed successfully!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedAll()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
