import { PrismaClient } from './src/generated/prisma/client.ts';

const prisma = new PrismaClient();

async function addCategoryColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Chat';`
    );
    console.log('✅ Category column added successfully');
    
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS live_streams_category_idx ON live_streams(category);`
    );
    console.log('✅ Category index created successfully');
    
    await prisma.$executeRawUnsafe(
      `UPDATE live_streams SET category = 'Gaming' WHERE LOWER(title) LIKE '%game%' OR LOWER(title) LIKE '%gaming%' OR LOWER(title) LIKE '%play%';`
    );
    await prisma.$executeRawUnsafe(
      `UPDATE live_streams SET category = 'Music' WHERE LOWER(title) LIKE '%music%' OR LOWER(title) LIKE '%sing%' OR LOWER(title) LIKE '%song%';`
    );
    await prisma.$executeRawUnsafe(
      `UPDATE live_streams SET category = 'Sports' WHERE LOWER(title) LIKE '%sport%' OR LOWER(title) LIKE '%fitness%' OR LOWER(title) LIKE '%workout%';`
    );
    await prisma.$executeRawUnsafe(
      `UPDATE live_streams SET category = 'Art' WHERE LOWER(title) LIKE '%art%' OR LOWER(title) LIKE '%draw%' OR LOWER(title) LIKE '%paint%';`
    );
    await prisma.$executeRawUnsafe(
      `UPDATE live_streams SET category = 'Cooking' WHERE LOWER(title) LIKE '%cook%' OR LOWER(title) LIKE '%recipe%' OR LOWER(title) LIKE '%food%';`
    );
    await prisma.$executeRawUnsafe(
      `UPDATE live_streams SET category = 'Tech' WHERE LOWER(title) LIKE '%tech%' OR LOWER(title) LIKE '%code%' OR LOWER(title) LIKE '%programming%';`
    );
    console.log('✅ Existing records updated with inferred categories');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addCategoryColumn();
