import { PrismaClient } from './src/generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create adapter and Prisma client
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function runRLSMigration() {
  console.log('🔒 Starting RLS Migration...\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'prisma', 'migrations', 'implement_rls.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`SQL file not found: ${sqlPath}`);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        // Skip comments and empty lines
        if (statement.trim().startsWith('--') || statement.trim() === ';') continue;
        
        const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
        console.log(`[${i + 1}/${statements.length}] ${preview}...`);
        
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        console.log(`✅ Success\n`);
      } catch (error: any) {
        errorCount++;
        const errorMsg = error.message;
        
        // Some errors are expected (e.g., policy already exists)
        if (errorMsg.includes('already exists') || errorMsg.includes('duplicate')) {
          console.log(`⚠️  Already exists (skipping)\n`);
          successCount++; // Count as success since it's already applied
        } else {
          console.error(`❌ Error: ${errorMsg}\n`);
          errors.push(`Statement ${i + 1}: ${errorMsg}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('='.repeat(60) + '\n');
    
    if (errors.length > 0) {
      console.log('⚠️  Errors encountered:');
      errors.forEach(err => console.log(`   - ${err}`));
      console.log('');
    }
    
    // Verify RLS is enabled
    console.log('🔍 Verifying RLS is enabled...\n');
    
    const rlsTables = await prisma.$queryRaw<any[]>`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND rowsecurity = true
      ORDER BY tablename;
    `;
    
    if (rlsTables.length > 0) {
      console.log(`✅ RLS is enabled on ${rlsTables.length} tables:\n`);
      rlsTables.forEach(table => {
        console.log(`   ✓ ${table.tablename}`);
      });
    } else {
      console.log('⚠️  No tables have RLS enabled yet');
    }
    
    console.log('\n✅ RLS Migration Complete!\n');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Please set it in your .env file or environment');
  process.exit(1);
}

runRLSMigration();
