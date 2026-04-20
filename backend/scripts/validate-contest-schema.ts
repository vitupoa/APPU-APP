import { z } from 'zod';

// Schema definition matching contests.routes.ts
const createContestSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  mediaType: z.enum(['PHOTO', 'VIDEO', 'PHOTO_AND_VIDEO']),
  category: z.enum(['DANCE', 'CHALLENGE', 'PROMOTION', 'CREATIVE', 'ART', 'MUSIC']),
  prizeKr: z.number().positive('Prize must be positive'),
  requiredActions: z.array(z.object({
    type: z.string(),
    targetUrl: z.string().optional(),
    label: z.string()
  })).min(1),
  maxWinners: z.number().int().min(1).max(3),
  prizeDistribution: z.array(z.object({
    rank: z.number().int().min(1),
    percentage: z.number().min(0).max(100)
  })).min(1),
  judgingCriteria: z.enum(['CREATOR_PICKS', 'COMMUNITY_VOTE', 'MOST_ENGAGEMENT', 'COMBINATION']),
  sponsorName: z.string().max(100).optional(),
  sponsorUrl: z.string().url().optional(),
  deadline: z.string().datetime(),
  coverMediaUrl: z.string().url().optional(),

  // Wizard Gamification Metrics
  entryFeeKr: z.number().positive().optional(),
  publicVoteWeight: z.number().min(0).max(100).optional(),
  allowDailyPrizes: z.boolean().optional(),
  dailyPrizeKr: z.number().positive().optional(),
  targetAges: z.array(z.number()).length(2).optional(),
  targetGeos: z.array(z.string().length(2)).optional(),
  airdropKr: z.number().positive().optional(),
  airdropLimit: z.number().int().positive().optional(),
  judges: z.array(z.string().uuid()).max(20).optional(),

  // Team Participation Fields
  participationType: z.enum(['INDIVIDUAL_ONLY', 'TEAM_ONLY', 'BOTH']),
  teamSize: z.number().int().min(2).max(10).optional(),
  maxTeams: z.number().int().positive().optional(),
});

const baseContestData = {
  title: 'Test Contest',
  description: 'This is a test contest description with enough characters',
  mediaType: 'PHOTO',
  category: 'DANCE',
  prizeKr: 1000,
  requiredActions: [{ type: 'FOLLOW', label: 'Follow us' }],
  maxWinners: 1,
  prizeDistribution: [{ rank: 1, percentage: 100 }],
  judgingCriteria: 'CREATOR_PICKS',
  deadline: new Date().toISOString(),
};

console.log('🧪 Testing Contest Schema Validation - Team Participation Fields\n');

let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }
}

// Test participationType field
console.log('\n📋 Testing participationType field:');

test('should accept INDIVIDUAL_ONLY', () => {
  const data = { ...baseContestData, participationType: 'INDIVIDUAL_ONLY' };
  createContestSchema.parse(data);
});

test('should accept TEAM_ONLY', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY' };
  createContestSchema.parse(data);
});

test('should accept BOTH', () => {
  const data = { ...baseContestData, participationType: 'BOTH' };
  createContestSchema.parse(data);
});

test('should reject invalid participationType', () => {
  const data = { ...baseContestData, participationType: 'INVALID' };
  try {
    createContestSchema.parse(data);
    throw new Error('Should have thrown validation error');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Expected error
    } else {
      throw error;
    }
  }
});

test('should require participationType field', () => {
  const data = { ...baseContestData };
  try {
    createContestSchema.parse(data);
    throw new Error('Should have thrown validation error');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Expected error
    } else {
      throw error;
    }
  }
});

// Test teamSize field
console.log('\n📏 Testing teamSize field:');

test('should accept valid teamSize (5)', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY', teamSize: 5 };
  createContestSchema.parse(data);
});

test('should accept minimum teamSize (2)', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY', teamSize: 2 };
  createContestSchema.parse(data);
});

test('should accept maximum teamSize (10)', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY', teamSize: 10 };
  createContestSchema.parse(data);
});

test('should reject teamSize below minimum (1)', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY', teamSize: 1 };
  try {
    createContestSchema.parse(data);
    throw new Error('Should have thrown validation error');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Expected error
    } else {
      throw error;
    }
  }
});

test('should reject teamSize above maximum (11)', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY', teamSize: 11 };
  try {
    createContestSchema.parse(data);
    throw new Error('Should have thrown validation error');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Expected error
    } else {
      throw error;
    }
  }
});

test('should reject non-integer teamSize', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY', teamSize: 5.5 };
  try {
    createContestSchema.parse(data);
    throw new Error('Should have thrown validation error');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Expected error
    } else {
      throw error;
    }
  }
});

test('should allow teamSize to be optional', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY' };
  createContestSchema.parse(data);
});

// Test maxTeams field
console.log('\n👥 Testing maxTeams field:');

test('should accept positive maxTeams', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY', maxTeams: 50 };
  createContestSchema.parse(data);
});

test('should reject zero maxTeams', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY', maxTeams: 0 };
  try {
    createContestSchema.parse(data);
    throw new Error('Should have thrown validation error');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Expected error
    } else {
      throw error;
    }
  }
});

test('should reject negative maxTeams', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY', maxTeams: -5 };
  try {
    createContestSchema.parse(data);
    throw new Error('Should have thrown validation error');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Expected error
    } else {
      throw error;
    }
  }
});

test('should reject non-integer maxTeams', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY', maxTeams: 10.5 };
  try {
    createContestSchema.parse(data);
    throw new Error('Should have thrown validation error');
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Expected error
    } else {
      throw error;
    }
  }
});

test('should allow maxTeams to be optional', () => {
  const data = { ...baseContestData, participationType: 'TEAM_ONLY' };
  createContestSchema.parse(data);
});

// Test combined fields
console.log('\n🔗 Testing combined team fields:');

test('should accept all team fields together', () => {
  const data = {
    ...baseContestData,
    participationType: 'BOTH',
    teamSize: 5,
    maxTeams: 20,
  };
  createContestSchema.parse(data);
});

test('should work with INDIVIDUAL_ONLY and no team fields', () => {
  const data = { ...baseContestData, participationType: 'INDIVIDUAL_ONLY' };
  createContestSchema.parse(data);
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passedTests}`);
console.log(`   ❌ Failed: ${failedTests}`);
console.log(`   📈 Total: ${passedTests + failedTests}`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! Schema validation is working correctly.\n');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  process.exit(1);
}
