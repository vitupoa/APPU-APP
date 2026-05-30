import { prisma } from '../src/config/database.js';
import { riskScoringService } from '../src/services/compliance/riskScoring.service.js';

async function calculateInitialRiskScores() {
  console.log('Starting initial risk score calculation for all users...');

  const users = await prisma.user.findMany({
    select: { id: true, username: true }
  });

  console.log(`Found ${users.length} users to process`);

  let processed = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const riskData = await riskScoringService.calculateUserRiskScore(user.id);
      console.log(`✓ ${user.username}: ${riskData.riskLevel} (${riskData.riskScore})`);
      processed++;
    } catch (error: any) {
      console.error(`✗ ${user.username}: ${error.message}`);
      errors++;
    }

    // Rate limit to avoid overwhelming the database
    if (processed % 100 === 0) {
      console.log(`Progress: ${processed}/${users.length} users processed`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log('\n=== Risk Score Calculation Complete ===');
  console.log(`Total users: ${users.length}`);
  console.log(`Successfully processed: ${processed}`);
  console.log(`Errors: ${errors}`);

  await prisma.$disconnect();
}

calculateInitialRiskScores().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
