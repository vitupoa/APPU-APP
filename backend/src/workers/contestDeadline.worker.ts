import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('ContestDeadlineWorker');

/**
 * Cron job to automatically transition contests to JUDGING status when deadline passes.
 * Runs every 5 minutes.
 */
export function startContestDeadlineWorker() {
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Running contest deadline check...');

    try {
      const now = new Date();

      // Find all ACTIVE contests where deadline has passed
      const expiredContests = await prisma.contest.findMany({
        where: {
          status: 'ACTIVE',
          deadline: {
            lte: now
          }
        },
        select: {
          id: true,
          title: true,
          deadline: true
        }
      });

      if (expiredContests.length === 0) {
        logger.info('No expired contests found');
        return;
      }

      logger.info(`Found ${expiredContests.length} expired contests, transitioning to JUDGING...`);

      // Transition each contest to JUDGING
      for (const contest of expiredContests) {
        try {
          await prisma.contest.update({
            where: { id: contest.id },
            data: { status: 'JUDGING' }
          });

          logger.info(`Contest "${contest.title}" (${contest.id}) transitioned to JUDGING`);
        } catch (error: any) {
          logger.error(`Failed to transition contest ${contest.id}: ${error.message}`);
        }
      }

      logger.info(`Contest deadline check completed: ${expiredContests.length} contests transitioned to JUDGING`);
    } catch (error: any) {
      logger.error(`Contest deadline check failed: ${error.message}`);
    }
  });

  logger.info('Contest deadline worker started (runs every 5 minutes)');
}
