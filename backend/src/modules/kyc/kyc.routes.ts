import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth';
import { kycService } from './kyc.service';
import { withdrawalService } from './withdrawal.service';
import type { WithdrawalSecurityMetadata } from './withdrawal.types';

const router = Router();

// ─── USER ENDPOINTS ───────────────────────────────────────

// Submit KYC documents
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { documentType, frontImageUrl, backImageUrl, selfieUrl } = req.body;

    if (!documentType || !frontImageUrl || !selfieUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const kycDocument = await kycService.submitKYC(
      userId,
      documentType,
      frontImageUrl,
      backImageUrl,
      selfieUrl
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
    const userId = req.user!.userId;
    const status = await kycService.getKYCStatus(userId);
    res.json(status);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Request withdrawal
router.post('/withdrawal/request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
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
      return res.status(400).json({ error: 'Missing required fields. Signature, timestamp, and nonce are required.' });
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
      return res.status(403).json({ 
        error: error.message,
        requiresKyc: true
      });
    }
    if (error.message.startsWith('SECURITY_ERROR')) {
      return res.status(403).json({ 
        error: error.message,
        code: 'SECURITY_VIOLATION'
      });
    }
    if (error.message.includes('signature') || error.message.includes('nonce') || error.message.includes('replay')) {
      return res.status(400).json({ 
        error: error.message,
        code: 'INVALID_SIGNATURE'
      });
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
    const userWithdrawals = withdrawals.requests.filter(w => w.userId === userId);

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
      return res.status(403).json({ error: 'Unauthorized' });
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
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { documentId } = req.params;
    const adminId = req.user!.userId;
    const { approved, verificationNote, rejectionReason, nameMatches, nameMatchScore } = req.body;

    const document = await kycService.verifyKYC(
      documentId,
      adminId,
      approved,
      verificationNote,
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
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const status = req.query.status as any;
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
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { requestId } = req.params;
    const adminId = req.user!.userId;
    const { approved, reviewNote, flagReason } = req.body;

    const withdrawal = await withdrawalService.reviewWithdrawal(
      requestId,
      adminId,
      approved,
      reviewNote,
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
      return res.status(403).json({ error: 'Unauthorized' });
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
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { activityId } = req.params;
    const adminId = req.user!.userId;
    const { resolutionNote } = req.body;

    const activity = await withdrawalService.resolveSuspiciousActivity(
      activityId,
      adminId,
      resolutionNote
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
