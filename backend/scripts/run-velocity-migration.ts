import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Run Velocity Tracking Migration
 * Task 1.3: Create velocity tracking tables
 */

async function runVelocityMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Running velocity tracking migration...\n');

    const migrationPath = join(__dirname, '..', 'prisma', 'migrations', 'add_velocity_tracking_tables.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    // Execute migration
    await pool.query(sql);
    
    console.log('✅ Velocity tracking migration completed successfully!\n');
    console.log('📊 Created:');
    console.log('   - transaction_velocity table');
    console.log('   - Indexes: (user_id, time_window), window_end, user_id');
    console.log('\n📝 Redis cache schema documented in:');
    console.log('   - backend/prisma/migrations/REDIS_VELOCITY_CACHE_SCHEMA.md');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runVelocityMigration();
