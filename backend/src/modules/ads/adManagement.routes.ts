import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { AdManagementService } from './adManagement.service.js';
import { getQueryString, getQueryNumber, getQueryDate } from '../../utils/queryParams.js';

const router = Router();

// Middleware to check if user is admin
const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { prisma } = await import('../../config/database.js');
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { is_admin: true }
    });

    if (!user?.is_admin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== AD CONFIG ROUTES ====================

// GET /api/v1/admin/ads/config - Get current ad configuration
router.get('/config', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const config = await AdManagementService.getAdConfig();
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/v1/admin/ads/config/platform-cut - Update platform cut percentage
router.put('/config/platform-cut', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { percentage } = req.body;
    const config = await AdManagementService.updatePlatformCut(percentage, req.userId!);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/v1/admin/ads/config/native-pricing - Update native ad pricing
router.put('/config/native-pricing', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { minCpm, maxCpm } = req.body;
    const config = await AdManagementService.updateNativeAdPricing(minCpm, maxCpm, req.userId!);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/v1/admin/ads/config/banner-pricing - Update banner ad pricing
router.put('/config/banner-pricing', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { minCpm, maxCpm } = req.body;
    const config = await AdManagementService.updateBannerAdPricing(minCpm, maxCpm, req.userId!);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/v1/admin/ads/config/story-pricing - Update story ad pricing
router.put('/config/story-pricing', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { minCpm, maxCpm } = req.body;
    const config = await AdManagementService.updateStoryAdPricing(minCpm, maxCpm, req.userId!);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/v1/admin/ads/config/native-frequency - Update native ad frequency
router.put('/config/native-frequency', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { frequency } = req.body;
    const config = await AdManagementService.updateNativeAdFrequency(frequency, req.userId!);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/v1/admin/ads/config/banner-frequency - Update banner ad frequency
router.put('/config/banner-frequency', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { frequency } = req.body;
    const config = await AdManagementService.updateBannerAdFrequency(frequency, req.userId!);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/v1/admin/ads/config/story-frequency - Update story ad frequency
router.put('/config/story-frequency', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { frequency } = req.body;
    const config = await AdManagementService.updateStoryAdFrequency(frequency, req.userId!);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/v1/admin/ads/config/toggle-ads - Toggle ads on/off globally
router.put('/config/toggle-ads', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { enabled } = req.body;
    const config = await AdManagementService.toggleAds(enabled, req.userId!);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/v1/admin/ads/config/toggle-max-load - Toggle max ad load
router.put('/config/toggle-max-load', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { enabled } = req.body;
    const config = await AdManagementService.toggleMaxAdLoad(enabled, req.userId!);
    res.json(config);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== CAMPAIGN ROUTES ====================

// GET /api/v1/admin/ads/campaigns - Get all campaigns with filters
router.get('/campaigns', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, brand_id, adType, page, limit } = req.query;
    const result = await AdManagementService.getCampaigns({
      status: getQueryString(status),
      brandId: getQueryString(brand_id),
      adType: getQueryString(adType),
      page: getQueryNumber(page),
      limit: getQueryNumber(limit)
    });
    res.json(result);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/admin/ads/campaigns/:id - Get campaign by ID
router.get('/campaigns/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campaign = await AdManagementService.getCampaignById(req.params.id as string);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/admin/ads/campaigns/:id/approve - Approve campaign
router.post('/campaigns/:id/approve', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campaign = await AdManagementService.approveCampaign(req.params.id as string, req.userId!);
    res.json(campaign);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/admin/ads/campaigns/:id/reject - Reject campaign
router.post('/campaigns/:id/reject', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason) {
      res.status(400).json({ error: 'Rejection reason is required' });
      return;
    }
    const campaign = await AdManagementService.rejectCampaign(req.params.id as string, reason, req.userId!);
    res.json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/admin/ads/campaigns/:id/pause - Pause campaign
router.post('/campaigns/:id/pause', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const campaign = await AdManagementService.pauseCampaign(req.params.id as string, req.userId!);
    res.json(campaign);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/v1/admin/ads/campaigns/:id - Delete campaign
router.delete('/campaigns/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await AdManagementService.deleteCampaign(req.params.id as string);
    res.json({ success: true });
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== SPONSORED POST ROUTES ====================

// GET /api/v1/admin/ads/sponsored-posts - Get all sponsored posts with filters
router.get('/sponsored-posts', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, brand_id, creator_id, page, limit } = req.query;
    const result = await AdManagementService.getSponsoredPosts({
      status: getQueryString(status),
      brandId: getQueryString(brand_id),
      creatorId: getQueryString(creator_id),
      page: getQueryNumber(page),
      limit: getQueryNumber(limit)
    });
    res.json(result);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/admin/ads/sponsored-posts/:id - Get sponsored post by ID
router.get('/sponsored-posts/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await AdManagementService.getSponsoredPostById(req.params.id as string);
    if (!post) {
      res.status(404).json({ error: 'Sponsored post not found' });
      return;
    }
    res.json(post);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/admin/ads/sponsored-posts/:id/verify - Verify sponsored post
router.post('/sponsored-posts/:id/verify', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await AdManagementService.verifySponsoredPost(req.params.id as string, req.userId!);
    res.json(post);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/admin/ads/sponsored-posts/:id/release-payment - Release payment to creator
router.post('/sponsored-posts/:id/release-payment', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await AdManagementService.releasePayment(req.params.id as string, req.userId!);
    res.json(post);
    return;
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== ANALYTICS ROUTES ====================

// GET /api/v1/admin/ads/analytics - Get analytics for date range
router.get('/analytics', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query;
    
    const start = getQueryDate(start_date);
    const end = getQueryDate(end_date);
    
    if (!start || !end) {
      res.status(400).json({ error: 'startDate and endDate are required' });
      return;
    }

    const result = await AdManagementService.getAnalytics(start, end);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/admin/ads/stats - Get platform-wide stats
router.get('/stats', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await AdManagementService.getPlatformStats();
    res.json(stats);
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
