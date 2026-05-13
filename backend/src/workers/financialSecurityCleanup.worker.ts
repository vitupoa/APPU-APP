import cron from 'node-cron';
import { Logger } from '../utils/logger.js';
import { runCleanupJobs } from '../services/financialSecurity.js';

const logger = new Logger('FinancialSecurityCleanup');

export function startFinancialSecurityCleanupWorker() {
  // Run cleanup every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('🧹 Running financial security cleanup...');
    try {
      await runCleanupJobs();
      logger.info('✅ Financial security cleanup completed');
    } catch (error) {
      logger.error('❌ Financial security cleanup failed:', { error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  logger.info('✅ Financial security cleanup worker scheduled (every hour)');
}
