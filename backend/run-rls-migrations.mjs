import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PUBLIC_DB_URL = process.env.DATABASE_PUBLIC_URL;

if (!PUBLIC_DB_URL) {
  console.error('❌ DATABASE_PUBLIC_URL not found in .env file');
  process.exit(1);
}

async function runRLSMigrations() {
  const client = new Client({
    connectionString: PUBLIC_DB_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database\n');

    // Read and execute add_rls_policies.sql
    console.log('📦 Step 1: Running add_rls_policies.sql...');
    const rlsPoliciesSQL = fs.readFileSync(
      path.join(__dirname, 'prisma', 'migrations', 'add_rls_policies.sql'),
      'utf8'
    );
    await client.query(rlsPoliciesSQL);
    console.log('✅ RLS policies added successfully\n');

    // Read and execute enable_row_level_security.sql
    console.log('📦 Step 2: Running enable_row_level_security.sql...');
    const enableRLSSQL = fs.readFileSync(
      path.join(__dirname, 'prisma', 'migrations', 'enable_row_level_security.sql'),
      'utf8'
    );
    await client.query(enableRLSSQL);
    console.log('✅ Row-level security enabled successfully\n');

    console.log('🎉 All RLS migrations completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✓ RLS helper functions created');
    console.log('   ✓ RLS policies applied to all tables');
    console.log('   ✓ Security indexes created');
    console.log('\n⚠️  Important: Make sure to call set_current_user_id() in your application');
    console.log('   at the start of each authenticated request.');

  } catch (error) {
    console.error('❌ RLS migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runRLSMigrations();
