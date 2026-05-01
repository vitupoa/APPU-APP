import { prisma } from '../config/database.js';

export function startTrendingTopicsWorker() {
  console.log('Starting Trending Topics Worker (runs every 15 minutes)');

  // Run immediately on startup
  analyzeTrendingTopics();

  // Then run every 15 minutes
  setInterval(analyzeTrendingTopics, 15 * 60 * 1000);
}

async function analyzeTrendingTopics() {
  try {
    console.log('[TrendingTopicsWorker] Analyzing trending topics...');

    // Get hashtags with high engagement in last 24 hours
    const trendingHashtags = await prisma.$queryRaw<{ tag: string; engagement_count: number }[]>`
      SELECT h.tag, COUNT(DISTINCT uis.user_id) as engagement_count
      FROM hashtags h
      INNER JOIN content_hashtags ch ON h.id = ch.hashtag_id
      INNER JOIN user_interaction_signals uis ON ch.content_id = uis.content_id AND ch.content_type = uis.content_type
      WHERE uis.created_at > NOW() - INTERVAL '24 hours'
        AND uis.signal_type IN ('VIEW', 'LIKE', 'SHARE', 'COMMENT')
      GROUP BY h.tag
      HAVING COUNT(DISTINCT uis.user_id) > 100
      ORDER BY engagement_count DESC
      LIMIT 50
    `;

    console.log(`[TrendingTopicsWorker] Found ${trendingHashtags.length} trending topics`);

    // Update or create trending topics
    for (const { tag, engagement_count } of trendingHashtags) {
      try {
        // Calculate trending score (engagement count with time decay)
        const trendingScore = engagement_count * 1.0; // Simple score for now

        await prisma.trendingTopic.upsert({
          where: { topic: tag },
          create: {
            topic: tag,
            engagementCount: engagement_count,
            trendingScore,
            isActive: true,
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          },
          update: {
            engagementCount: engagement_count,
            trendingScore,
            isActive: true
          }
        });
      } catch (error) {
        console.error(`[TrendingTopicsWorker] Error updating topic ${tag}:`, error);
      }
    }

    // Expire old trending topics
    const expired = await prisma.trendingTopic.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    console.log(`[TrendingTopicsWorker] Expired ${expired.count} old topics`);

    // Deactivate topics with low recent engagement
    const deactivated = await prisma.$executeRaw`
      UPDATE trending_topics
      SET is_active = false
      WHERE is_active = true
        AND topic NOT IN (
          SELECT DISTINCT h.tag
          FROM hashtags h
          INNER JOIN content_hashtags ch ON h.id = ch.hashtag_id
          INNER JOIN user_interaction_signals uis ON ch.content_id = uis.content_id AND ch.content_type = uis.content_type
          WHERE uis.created_at > NOW() - INTERVAL '48 hours'
          GROUP BY h.tag
          HAVING COUNT(DISTINCT uis.user_id) > 50
        )
    `;

    console.log(`[TrendingTopicsWorker] Deactivated ${deactivated} topics with low engagement`);
    console.log('[TrendingTopicsWorker] Analysis complete');
  } catch (error) {
    console.error('[TrendingTopicsWorker] Error:', error);
  }
}
