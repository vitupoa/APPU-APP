import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { DisplayAdCampaignService } from './displayAds.service.js';

const router = Router();
const displayAdService = new DisplayAdCampaignService();

router.post('/campaigns', authenticate, async (req: AuthRequest, res) => {
  try {
    const brandId = req.userId!;
    const campaign = await displayAdService.createCampaign(brandId, req.body);
    res.status(201).json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/campaigns', authenticate, async (req: AuthRequest, res) => {
  try {
    const brandId = req.userId!;
    const campaigns = await displayAdService.getBrandCampaigns(brandId);
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/campaigns/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const campaign = await displayAdService.getCampaignById(req.params.id as string);
    res.json(campaign);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

router.patch('/campaigns/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const campaign = await displayAdService.updateCampaign(req.params.id as string, req.body);
    res.json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/campaigns/:id/toggle', authenticate, async (req: AuthRequest, res) => {
  try {
    const campaign = await displayAdService.toggleCampaign(req.params.id as string);
    res.json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/campaigns/:id/analytics', authenticate, async (req: AuthRequest, res) => {
  try {
    const { start_date, end_date } = req.query;
    const analytics = await displayAdService.getCampaignAnalytics(
      req.params.id as string,
      start_date as string,
      end_date as string
    );
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/locations/search', authenticate, async (req: AuthRequest, res) => {
  try {
    const { query, scope } = req.query;
    const locations = await displayAdService.searchLocations(
      query as string,
      scope as string
    );
    res.json(locations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/cpm-ranges', authenticate, async (req: AuthRequest, res) => {
  try {
    const { locations, placements } = req.query;
    const ranges = await displayAdService.getCpmRanges(
      JSON.parse(locations as string),
      JSON.parse(placements as string)
    );
    res.json(ranges);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/min-budget', authenticate, async (req: AuthRequest, res) => {
  try {
    const { locations, budgetType } = req.query;
    const minBudget = await displayAdService.getMinimumBudget(
      JSON.parse(locations as string),
      budgetType as string
    );
    res.json(minBudget);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/admin/campaigns/pending', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    const campaigns = await displayAdService.getPendingCampaigns();
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/admin/campaigns/:id/approve', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    const campaign = await displayAdService.approveCampaign(
      req.params.id as string,
      req.userId!
    );
    res.json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/admin/campaigns/:id/reject', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    const { reason } = req.body;
    const campaign = await displayAdService.rejectCampaign(
      req.params.id as string,
      req.userId!,
      reason
    );
    res.json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/admin/settings', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    const { scope, scopeValue } = req.query;
    const settings = await displayAdService.getPlatformSettings(
      scope as string,
      scopeValue as string
    );
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/admin/settings', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    const settings = await displayAdService.updatePlatformSettings(
      req.body,
      req.userId!
    );
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
