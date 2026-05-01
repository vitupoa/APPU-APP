import { PrismaClient } from '../../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PREDEFINED_NICHES = [
  'Tech & Gadgets',
  'Fashion & Style',
  'Beauty & Makeup',
  'Automotive',
  'Food & Beverage',
  'Health & Fitness',
  'Education',
  'Entertainment',
  'Gaming',
  'Travel',
  'Real Estate',
  'Finance & Investment',
  'Sports',
  'Music',
  'Art & Design',
  'Business & Entrepreneurship',
  'Lifestyle',
  'Parenting',
  'Pets & Animals',
  'Home & Decor',
  'General'
];

async function seedNiches() {
  console.log('🌱 Seeding predefined niches...');

  for (const niche of PREDEFINED_NICHES) {
    await prisma.creatorNiche.upsert({
      where: { name: niche },
      update: {},
      create: {
        name: niche,
        isCustom: false,
        usageCount: 0
      }
    });
  }

  console.log(`✅ Seeded ${PREDEFINED_NICHES.length} predefined niches`);
}

seedNiches()
  .catch((e) => {
    console.error('❌ Error seeding niches:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
