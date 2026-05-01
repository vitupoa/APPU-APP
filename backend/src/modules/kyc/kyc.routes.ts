import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { kycService } from './kyc.service';
import { withdrawalService } from './withdrawal.service';
import type { WithdrawalSecurityMetadata } from './withdrawal.types';
import { DocumentType, WithdrawalStatus } from '../../generated/prisma/client.js';


// Helper to safely extract string from query parameter
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}
const router = Router();

// ─── USER ENDPOINTS ───────────────────────────────────────

// Submit KYC documents
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId as string;
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
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get KYC status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId as string;
    const status = await kycService.getKYCStatus(userId);
    res.json(status);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Request withdrawal
router.post('/withdrawal/request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId as string;
    const { 
      amountKr, 
      provider, 
      accountName, 
      accountDetails, 
      currency, 
      signature, 
      timestamp, 
      nonce,
      // NEW: Enhanced security parameters
      hardwareSignature,
      deviceId,
      biometricVerified,
      biometricTimestamp,
      multiSigSignatures,
      multiSigApprovers,
      rateLimitToken,
      deviceSecurityScore,
      isRooted,
      isEmulator
    } = req.body;

    if (!amountKr || !provider || !accountName || !accountDetails || !signature || !timestamp || !nonce) {
      res.status(400).json({ error: 'Missing required fields. Signature, timestamp, and nonce are required.' });
      return;
    }

    // Build security metadata
    const securityMetadata = {
      hardwareSecurityUsed: !!hardwareSignature,
      hardwareSignature,
      deviceId,
      biometricVerified: !!biometricVerified,
      biometricTimestamp,
      multiSigRequired: !!multiSigSignatures,
      multiSigSignatures,
      multiSigApprovers,
      rateLimitChecked: !!rateLimitToken,
      rateLimitToken,
      deviceSecurityScore: deviceSecurityScore || 50,
      isRooted,
      isEmulator
    };

    const withdrawal = await withdrawalService.requestWithdrawal(
      userId,
      Number(amountKr),
      provider,
      accountName,
      accountDetails,
      currency,
      signature,
      timestamp,
      nonce,
      securityMetadata
    );

    res.json({
      message: 'Withdrawal request submitted',
      withdrawal
    });
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
    res.status(400).json({ error: error.message });
  }
});

// Get user's withdrawal history
router.get('/withdrawal/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
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
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── ADMIN ENDPOINTS (SUPER_ADMIN & FINANCE_MANAGER) ──────

// Get pending KYC documents
router.get('/admin/kyc/pending', authenticateToken, async (req, res) => {
  try {
    const adminRole = req.user!.role;
    if (adminRole !== 'SUPER_ADMIN' && adminRole !== 'FINANCIAL_ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await kycService.getPendingKYC(limit, offset);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Verify KYC document
router.post('/admin/kyc/verify/:documentId', authenticateToken, async (req, res) => {
  try {
    const adminRole = req.user!.role;
    if (adminRole !== 'SUPER_ADMIN' && adminRole !== 'FINANCIAL_ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const documentId = req.params.documentId;
    const adminId = req.user!.userId as string;
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
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get pending withdrawals
router.get('/admin/withdrawal/pending', authenticateToken, async (req, res) => {
  try {
    const adminRole = req.user!.role;
    if (adminRole !== 'SUPER_ADMIN' && adminRole !== 'FINANCIAL_ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const status = typeof req.query.status === 'string' ? req.query.status as WithdrawalStatus : undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await withdrawalService.getPendingWithdrawals(status, limit, offset);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Review withdrawal
router.post('/admin/withdrawal/review/:requestId', authenticateToken, async (req, res) => {
  try {
    const adminRole = req.user!.role;
    if (adminRole !== 'SUPER_ADMIN' && adminRole !== 'FINANCIAL_ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const requestId = req.params.requestId;
    const adminId = req.user!.userId as string;
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
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get suspicious activities
router.get('/admin/suspicious', authenticateToken, async (req, res) => {
  try {
    const adminRole = req.user!.role;
    if (adminRole !== 'SUPER_ADMIN' && adminRole !== 'FINANCIAL_ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const resolved = req.query.resolved === 'true';
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await withdrawalService.getSuspiciousActivities(resolved, limit, offset);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Resolve suspicious activity
router.post('/admin/suspicious/resolve/:activityId', authenticateToken, async (req, res) => {
  try {
    const adminRole = req.user!.role;
    if (adminRole !== 'SUPER_ADMIN' && adminRole !== 'FINANCIAL_ADMIN') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const activityId = req.params.activityId;
    const adminId = req.user!.userId as string;
    const { resolutionNote } = req.body;

    const activity = await withdrawalService.resolveSuspiciousActivity(
      activityId as string,
      adminId,
      (resolutionNote as string | undefined) || ''
    );

    res.json({
      message: 'Suspicious activity resolved',
      activity
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
