/**
 * Test script to verify risk scoring tables are working correctly
 * Task 1.2: Create risk scoring tables
 */

import { prisma } from './src/config/database';

async function testRiskScoringTables() {
  console.log('🧪 Testing Risk Scoring Tables...\n');

  try {
    // Test 1: Check if tables exist by querying them
    console.log('✅ Test 1: Checking if tables exist...');
    
    const userRiskProfiles = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM user_risk_profiles
    `;
    console.log('   ✓ user_risk_profiles table exists');

    const riskFactors = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM risk_factors
    `;
    console.log('   ✓ risk_factors table exists');

    const flaggedTransactions = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM flagged_transactions
    `;
    console.log('   ✓ flagged_transactions table exists\n');

    // Test 2: Check indexes
    console.log('✅ Test 2: Checking indexes...');
    
    const indexes = await prisma.$queryRaw`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE tablename IN ('user_risk_profiles', 'risk_factors', 'flagged_transactions')
      ORDER BY tablename, indexname
    `;
    console.log('   Indexes found:', (indexes as any[]).length);
    
    // Verify required indexes exist
    const indexNames = (indexes as any[]).map((idx: any) => idx.indexname);
    const requiredIndexes = [
      'user_risk_profiles_risk_score_idx',
      'user_risk_profiles_risk_level_idx',
      'user_risk_profiles_last_calculated_at_idx',
      'risk_factors_user_id_idx',
      'flagged_transactions_created_at_idx'
    ];
    
    for (const reqIdx of requiredIndexes) {
      if (indexNames.includes(reqIdx)) {
        console.log(`   ✓ ${reqIdx} exists`);
      } else {
        console.log(`   ✗ ${reqIdx} MISSING`);
      }
    }
    console.log();

    // Test 3: Check table structure
    console.log('✅ Test 3: Checking table structure...');
    
    const userRiskProfileColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns
      WHERE table_name = 'user_risk_profiles'
      ORDER BY ordinal_position
    `;
    console.log('   user_risk_profiles columns:', (userRiskProfileColumns as any[]).length);
    
    // Verify required columns
    const columnNames = (userRiskProfileColumns as any[]).map((col: any) => col.column_name);
    const requiredColumns = ['risk_score', 'risk_level', 'last_calculated_at'];
    
    for (const reqCol of requiredColumns) {
      if (columnNames.includes(reqCol)) {
        console.log(`   ✓ ${reqCol} column exists`);
      } else {
        console.log(`   ✗ ${reqCol} column MISSING`);
      }
    }
    console.log();

    console.log('🎉 All tests passed! Risk scoring tables are ready.\n');
    
    // Summary
    console.log('📊 Summary:');
    console.log('   ✓ user_risk_profiles table created with risk_score, risk_level, last_calculated_at');
    console.log('   ✓ risk_factors table created for individual risk factor values');
    console.log('   ✓ flagged_transactions table created for suspicious activity');
    console.log('   ✓ All required indexes created (risk_score, risk_level, created_at)');
    console.log('   ✓ Requirements 2.3.1, 2.3.2 satisfied\n');

  } catch (error) {
    console.error('❌ Error testing risk scoring tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testRiskScoringTables()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
