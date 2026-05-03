import { prisma } from '../config/database.js';
import { contentDistributionService } from '../modules/recommendation/services/contentDistribution.service.js';

export function startContentDistributionWorker() {
  console.log('Starting Content Distribution Worker (runs every 5 minutes)');

  // Run immediately on startup
  evaluateContent();

  // Then run every 5 minutes
  setInterval(evaluateContent, 5 * 60 * 1000);
}

async function evaluateContent() {
  try {
    console.log('[ContentDistributionWorker] Evaluating content performance...');

    // Get all content that needs evaluation (has enough views and hasn't been evaluated recently)
    const contentToEvaluate = await prisma.$queryRaw<{ content_id: string; content_type: string }[]>`
      SELECT cd.content_id, cd.content_type
      FROM content_distribution cd
      WHERE cd.should_amplify = false
        AND cd.distribution_tier::text NOT IN ('VIRAL', 'GLOBAL')
        AND (
          SELECT COUNT(*) 
          FROM user_content_delivery ucd 
          WHERE ucd.content_id = cd.content_id 
            AND ucd.content_type = cd.content_type 
            AND ucd.viewed = true
        ) >= 2000
        AND (
          cd.last_evaluated_at IS NULL 
          OR cd.last_evaluated_at < NOW() - INTERVAL '1 hour'
        )
      LIMIT 100
    `;

    console.log(`[ContentDistributionWorker] Found ${contentToEvaluate.length} content items to evaluate`);

    for (const content of contentToEvaluate) {
      try {
        const result = await contentDistributionService.evaluatePerformance(
          content.content_id,
          content.content_type as 'SHORT' | 'POST'
        );

        if (result.shouldAmplify) {
          console.log(`[ContentDistributionWorker] Amplifying ${content.content_type} ${content.content_id} to ${result.nextTier}`);
        }
      } catch (error) {
        console.error(`[ContentDistributionWorker] Error evaluating ${content.content_type} ${content.content_id}:`, error);
      }
    }

    console.log('[ContentDistributionWorker] Evaluation complete');
  } catch (error) {
    console.error('[ContentDistributionWorker] Error:', error);
  }
}
