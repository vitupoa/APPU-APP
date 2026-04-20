import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from 'dotenv';

config();

const { Pool } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Database Migration Runner
 * 
 * Runs all SQL migration files in the prisma/migrations directory
 * Tracks executed migrations to avoid re-running them
 */

interface Migration {
  filename: string;
  executed_at: Date;
}

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Starting database migrations...\n');

    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Get list of already executed migrations
    const { rows: executedMigrations } = await pool.query<Migration>(
      'SELECT filename FROM _migrations ORDER BY executed_at'
    );
    const executedFiles = new Set(executedMigrations.map(m => m.filename));

    console.log(`✅ Found ${executedFiles.size} previously executed migrations\n`);

    // List of migration files to run (in order)
    const migrationFiles = [
      'add_contest_vote_fields.sql',
      'add_feeds_and_voting.sql',
      'add_comments_system.sql',
      'add_team_contests.sql',
    ];

    let executedCount = 0;
    let skippedCount = 0;

    for (const filename of migrationFiles) {
      if (executedFiles.has(filename)) {
        console.log(`⏭️  Skipping ${filename} (already executed)`);
        skippedCount++;
        continue;
      }

      console.log(`🔧 Running migration: ${filename}`);
      
      try {
        const migrationPath = join(__dirname, '..', 'prisma', 'migrations', filename);
        const sql = readFileSync(migrationPath, 'utf-8');

        // Execute migration in a transaction
        await pool.query('BEGIN');
        
        // Run the migration SQL
        await pool.query(sql);
        
        // Record the migration
        await pool.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [filename]
        );
        
        await pool.query('COMMIT');
        
        console.log(`✅ Successfully executed ${filename}\n`);
        executedCount++;
      } catch (error: any) {
        await pool.query('ROLLBACK');
        console.error(`❌ Error executing ${filename}:`, error.message);
        throw error;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Executed: ${executedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📝 Total: ${migrationFiles.length}`);
    
    if (executedCount > 0) {
      console.log('\n🎉 Database migrations completed successfully!');
    } else {
      console.log('\n✨ Database is up to date!');
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
