import { prisma } from './src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runRLSMigration() {
  console.log('🔒 Starting RLS Migration...\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'prisma', 'migrations', 'implement_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        // Skip comments
        if (statement.trim().startsWith('--')) continue;
        
        console.log(`[${i + 1}/${statements.length}] Executing...`);
        
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        console.log(`✅ Success\n`);
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Error: ${error.message}`);
        console.error(`Statement: ${statement.substring(0, 100)}...\n`);
        
        // Continue with other statements even if one fails
        // (some might fail if already applied)
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('='.repeat(60) + '\n');
    
    // Verify RLS is enabled
    console.log('🔍 Verifying RLS is enabled...\n');
    
    const rlsTables = await prisma.$queryRaw<any[]>`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND rowsecurity = true
      ORDER BY tablename;
    `;
    
    console.log(`✅ RLS is enabled on ${rlsTables.length} tables:\n`);
    rlsTables.forEach(table => {
      console.log(`   - ${table.tablename}`);
    });
    
    console.log('\n✅ RLS Migration Complete!\n');
    
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRLSMigration();
