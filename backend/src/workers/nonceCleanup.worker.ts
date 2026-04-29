import cron from 'node-cron';
import { nonceService } from '../services/nonce.service.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('NonceCleanupWorker');

export function startNonceCleanupWorker() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('Starting nonce cleanup...');
      
      const deletedCount = await nonceService.cleanupExpiredNonces();
      
      logger.info(`Nonce cleanup complete. Deleted ${deletedCount} expired nonces`);
    } catch (error) {
      logger.error('Error cleaning up nonces:', error);
    }
  });

  logger.info('Nonce cleanup worker started (runs hourly)');
}
