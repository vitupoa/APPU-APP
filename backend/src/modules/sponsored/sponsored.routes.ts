import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { SponsoredContentService } from './sponsored.service.js';

const router = Router();

// POST /api/v1/sponsored/campaigns — Create sponsored campaign
router.post('/campaigns', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await SponsoredContentService.createCampaign(req.userId!, req.body);
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/sponsored/feed — Get sponsored content for user's feed
router.get('/feed', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { contentType = 'short' } = req.query;
    const sponsored = await SponsoredContentService.getSponsoredContentForUser(
      req.userId!,
      contentType as string
    );
    res.json(sponsored);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/sponsored/impression — Record impression
router.post('/impression', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId } = req.body;
    await SponsoredContentService.recordImpression(campaignId, req.userId!);
    res.json({ recorded: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/sponsored/view — Record view (3+ seconds)
router.post('/view', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId, watchTimeSeconds } = req.body;
    await SponsoredContentService.recordView(campaignId, req.userId!, watchTimeSeconds);
    res.json({ recorded: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/sponsored/engagement — Record engagement
router.post('/engagement', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { campaignId, type } = req.body;
    await SponsoredContentService.recordEngagement(campaignId, req.userId!, type);
    res.json({ recorded: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/sponsored/campaigns/:id/analytics — Get campaign analytics
router.get('/campaigns/:id/analytics', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await SponsoredContentService.getCampaignAnalytics(req.params.id);
    res.json(analytics);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// PATCH /api/v1/sponsored/campaigns/:id/toggle — Pause/Resume campaign
router.patch('/campaigns/:id/toggle', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await SponsoredContentService.toggleCampaign(req.params.id, req.userId!);
    res.json(campaign);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// GET /api/v1/sponsored/campaigns/my — Get my campaigns
router.get('/campaigns/my', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await SponsoredContentService.getMyCampaigns(req.userId!);
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/sponsored/campaigns/pending — Get pending campaigns (admin)
router.get('/campaigns/pending', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaigns = await SponsoredContentService.getPendingCampaigns();
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/v1/sponsored/campaigns/:id/approve — Approve campaign (admin)
router.patch('/campaigns/:id/approve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await SponsoredContentService.approveCampaign(req.params.id);
    res.json(campaign);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// PATCH /api/v1/sponsored/campaigns/:id/reject — Reject campaign (admin)
router.patch('/campaigns/:id/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await SponsoredContentService.rejectCampaign(req.params.id);
    res.json(campaign);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

export default router;
