import cron from 'node-cron';
import { EscrowApprovalManager } from '../services/escrowApproval.service.js';

/**
 * Escrow Approval Cleanup Worker
 * Runs every hour to cancel expired approval requests
 */

export function startEscrowApprovalCleanupWorker() {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[Escrow Approval Cleanup] Starting cleanup...');
      
      const cancelledCount = await EscrowApprovalManager.cancelExpiredApprovals();
      
      if (cancelledCount > 0) {
        console.log(`[Escrow Approval Cleanup] Cancelled ${cancelledCount} expired approval requests`);
      } else {
        console.log('[Escrow Approval Cleanup] No expired approvals found');
      }
    } catch (error) {
      console.error('[Escrow Approval Cleanup] Error:', error);
    }
  });

  console.log('✅ Escrow Approval Cleanup Worker started (runs hourly)');
}
