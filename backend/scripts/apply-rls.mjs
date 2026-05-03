import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Client } = pg;

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('📦 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to database');

    console.log('\n📦 Reading RLS migration file...');
    const sqlPath = join(__dirname, '..', 'prisma', 'migrations', 'add_rls_policies.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('🚀 Applying RLS policies migration...');
    await client.query(sql);

    console.log('✅ RLS policies migration applied successfully!');
    console.log('\n📊 Verifying RLS status...');
    
    // Verify RLS is enabled
    const rlsStatus = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename IN (
        'subscription_tiers', 
        'subscriptions', 
        'content_unlocks', 
        'shorts', 
        'posts', 
        'live_streams',
        'wallets',
        'transactions'
      )
      ORDER BY tablename;
    `);

    console.log('\n✅ RLS Status:');
    console.table(rlsStatus.rows);

    // Count policies
    const policyCount = await client.query(`
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies 
      WHERE tablename IN (
        'subscription_tiers', 
        'subscriptions', 
        'content_unlocks', 
        'shorts', 
        'posts', 
        'live_streams',
        'wallets',
        'transactions'
      )
      GROUP BY tablename
      ORDER BY tablename;
    `);

    console.log('\n✅ Policy Count by Table:');
    console.table(policyCount.rows);

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
