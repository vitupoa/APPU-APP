import cron from 'node-cron';
import { ChamaRiskService } from '../modules/chama/chama-risk.service.js';

/**
 * Cron job to check for overdue contributions and flag defaulters.
 * Runs daily at 2 AM.
 */
export function startChamaDefaultWorker() {
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Running Chama Default Check...');
    try {
      const result = await ChamaRiskService.checkDefaults();
      console.log(`[CRON] Chama Default Check completed: ${result.processed} cycles processed, ${result.newDefaulters} new defaulters flagged.`);
    } catch (error: any) {
      console.error('[CRON] Chama Default Check failed:', error.message);
    }
  });

  console.log('[CRON] Chama Default Worker started (runs daily at 2 AM)');
}
