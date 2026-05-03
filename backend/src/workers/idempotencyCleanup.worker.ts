import cron from 'node-cron';
import { cleanupExpiredIdempotencyKeys } from '../middleware/idempotency.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('IdempotencyCleanupWorker');

/**
 * Cleanup Expired Idempotency Keys Worker
 * 
 * Runs every hour to remove expired idempotency keys from the database.
 * This prevents the table from growing indefinitely.
 */
export function startIdempotencyCleanupWorker() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Starting idempotency keys cleanup...');
      
      const deletedCount = await cleanupExpiredIdempotencyKeys();
      
      logger.info(`Idempotency cleanup complete. Deleted ${deletedCount} expired keys.`);
    } catch (error: any) {
      logger.error('Idempotency cleanup failed:', error.message);
    }
  });
  
  logger.info('Idempotency cleanup worker started (runs hourly)');
}
