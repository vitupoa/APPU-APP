import cron from 'node-cron';
import { kycService } from '../modules/kyc/kyc.service.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('WithdrawalLimitResetWorker');

export function startWithdrawalLimitResetWorker() {
  // Run every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    try {
      logger.info('Starting daily withdrawal limit reset...');
      
      await kycService.resetDailyLimits();
      
      logger.info('Daily withdrawal limits reset successfully');
    } catch (error) {
      logger.error('Error resetting daily withdrawal limits:', error as any);
    }
  });

  logger.info('Withdrawal limit reset worker started (runs daily at midnight)');
}
