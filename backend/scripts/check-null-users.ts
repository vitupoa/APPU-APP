import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function checkNullUsers() {
  console.log('Checking for users with NULL display_name or is_verified...\n');
  
  const usersWithNullDisplayName = await prisma.user.findMany({
    where: { display_name: null },
    select: { id: true, username: true, email: true, first_name: true, last_name: true, display_name: true, is_verified: true }
  });
  
  const usersWithNullIsVerified = await prisma.user.findMany({
    where: { is_verified: null },
    select: { id: true, username: true, email: true, first_name: true, last_name: true, display_name: true, is_verified: true }
  });
  
  console.log(`Found ${usersWithNullDisplayName.length} users with NULL display_name:`);
  usersWithNullDisplayName.forEach(u => console.log(`  - ${u.username} (${u.email}): first_name="${u.first_name}", last_name="${u.last_name}"`));
  
  console.log(`\nFound ${usersWithNullIsVerified.length} users with NULL is_verified:`);
  usersWithNullIsVerified.forEach(u => console.log(`  - ${u.username} (${u.email})`));
  
  await prisma.$disconnect();
}

checkNullUsers();
