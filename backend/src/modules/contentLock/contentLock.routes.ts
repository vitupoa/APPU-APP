import { Router, Response, NextFunction } from 'express';
import { ContentLockService } from './contentLock.service.js';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { setRLSContext } from '../../middleware/rls.js';
import { unlockRateLimiter, conversionRateLimiter, accessCheckRateLimiter, failedUnlockRateLimiter } from '../../middleware/rateLimiting.js';
import { FraudDetectionService } from '../../services/fraudDetection.service.js';
import { AuditLogService } from '../../services/auditLog.service.js';
import { prisma } from '../../config/database.js';

const router = Router();

router.use(authMiddleware);
router.use((req: AuthRequest, res: Response, next: NextFunction) => setRLSContext(req as any, res, next));

router.post('/unlock', unlockRateLimiter, failedUnlockRateLimiter, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.userId!;
  const { contentId, contentType } = req.body;
  try {
    if (!contentId || !contentType) { res.status(400).json({ error: 'contentId and contentType are required' }); return; }
    if (!['SHORT', 'POST', 'LIVE'].includes(contentType)) { res.status(400).json({ error: 'Invalid contentType' }); return; }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { currency: true } });
    const amountKr = 0; // fraud check uses 0 as placeholder before actual unlock

    const fraudCheck = await FraudDetectionService.comprehensiveFraudCheck(userId, 'unlock', { contentId, contentType, amountKr });
    if (fraudCheck.shouldBlock) {
      await AuditLogService.logFraudDetection(req, { userId, operationType: 'unlock', riskScore: fraudCheck.riskScore, reasons: fraudCheck.reasons, blocked: true });
      res.status(403).json({ error: 'Operation blocked', message: 'Suspicious activity detected.', reasons: fraudCheck.reasons });
      return;
    }

    const result = await ContentLockService.unlockContent(userId, contentId, contentType, user?.currency || 'USD');
    await AuditLogService.logUnlock(req, { userId, contentId, contentType, amountKr: result.unlockAmountKr, success: true, fraudCheckResult: fraudCheck });
    res.json(result);
  } catch (error: any) {
    await AuditLogService.logUnlock(req, { userId, contentId, contentType, amountKr: 0, success: false, error: error.message });
    next(error);
  }
});

router.get('/price', conversionRateLimiter, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { unlockAmountKr, currency } = req.query;
    if (!unlockAmountKr) { res.status(400).json({ error: 'unlockAmountKr is required' }); return; }
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { currency: true } });
    const userCurrency = (currency as string) || user?.currency || 'USD';
    const price = await ContentLockService.getUnlockPrice(Number(unlockAmountKr), userCurrency);
    res.json(price);
  } catch (error) { next(error); }
});

router.post('/convert-fiat', conversionRateLimiter, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fiatAmount, currency } = req.body;
    if (!fiatAmount) { res.status(400).json({ error: 'fiatAmount is required' }); return; }
    const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { currency: true } });
    const creatorCurrency = currency || user?.currency || 'USD';
    const krAmount = await ContentLockService.convertFiatToKr(Number(fiatAmount), creatorCurrency);
    res.json({ krAmount, fiatAmount: Number(fiatAmount), currency: creatorCurrency });
  } catch (error) { next(error); }
});

router.get('/check-access', accessCheckRateLimiter, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const { contentId, contentType } = req.query as { contentId: string; contentType: string };
    if (!contentId || !contentType) { res.status(400).json({ error: 'contentId and contentType are required' }); return; }

    type ContentRow = { user_id?: string; host_id?: string; is_locked?: boolean; required_tier?: string; unlock_amount_kr?: string | null };
    let rows: ContentRow[] = [];

    if (contentType === 'SHORT') {
      rows = await prisma.$queryRaw<ContentRow[]>`SELECT user_id, is_locked, required_tier, unlock_amount_kr FROM shorts WHERE id = ${contentId} LIMIT 1`;
    } else if (contentType === 'POST') {
      rows = await prisma.$queryRaw<ContentRow[]>`SELECT user_id, is_locked, required_tier, unlock_amount_kr FROM posts WHERE id = ${contentId} LIMIT 1`;
    } else if (contentType === 'LIVE') {
      rows = await prisma.$queryRaw<ContentRow[]>`SELECT host_id, unlock_amount_kr FROM live_streams WHERE id = ${contentId} LIMIT 1`;
    } else {
      res.status(400).json({ error: 'Invalid contentType' }); return;
    }

    if (!rows[0]) { res.status(404).json({ error: 'Content not found' }); return; }

    const row = rows[0];
    const creatorId = (row.user_id || row.host_id)!;
    const isLocked = contentType === 'LIVE' ? !!row.unlock_amount_kr : !!row.is_locked;
    const requiredTier = row.required_tier;
    const unlockAmountKr = row.unlock_amount_kr ? Number(row.unlock_amount_kr) : undefined;

    const access = await ContentLockService.checkAccess(userId, contentId, contentType as any, creatorId, isLocked, requiredTier, unlockAmountKr);
    await AuditLogService.logAccessCheck(req, { userId, contentId, contentType, hasAccess: access.hasAccess, accessReason: (access as any).reason });
    res.json(access);
  } catch (error) { next(error); }
});

export default router;
