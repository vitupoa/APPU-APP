import { Router } from 'express';
import { SocialMediaService } from './social-media.service.js';
import { authMiddleware, adminAuth } from '../../middleware/auth.js';
import { verifyInfluencerOwnership, verifySocialAccountOwnership } from '../../middleware/ownership.js';

const router = Router();
const socialMediaService = new SocialMediaService();

// ─── ADD SOCIAL MEDIA ACCOUNT ──────────────────────────────

router.post('/social-accounts', authMiddleware, verifyInfluencerOwnership, async (req, res) => {
  try {
    const { influencerId, platform, username, accessToken } = req.body;
    
    const account = await socialMediaService.addSocialAccount(
      influencerId,
      platform,
      username,
      accessToken
    );
    
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── GET INFLUENCER'S SOCIAL ACCOUNTS ──────────────────────

router.get('/social-accounts/:influencerId', authMiddleware, async (req, res) => {
  try {
    const influencerId = Array.isArray(req.params.influencerId) ? req.params.influencerId[0] : req.params.influencerId;
    
    const accounts = await socialMediaService.getInfluencerSocialAccounts(influencerId);
    
    res.json(accounts);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── SYNC ACCOUNT METRICS ──────────────────────────────────

router.post('/social-accounts/:accountId/sync', authMiddleware, verifySocialAccountOwnership, async (req, res) => {
  try {
    const accountId = Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;
    
    const account = await socialMediaService.syncAccountMetrics(accountId);
    
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── SET PRIMARY ACCOUNT ───────────────────────────────────

router.patch('/social-accounts/:accountId/primary', authMiddleware, verifySocialAccountOwnership, async (req, res) => {
  try {
    const accountId = Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;
    const { influencerId } = req.body;
    
    const account = await socialMediaService.setPrimaryAccount(accountId, influencerId);
    
    res.json(account);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── DELETE SOCIAL ACCOUNT ─────────────────────────────────

router.delete('/social-accounts/:accountId', authMiddleware, verifySocialAccountOwnership, async (req, res) => {
  try {
    const accountId = Array.isArray(req.params.accountId) ? req.params.accountId[0] : req.params.accountId;
    
    await socialMediaService.deleteSocialAccount(accountId);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ─── SYNC ALL ACCOUNTS (ADMIN/CRON) ───────────────────────

router.post('/social-accounts/sync-all', authMiddleware, adminAuth, async (req, res) => {
  try {
    const results = await socialMediaService.syncAllAccounts();
    
    res.json(results);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
