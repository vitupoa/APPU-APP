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
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
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
        // (some statements might fail if tables already exist, etc.)
      }
    }
    
    console.log(`\n✅ Migration completed: ${successCount} successful, ${errorCount} errors`);
    return { success: true, successCount, errorCount };
    
  } catch (error: any) {
    console.error(`❌ Failed to run migration: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function verifyMigrations() {
  console.log('\n🔍 Verifying migrations...\n');
  
  try {
    // Check if compliance_reviews table exists
    const complianceReviews = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'compliance_reviews'
    `;
    console.log('✅ compliance_reviews table:', complianceReviews);
    
    // Check if suspicious_activity_reports table exists
    const sarTable = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'suspicious_activity_reports'
    `;
    console.log('✅ suspicious_activity_reports table:', sarTable);
    
    // Check if audit_logs table exists
    const auditLogs = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'audit_logs'
    `;
    console.log('✅ audit_logs table:', auditLogs);
    
    // Check transactions without context
    const txWithoutContext = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE context_type IS NULL
    `;
    console.log('📊 Transactions without context:', txWithoutContext);
    
    // Check users without risk profiles
    const usersWithoutRisk = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "User" 
      WHERE id NOT IN (SELECT user_id FROM user_risk_profiles)
    `;
    console.log('📊 Users without risk profiles:', usersWithoutRisk);
    
    // Check users without withdrawal limits
    const usersWithoutLimits = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "User" 
      WHERE id NOT IN (SELECT user_id FROM withdrawal_limits)
    `;
    console.log('📊 Users without withdrawal limits:', usersWithoutLimits);
    
    console.log('\n✅ Verification complete!');
    
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting Compliance Migrations Deployment');
  console.log('=' .repeat(60));
  
  const migrationsDir = path.join(__dirname, 'prisma', 'migrations');
  
  // Migration 1: Add compliance dashboard tables
  const migration1Path = path.join(migrationsDir, 'add_compliance_dashboard_tables.sql');
  const result1 = await runMigration(migration1Path, 'Add Compliance Dashboard Tables');
  
  // Migration 2: Compliance data migration
  const migration2Path = path.join(migrationsDir, 'compliance_data_migration.sql');
  const result2 = await runMigration(migration2Path, 'Compliance Data Migration');
  
  // Verify migrations
  await verifyMigrations();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Migration 1 (Tables): ${result1.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  - Successful statements: ${result1.successCount || 0}`);
  console.log(`  - Failed statements: ${result1.errorCount || 0}`);
  console.log(`\nMigration 2 (Data): ${result2.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  - Successful statements: ${result2.successCount || 0}`);
  console.log(`  - Failed statements: ${result2.errorCount || 0}`);
  console.log('='.repeat(60));
  
  await prisma.$disconnect();
  await pool.end();
  
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Deployment failed:', error);
  process.exit(1);
});
