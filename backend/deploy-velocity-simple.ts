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

async function main() {
  console.log('🚀 Deploying Velocity Tracking Table');
  console.log('=' .repeat(60));
  
  try {
    // Create the table directly
    console.log('\n📊 Creating transaction_velocity table...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "transaction_velocity" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "user_id" TEXT NOT NULL,
        "time_window" TEXT NOT NULL,
        "window_start" TIMESTAMP(3) NOT NULL,
        "window_end" TIMESTAMP(3) NOT NULL,
        "transaction_count" INTEGER NOT NULL DEFAULT 0,
        "total_amount_kr" DECIMAL(18, 4) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Table created');
    
    // Create indexes
    console.log('\n📊 Creating indexes...');
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "transaction_velocity_user_id_time_window_idx" 
      ON "transaction_velocity"("user_id", "time_window")
    `;
    console.log('✅ Index 1/3 created');
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "transaction_velocity_window_end_idx" 
      ON "transaction_velocity"("window_end")
    `;
    console.log('✅ Index 2/3 created');
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "transaction_velocity_user_id_idx" 
      ON "transaction_velocity"("user_id")
    `;
    console.log('✅ Index 3/3 created');
    
    // Verify
    console.log('\n🔍 Verifying...');
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'transaction_velocity'
    `;
    console.log('✅ Verification:', result);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DEPLOYMENT SUCCESSFUL');
    console.log('='.repeat(60));
    console.log('Table: transaction_velocity');
    console.log('Indexes: 3');
    console.log('Status: ✅ READY');
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
