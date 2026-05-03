import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth.js';
import { kycService } from './kyc.service.js';
import { withdrawalService } from './withdrawal.service.js';
import type { WithdrawalSecurityMetadata } from './withdrawal.types.js';
import { DocumentType, WithdrawalStatus } from '../../generated/prisma/client.js';
import { prisma } from '../../config/database.js';
import { withdrawalRateLimiter } from '../../middleware/ipRateLimiter.js';
import { sanitizePaymentInput } from '../../middleware/sanitization.js';


// Helper to safely extract string from query parameter
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}
const router = Router();

// ─── USER ENDPOINTS ───────────────────────────────────────

// Submit KYC documents
router.post('/submit', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const { documentType, frontImageUrl, backImageUrl, selfieUrl } = req.body;

    if (!documentType || !frontImageUrl || !selfieUrl) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const kycDocument = await kycService.submitKYC(
      userId,
      documentType as DocumentType,
      frontImageUrl as string,
      (backImageUrl as string | undefined) || '',
      selfieUrl as string
    );

    res.json({
      message: 'KYC documents submitted successfully',
      document: kycDocument
    }); return;
  } catch (error: any) {
    res.status(400).json({ error: error.message }); return;
  }
});

// Get KYC status
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const status = await kycService.getKYCStatus(userId);
    res.json(status); return;
  } catch (error: any) {
    res.status(400).json({ error: error.message }); return;
  }
});

// SECURITY: Request withdrawal with STRICT rate limiting and input sanitization
router.post('/withdraw', 
  authenticateToken, 
  withdrawalRateLimiter,
  sanitizePaymentInput,
  async (req: AuthRequest, res) => {
  try {
    const userId = req.userId as string;
    const { 
      provider,
      krAmount,
      currency,
      phoneNumber,
      accountNumber,
      bankCode,
      accountName,
      country,
      signature, 
      timestamp, 
      nonce,
      // NEW: Enhanced security parameters
      deviceSecurityScore,
      isRooted,
      isEmulator,
      amountHash,
      requestTimestamp,
      balanceHash
    } = req.body;

    if (!krAmount || !provider || !signature || !timestamp || !nonce) {
      res.status(400).json({ error: 'Missing required fields: krAmount, provider, signature, timestamp, nonce' });
      return;
    }

    // SECURITY: Validate security fields
    if (!amountHash || !requestTimestamp || !balanceHash) {
      res.status(400).json({ error: 'Missing security validation fields' });
      return;
    }

    // Validate provider-specific fields
    if (provider === 'mpesa' && !phoneNumber) {
      res.status(400).json({ error: 'Phone number required for M-Pesa withdrawals' });
      return;
    }

    if ((provider === 'paystack' || provider === 'bank') && (!accountNumber || !bankCode)) {
      res.status(400).json({ error: 'Account number and bank code required for bank withdrawals' });
      return;
    }

    // Build security metadata
    const securityMetadata = {
      hardwareSecurityUsed: false,
      biometricVerified: false,
      multiSigRequired: false,
      rateLimitChecked: true,
      deviceSecurityScore: deviceSecurityScore || 50,
      isRooted: isRooted || false,
      isEmulator: isEmulator || false
    };

    const withdrawal = await withdrawalService.requestWithdrawal(
      userId,
      {
        provider,
        krAmount: Number(krAmount),
        currency: currency || 'KES',
        phoneNumber,
        accountNumber,
        bankCode,
        accountName,
        country,
        deviceSecurityScore,
        isRooted,
        isEmulator,
        amountHash,
        requestTimestamp: Number(requestTimestamp),
        balanceHash
      },
      signature,
      timestamp,
      nonce,
      securityMetadata
    );

    res.json({
      success: true,
      transactionId: withdrawal.id,
      message: 'Withdrawal request submitted successfully',
      processingTime: withdrawal.processingTime
    }); return;
  } catch (error: any) {
    if (error.message.startsWith('KYC_REQUIRED') || error.message.startsWith('KYC_PENDING')) {
      res.status(403).json({ 
        error: error.message,
        requiresKyc: true
      });
      return;
    }
    if (error.message.startsWith('SECURITY_ERROR')) {
      res.status(403).json({ 
        error: error.message,
        code: 'SECURITY_VIOLATION'
      });
      return;
    }
    if (error.message.includes('signature') || error.message.includes('nonce') || error.message.includes('replay')) {
      res.status(400).json({ 
        error: error.message,
        code: 'INVALID_SIGNATURE'
      });
      return;
    }
    res.status(400).json({ error: error.message }); return;
  }
});

