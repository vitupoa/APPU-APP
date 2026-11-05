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
      const cancelledCount = await EscrowApprovalManager.cancelExpiredApprovals();
      
      if (cancelledCount > 0) {
        } else {
        }
    } catch (error) {
      console.error('[Escrow Approval Cleanup] Error:', error);
    }
  });

  }
