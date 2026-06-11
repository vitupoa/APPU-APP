import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillUserFields() {
  console.log('Starting backfill of user display_name and is_verified fields...');

  try {
    // Update users where display_name is NULL - set to username
    const displayNameResult = await prisma.$executeRaw`
      UPDATE "user" 
      SET display_name = username 
      WHERE display_name IS NULL
    `;
    console.log(`✓ Updated ${displayNameResult} users with NULL display_name`);

    // Update users where is_verified is NULL - set to false
    const isVerifiedResult = await prisma.$executeRaw`
      UPDATE "user" 
      SET is_verified = false 
      WHERE is_verified IS NULL
    `;
    console.log(`✓ Updated ${isVerifiedResult} users with NULL is_verified`);

    console.log('✓ Backfill completed successfully');
  } catch (error) {
    console.error('✗ Error during backfill:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backfillUserFields();
