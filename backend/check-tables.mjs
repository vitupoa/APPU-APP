import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

const PUBLIC_DB_URL = process.env.DATABASE_PUBLIC_URL;

async function checkTables() {
  const client = new Client({
    connectionString: PUBLIC_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 Checking existing tables...\n');

    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);

    console.log('📋 Existing tables:');
    result.rows.forEach(row => console.log(`   - ${row.tablename}`));
    
    console.log('\n🔍 Checking for RLS-required tables:');
    const requiredTables = [
      'subscription_tiers',
      'subscriptions', 
      'content_unlocks',
      'shorts',
      'posts',
      'Post',
      'live_streams',
      'LiveStream',
      'wallets',
      'transactions',
      'User',
      'users',
      'SubscriptionTier'
    ];

    for (const table of requiredTables) {
      const exists = result.rows.some(row => row.tablename === table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTables();
