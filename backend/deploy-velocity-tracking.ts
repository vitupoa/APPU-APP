import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Database connection
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runMigration(filePath: string, migrationName: string) {
  console.log(`\n📄 Running migration: ${migrationName}`);
  console.log(`📁 File: ${filePath}`);
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(filePath, 'utf-8');
    
    // Split by semicolons to get individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.startsWith('/*') || statement.trim().length === 0) {
        continue;
      }
      
      try {
        // Show preview of statement
        const preview = statement.substring(0, 100).replace(/\n/g, ' ');
        process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}... `);
        
        await prisma.$executeRawUnsafe(statement);
        
        console.log('✅');
        successCount++;
      } catch (error: any) {
        console.log('❌');
        console.error(`    Error: ${error.message}`);
        errorCount++;
        
        // Continue with other statements even if one fails
      }
    }
    
    console.log(`\n✅ Migration completed: ${successCount} successful, ${errorCount} errors`);
    return { success: true, successCount, errorCount };
    
  } catch (error: any) {
    console.error(`❌ Failed to run migration: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');
  
  try {
    // Check if transaction_velocity table exists
    const velocityTable = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'transaction_velocity'
    `;
    console.log('✅ transaction_velocity table:', velocityTable);
    
    console.log('\n✅ Verification complete!');
    
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Velocity Tracking Migration Deployment');
  console.log('=' .repeat(60));
  
  const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
  
  // Deploy velocity tracking migration
  const migrationPath = path.join(migrationsDir, 'add_velocity_tracking_tables.sql');
  const result = await runMigration(migrationPath, 'Add Velocity Tracking Tables');
  
  // Verify migration
  await verifyMigration();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Migration: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  - Successful statements: ${result.successCount || 0}`);
  console.log(`  - Failed statements: ${result.errorCount || 0}`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
  await pool.end();
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
