import { prisma } from '../config/database.js';

export function startMicroInterestWorker() {
  console.log('Starting Micro Interest Worker (runs every hour)');

  // Run immediately on startup
  updateMicroInterests();

  // Then run every hour
  setInterval(updateMicroInterests, 60 * 60 * 1000);
}

async function updateMicroInterests() {
  try {
    console.log('[MicroInterestWorker] Updating user micro-interests...');

    // Decay old interests (reduce weight over time if not engaged)
    await prisma.$executeRaw`
      UPDATE user_micro_interests
      SET weight = GREATEST(0.1, weight * 0.95)
      WHERE last_updated < NOW() - INTERVAL '7 days'
    `;

    // Remove very low weight interests
    const deleted = await prisma.user_micro_interests.deleteMany({
      where: {
        weight: { lt: 0.1 }
      }
    });

    console.log(`[MicroInterestWorker] Decayed old interests and removed ${deleted.count} low-weight interests`);

    // Update interests based on recent interactions
    const recentInteractions = await prisma.$queryRaw<{ user_id: string; content_id: string; content_type: string; signal_type: string }[]>`
      SELECT user_id, content_id, content_type, signal_type
      FROM user_interaction_signals
      WHERE created_at > NOW() - INTERVAL '1 hour'
        AND signal_type IN ('VIEW', 'LIKE', 'SHARE', 'COMMENT', 'REWATCH')
      ORDER BY created_at DESC
      LIMIT 1000
    `;

    console.log(`[MicroInterestWorker] Processing ${recentInteractions.length} recent interactions`);

    for (const interaction of recentInteractions) {
      try {
        // Get content hashtags
        const hashtags = await prisma.$queryRaw<{ tag: string }[]>`
          SELECT h.tag 
          FROM hashtags h
          INNER JOIN content_hashtags ch ON h.id = ch.hashtag_id
          WHERE ch.content_id = ${interaction.content_id} 
            AND ch.content_type = ${interaction.content_type}
        `;

        const weight = getSignalWeight(interaction.signal_type);

        for (const { tag } of hashtags) {
          // Check if exists first
          const existing = await prisma.user_micro_interests.findFirst({
            where: {
              user_id: interaction.user_id,
              interest: tag
            }
          });

          if (existing) {
            await prisma.user_micro_interests.update({
              where: { id: existing.id },
              data: {
                weight: {
                  increment: Math.min(0.05 * weight, 0.2)
                },
                last_updated: new Date()
              }
            });
          } else {
            await prisma.user_micro_interests.create({
              data: {
                user_id: interaction.user_id,
                interest: tag,
                weight: Math.min(0.1 * weight, 1.0),
                last_updated: new Date()
              }
            });
          }
        }
      } catch (error) {
        console.error(`[MicroInterestWorker] Error processing interaction:`, error);
      }
    }

    console.log('[MicroInterestWorker] Update complete');
  } catch (error) {
    console.error('[MicroInterestWorker] Error:', error);
  }
}

function getSignalWeight(signalType: string): number {
  const weights: Record<string, number> = {
    VIEW: 1.0,
    LIKE: 1.5,
    SHARE: 2.0,
    COMMENT: 1.8,
    REWATCH: 1.7
  };
  return weights[signalType] || 1.0;
}