// Get user's withdrawal history
router.get('/withdrawal/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const withdrawals = await withdrawalService.getPendingWithdrawals(
      undefined,
      limit,
      offset
    );

    // Filter to only user's withdrawals
    const userWithdrawals = withdrawals.requests.filter((w: any) => w.userId === userId);

    res.json({
      withdrawals: userWithdrawals,
      total: userWithdrawals.length
    }); return;
  } catch (error: any) {
    res.status(400).json({ error: error.message }); return;
  }
});

// ─── ADMIN ENDPOINTS (SUPER_ADMIN & FINANCE_MANAGER) ──────

// Get pending KYC documents
router.get('/admin/kyc/pending', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: req.userId },
      select: { role: true }
    });

    if (!adminProfile || (adminProfile.role !== 'SUPER_ADMIN' && adminProfile.role !== 'FINANCIAL_ADMIN')) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await kycService.getPendingKYC(limit, offset);
    res.json(result); return;
  } catch (error: any) {
    res.status(400).json({ error: error.message }); return;
  }
});

// Verify KYC document
router.post('/admin/kyc/verify/:documentId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: req.userId },
      select: { role: true }
    });

    if (!adminProfile || (adminProfile.role !== 'SUPER_ADMIN' && adminProfile.role !== 'FINANCIAL_ADMIN')) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const documentId = req.params.documentId;
    const adminId = req.userId as string;
    const { approved, verificationNote, rejectionReason, nameMatches, nameMatchScore } = req.body;

    const document = await kycService.verifyKYC(
      documentId as string,
      adminId,
      approved,
      (verificationNote as string | undefined) || '',
      rejectionReason,
      nameMatches,
      nameMatchScore
    );

    res.json({
      message: approved ? 'KYC approved' : 'KYC rejected',
      document
    }); return;
  } catch (error: any) {
    res.status(400).json({ error: error.message }); return;
  }
});

// Get pending withdrawals
router.get('/admin/withdrawal/pending', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: req.userId },
      select: { role: true }
    });

    if (!adminProfile || (adminProfile.role !== 'SUPER_ADMIN' && adminProfile.role !== 'FINANCIAL_ADMIN')) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const status = typeof req.query.status === 'string' ? req.query.status as WithdrawalStatus : undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await withdrawalService.getPendingWithdrawals(status, limit, offset);
    res.json(result); return;
  } catch (error: any) {
    res.status(400).json({ error: error.message }); return;
  }
});

// Review withdrawal
router.post('/admin/withdrawal/review/:requestId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: req.userId },
      select: { role: true }
    });

    if (!adminProfile || (adminProfile.role !== 'SUPER_ADMIN' && adminProfile.role !== 'FINANCIAL_ADMIN')) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const requestId = req.params.requestId;
    const adminId = req.userId as string;
    const { approved, reviewNote, flagReason } = req.body;

    const withdrawal = await withdrawalService.reviewWithdrawal(
      requestId as string,
      adminId,
      approved,
      (reviewNote as string | undefined) || '',
      flagReason
    );

    res.json({
      message: approved ? 'Withdrawal approved' : 'Withdrawal rejected',
      withdrawal
    }); return;
  } catch (error: any) {
    res.status(400).json({ error: error.message }); return;
  }
});

// Get suspicious activities
router.get('/admin/suspicious', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: req.userId },
      select: { role: true }
    });

    if (!adminProfile || (adminProfile.role !== 'SUPER_ADMIN' && adminProfile.role !== 'FINANCIAL_ADMIN')) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const resolved = req.query.resolved === 'true';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await withdrawalService.getSuspiciousActivities(resolved, limit, offset);
    res.json(result); return;
  } catch (error: any) {
    res.status(400).json({ error: error.message }); return;
  }
});

// Resolve suspicious activity
router.post('/admin/suspicious/resolve/:activityId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const adminProfile = await prisma.adminProfile.findUnique({
      where: { userId: req.userId },
      select: { role: true }
    });

    if (!adminProfile || (adminProfile.role !== 'SUPER_ADMIN' && adminProfile.role !== 'FINANCIAL_ADMIN')) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const activityId = req.params.activityId;
    const adminId = req.userId as string;
    const { resolutionNote } = req.body;

    const activity = await withdrawalService.resolveSuspiciousActivity(
      activityId as string,
      adminId,
      (resolutionNote as string | undefined) || ''
    );

    res.json({
      message: 'Suspicious activity resolved',
      activity
    }); return;
  } catch (error: any) {
    res.status(400).json({ error: error.message }); return;
  }
});

export default router;
