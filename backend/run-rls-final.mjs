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

    // Read and execute corrected RLS policies
    console.log('📦 Running RLS policies migration (corrected table names)...');
    const rlsPoliciesSQL = fs.readFileSync(
      path.join(__dirname, 'prisma', 'migrations', 'add_rls_policies_corrected.sql'),
      'utf8'
    );
    
    const result = await client.query(rlsPoliciesSQL);
    
    // Display any notices from the SQL
    if (result && result.rows) {
      result.rows.forEach(row => {
        console.log(row);
      });
    }
    
    console.log('✅ RLS policies added successfully\n');

    console.log('🎉 All RLS migrations completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✓ RLS helper functions created');
    console.log('   ✓ RLS policies applied to tables:');
    console.log('     - User (user management)');
    console.log('     - SubscriptionTier (subscription tiers)');
    console.log('     - subscriptions (active subscriptions)');
    console.log('     - content_unlocks (paid content access)');
    console.log('     - shorts (short videos)');
    console.log('     - Post (posts)');
    console.log('     - LiveStream (live streams)');
    console.log('     - wallets (user wallets)');
    console.log('     - transactions (financial transactions)');
    console.log('   ✓ Security indexes created');
    console.log('\n⚠️  Important: Set user context in your application');
    console.log('   Example in your auth middleware:');
    console.log('   await prisma.$executeRaw`SELECT set_config(\'app.current_user_id\', ${userId}, false)`');
    console.log('\n   For system operations:');
    console.log('   await prisma.$executeRaw`SELECT set_config(\'app.is_system\', \'true\', false)`');

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
