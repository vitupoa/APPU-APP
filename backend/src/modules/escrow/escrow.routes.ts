import { Router, Response } from 'express';
import { authMiddleware, adminAuth, AuthRequest } from '../../middleware/auth.js';
import { EscrowApprovalManager } from '../../services/escrowApproval.service.js';
import { prisma } from '../../config/database.js';
import { z } from 'zod';
import { csrfProtection } from '../../middleware/csrfProtection.js';

const router = Router();

// ─── VALIDATION SCHEMAS ────────────────────────────────────

const createContestPayoutApprovalSchema = z.object({
  contest_id: z.string().uuid(),
  winnerId: z.string().uuid(),
  prizeAmount: z.number().positive()
});

const createWithdrawalApprovalSchema = z.object({
  amount: z.number().positive(),
  withdrawalDetails: z.object({
    provider: z.string(),
    accountDetails: z.any()
  })
});

const submitApprovalSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().optional()
});

// ─── CREATE APPROVAL REQUESTS ──────────────────────────────

/**
 * POST /api/v1/escrow/approvals/contest-payout
 * Create approval request for contest payout
 * Requires: Admin
 */
router.post(
  '/approvals/contest-payout',
  authMiddleware,
  adminAuth,
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createContestPayoutApprovalSchema.parse(req.body);
      
      const approvalId = await EscrowApprovalManager.createContestPayoutApproval(
        data.contest_id,
        data.winnerId,
        data.prizeAmount,
        req.user_id!
      );

      res.status(201).json({
        success: true,
        approvalId,
        message: 'Approval request created. Requires 2 super admin approvals.'
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * POST /api/v1/escrow/approvals/withdrawal
 * Create approval request for withdrawal
 * Requires: Authentication
 */
router.post(
  '/approvals/withdrawal',
  authMiddleware,
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const data = createWithdrawalApprovalSchema.parse(req.body);
      
      const approvalId = await EscrowApprovalManager.createWithdrawalApproval(
        req.user_id!,
        data.amount,
        data.withdrawalDetails
      );

      res.status(201).json({
        success: true,
        approvalId,
        message: data.amount > 10000 
          ? 'Approval request created. Requires 2 super admin approvals.'
          : 'Approval request created. Requires 1 admin approval.'
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// ─── APPROVAL MANAGEMENT ───────────────────────────────────

/**
 * GET /api/v1/escrow/approvals/pending
 * Get pending approval requests for current admin
 * Requires: Super Admin
 */
router.get(
  '/approvals/pending',
  authMiddleware,
  adminAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      // Verify super admin
      const user = await prisma.user.findUnique({
        where: { id: req.user_id },
        include: { adminProfile: true }
      });

      if (user?.admin_profile?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Only super admins can view approval requests' });
        return;
      }

      const pendingApprovals = await EscrowApprovalManager.getPendingApprovals(req.user_id!);

      res.json({
        success: true,
        count: pendingApprovals.length,
        approvals: pendingApprovals
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/escrow/approvals/:approvalId
 * Get approval request details
 * Requires: Super Admin
 */
router.get(
  '/approvals/:approvalId',
  authMiddleware,
  adminAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      const approvalId = req.params.approvalId as string;
      
      const approval = await EscrowApprovalManager.getApprovalRequest(approvalId);

      if (!approval) {
        res.status(404).json({ error: 'Approval request not found' });
        return;
      }

      res.json({
        success: true,
        approval
      });
      return;
    } catch (error: any) {
      res.status(500).json({ error: error.message });
      return;
    }
  }
);

/**
 * POST /api/v1/escrow/approvals/:approvalId/submit
 * Submit approval decision (approve or reject)
 * Requires: Super Admin
 */
router.post(
  '/approvals/:approvalId/submit',
  authMiddleware,
  adminAuth,
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const approvalId = req.params.approvalId as string;
      const data = submitApprovalSchema.parse(req.body);

      // Verify super admin
      const user = await prisma.user.findUnique({
        where: { id: req.user_id },
        include: { adminProfile: true }
      });

      if (user?.admin_profile?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Only super admins can approve payouts' });
        return;
      }

      const result = await EscrowApprovalManager.submitApproval(
        approvalId,
        req.user_id!,
        data.decision,
        data.reason
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * POST /api/v1/escrow/approvals/cleanup-expired
 * Cancel expired approval requests
 * Requires: Super Admin
 */
router.post(
  '/approvals/cleanup-expired',
  authMiddleware,
  adminAuth,
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user_id },
        include: { adminProfile: true }
      });

      if (user?.admin_profile?.role !== 'SUPER_ADMIN') {
        res.status(403).json({ error: 'Only super admins can cleanup approvals' });
        return;
      }

      const cancelledCount = await EscrowApprovalManager.cancelExpiredApprovals();

      res.json({
        success: true,
        message: `Cancelled ${cancelledCount} expired approval requests`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
