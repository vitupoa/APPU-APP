import { PrismaClient } from '../../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function seedSuperAdmin() {
  console.log('🌱 Creating super admin user...');

  const email = 'reinherts@gmail.com';
  const password = 'Admin@123';
  const passwordHash = await bcrypt.hash(password, 10);

  const superAdmin = await prisma.user.upsert({
    where: { email },
    update: {
      isAdmin: true,
      isVerified: true
    },
    create: {
      email,
      username: 'Username',
      firstName: 'Krieta',
      lastName: 'LTD',
      displayName: 'Krieta LTD',
      passwordHash,
      country: 'KE',
      currency: 'KES',
      accountType: 'BUSINESS',
      isAdmin: true,
      isVerified: true,
      wallet: {
        create: {
          krBalance: 100000000, // 100 million KR
        }
      }
    }
  });

  console.log('✅ Super admin created:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   ID: ${superAdmin.id}`);
  console.log('⚠️  IMPORTANT: Change the password immediately in production!');
}

seedSuperAdmin()
  .catch((e) => {
    console.error('❌ Error creating super admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
