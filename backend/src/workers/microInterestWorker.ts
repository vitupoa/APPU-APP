import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

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

    // Decay old interests (reduce affinity over time if not engaged)
    await prisma.$executeRaw`
      UPDATE user_micro_interests
      SET affinity = GREATEST(0.1, affinity * 0.95)
      WHERE last_engaged_at < NOW() - INTERVAL '7 days'
    `;

    // Remove very low affinity interests
    const deleted = await prisma.userMicroInterest.deleteMany({
      where: {
        affinity: { lt: 0.1 }
      }
    });

    console.log(`[MicroInterestWorker] Decayed old interests and removed ${deleted.count} low-affinity interests`);

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
          await prisma.userMicroInterest.upsert({
            where: {
              userId_category_subcategory: {
                userId: interaction.user_id,
                category: tag,
                subcategory: null
              }
            },
            create: {
              userId: interaction.user_id,
              category: tag,
              affinity: Math.min(0.1 * weight, 1.0),
              lastEngagedAt: new Date()
            },
            update: {
              affinity: {
                increment: Math.min(0.05 * weight, 0.2)
              },
              lastEngagedAt: new Date()
            }
          });
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
