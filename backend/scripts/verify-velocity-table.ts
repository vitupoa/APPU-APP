import pg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pg;

/**
 * Verify Velocity Tracking Table
 * Check if transaction_velocity table exists and has correct structure
 */

async function verifyVelocityTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 Verifying transaction_velocity table...\n');

    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'transaction_velocity'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ Table transaction_velocity does not exist!');
      process.exit(1);
    }

    console.log('✅ Table transaction_velocity exists');

    // Get table structure
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'transaction_velocity'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Table Structure:');
    columns.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Get indexes
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'transaction_velocity';
    `);

    console.log('\n🔑 Indexes:');
    indexes.rows.forEach(idx => {
      console.log(`   - ${idx.indexname}`);
    });

    // Check row count
    const count = await pool.query(`
      SELECT COUNT(*) as count FROM transaction_velocity;
    `);

    console.log(`\n📊 Current row count: ${count.rows[0].count}`);

    console.log('\n✅ Verification complete!');

  } catch (error: any) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run verification
verifyVelocityTable();
