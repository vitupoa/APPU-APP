import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function runRlsMigration() {
  console.log('🔒 Starting RLS Migration for Railway...\n');

  try {
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'prisma', 'migrations', 'enable_row_level_security.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Split SQL into individual statements (separated by semicolons)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty lines
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      try {
        console.log(`[${i + 1}/${statements.length}] Executing statement...`);
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Success\n`);
      } catch (error: any) {
        // Some statements might fail if already executed (e.g., policies already exist)
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Already exists, skipping\n`);
        } else {
          console.error(`❌ Error: ${error.message}\n`);
          throw error;
        }
      }
    }

    // Verify RLS is enabled
    console.log('🔍 Verifying RLS status...\n');
    const result = await prisma.$queryRaw`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'wallets', 'transactions', 'withdrawal_requests', 'kyc_documents')
      ORDER BY tablename;
    `;

    console.log('RLS Status:');
    console.table(result);

    console.log('\n✅ RLS Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT: Make sure to deploy the updated application code');
    console.log('   The RLS middleware must be active for policies to work correctly.\n');

  } catch (error: any) {
    console.error('\n❌ RLS Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRlsMigration();
