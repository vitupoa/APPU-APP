import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const PUBLIC_DB_URL = process.env.DATABASE_PUBLIC_URL;

if (!PUBLIC_DB_URL) {
  console.error('❌ DATABASE_PUBLIC_URL not found in .env file');
  process.exit(1);
}

console.log('🚀 Running Prisma migrations...\n');

try {
  // Step 1: Run Prisma migrate
  console.log('📦 Step 1: Running Prisma migrate dev...');
  execSync(`npx prisma migrate dev --name add_missing_features`, {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: PUBLIC_DB_URL }
  });
  console.log('✅ Prisma migration completed\n');

  // Step 2: Generate Prisma Client
  console.log('📦 Step 2: Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma Client generated\n');

  console.log('✅ All migrations completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   Run RLS migrations manually using:');
  console.log('   node run-rls-migrations.js');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
