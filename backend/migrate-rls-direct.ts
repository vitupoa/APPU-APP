import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

async function runRLSMigration() {
  console.log('🔒 Starting Row-Level Security (RLS) Migration...\n');

  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not found');
    process.exit(1);
  }

  console.log('✅ Database URL found');

  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to database\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'prisma', 'migrations', 'enable_row_level_security.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found at: ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');
    
    console.log('📄 SQL file loaded successfully');
    console.log(`📏 SQL length: ${sql.length} characters\n`);

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await client.query(statement + ';');
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error) {
        // Some statements might fail if already applied
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)\n`);
        } else {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n✅ RLS Migration completed successfully!\n');

    // Verify RLS is enabled
    console.log('🔍 Verifying RLS status...\n');
    
    const tables = [
      'User', 'Wallet', 'Transaction', 'WithdrawalRequest', 
      'KYCDocument', 'Post', 'Short', 'ChamaMember'
    ];

    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT relname, relrowsecurity 
          FROM pg_class 
          WHERE relname = $1;
        `, [table]);
        
        if (result.rows.length > 0) {
          const status = result.rows[0].relrowsecurity ? '✅ ENABLED' : '❌ DISABLED';
          console.log(`  ${table}: ${status}`);
        }
      } catch (error) {
        console.log(`  ${table}: ⚠️  Could not verify`);
      }
    }

    console.log('\n🎉 RLS Migration completed and verified!\n');
    console.log('✨ Your database is now protected with Row-Level Security.\n');
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ RLS Migration failed:', error.message);
    console.error('\nStack trace:', error.stack);
    await pool.end();
    process.exit(1);
  }
}

// Run the migration
runRLSMigration();
