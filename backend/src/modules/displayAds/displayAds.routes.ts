import { Router } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { DisplayAdCampaignService } from './displayAds.service.js';

const router = Router();
const displayAdService = new DisplayAdCampaignService();

router.post('/campaigns', authenticate, async (req: AuthRequest, res) => {
  try {
    const brandId = req.userId!;
    const campaign = await displayAdService.createCampaign(brandId, req.body);
    res.status(201).json(campaign); return;
  } catch (error: any) {
    res.status(400).json({ error: error.message }); return;
  }
});

router.get('/campaigns', authenticate, async (req: AuthRequest, res) => {
  try {
    const brandId = req.userId!;
    const campaigns = await displayAdService.getBrandCampaigns(brandId);
    res.json(campaigns); return;
  } catch (error: any) {
    res.status(500).json({ error: error.message }); return;
  }
});

router.get('/campaigns/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const campaign = await displayAdService.getCampaignById(req.params.id as string);
    res.json(campaign);
    return;
  } catch (error: any) {
    res.status(404).json({ error: error.message });
    return;
  }
});

router.patch('/campaigns/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const campaign = await displayAdService.updateCampaign(req.params.id as string, req.body);
    res.json(campaign);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
    return;
  }
});

router.patch('/campaigns/:id/toggle', authenticate, async (req: AuthRequest, res) => {
  try {
    const campaign = await displayAdService.toggleCampaign(req.params.id as string);
    res.json(campaign);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
    return;
  }
});

router.get('/campaigns/:id/analytics', authenticate, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await displayAdService.getCampaignAnalytics(
      req.params.id as string,
      startDate as string,
      endDate as string
    );
    res.json(analytics);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
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
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
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
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
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
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

router.get('/admin/campaigns/pending', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' }); return;
    }
    const campaigns = await displayAdService.getPendingCampaigns();
    res.json(campaigns);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

router.patch('/admin/campaigns/:id/approve', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' }); return;
    }
    const campaign = await displayAdService.approveCampaign(
      req.params.id as string,
      req.userId!
    );
    res.json(campaign);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
    return;
  }
});

router.patch('/admin/campaigns/:id/reject', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' }); return;
    }
    const { reason } = req.body;
    const campaign = await displayAdService.rejectCampaign(
      req.params.id as string,
      req.userId!,
      reason
    );
    res.json(campaign);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
    return;
  }
});

router.get('/admin/settings', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' }); return;
    }
    const { scope, scopeValue } = req.query;
    const settings = await displayAdService.getPlatformSettings(
      scope as string,
      scopeValue as string
    );
    res.json(settings);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

router.post('/admin/settings', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' }); return;
    }
    const settings = await displayAdService.updatePlatformSettings(
      req.body,
      req.userId!
    );
    res.json(settings);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
    return;
  }
});

export default router;
