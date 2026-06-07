import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { BrandMarketplaceService } from './brand-marketplace.service.js';
import { SalesFunnelService } from './sales-funnel.service.js';
import socialMediaRoutes from './social-media.routes.js';
import { z } from 'zod';
import { parseQueryString } from '../../utils/queryParams.js';


// Helper to safely extract string from query parameter
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}
const router = Router();

// Mount social media routes
router.use('/', socialMediaRoutes);

// ═══════════════════════════════════════════════════════════
// INFLUENCER MARKETPLACE - DISCOVERY
// ═══════════════════════════════════════════════════════════

// GET /api/v1/marketplace/influencers - Search influencers (Brand view)
router.get('/influencers', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tier = req.query.tier ? (parseQueryString(req.query.tier) || '').split(',') : undefined;
    const categories = req.query.categories ? (parseQueryString(req.query.categories) || '').split(',') : undefined;
    const minFollowers = req.query.minFollowers ? parseInt(parseQueryString(req.query.minFollowers) || '') : undefined;
    const minEngagementRate = req.query.minEngagementRate ? parseFloat(parseQueryString(req.query.minEngagementRate) || '') : undefined;
    const minRating = req.query.minRating ? parseFloat(parseQueryString(req.query.minRating) || '') : undefined;
    const minAdmirers = req.query.minAdmirers ? parseInt(parseQueryString(req.query.minAdmirers) || '') : undefined;
    const minSubscribers = req.query.minSubscribers ? parseInt(parseQueryString(req.query.minSubscribers) || '') : undefined;
    const sortBy = (req.query.sortBy as any) || 'engagement';
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await BrandMarketplaceService.searchInfluencers({
      tier,
      categories,
      minFollowers,
      minEngagementRate,
      minRating,
      minAdmirers,
      minSubscribers,
      sortBy,
      cursor,
      limit
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/marketplace/influencers/:id - Get influencer profile
router.get('/influencers/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await BrandMarketplaceService.getInfluencerProfile(String(req.params.id));
    res.json(profile);
  } catch (error: any) {
    res.status(404).json({ error: 'Influencer not found' });
  }
});

// ═══════════════════════════════════════════════════════════
// BRAND CAMPAIGNS - MANAGEMENT
// ═══════════════════════════════════════════════════════════

const createCampaignSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20),
  type: z.enum(['SPONSORED_POST', 'PRODUCT_REVIEW', 'BRAND_AMBASSADOR', 'CONTEST_PROMOTION', 'AFFILIATE', 'EVENT_COVERAGE', 'CONTENT_CREATION']),
  targetTiers: z.array(z.enum(['NANO', 'MICRO', 'MID', 'MACRO', 'MEGA'])).min(1),
  targetCategories: z.array(z.string()),
  minFollowers: z.number().int().positive().optional(),
  minEngagementRate: z.number().min(0).max(100).optional(),
  targetGeos: z.array(z.string().length(2)).optional(),
  budgetKr: z.number().positive(),
  compensationPerInfluencer: z.number().positive(),
  maxInfluencers: z.number().int().min(1).max(100),
  requiredPosts: z.number().int().min(0).optional(),
  requiredVideos: z.number().int().min(0).optional(),
  requiredStories: z.number().int().min(0).optional(),
  contentGuidelines: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  contest_id: z.string().uuid().optional(),
  applicationDeadline: z.string().datetime().optional(),
  campaignStartDate: z.string().datetime(),
  campaignEndDate: z.string().datetime()
});

// POST /api/v1/marketplace/campaigns - Create campaign (Brand)
router.post('/campaigns', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createCampaignSchema.parse(req.body);
    
    const campaign = await BrandMarketplaceService.createCampaign({
      brand_id: req.user_id!,
      title: data.title,
      description: data.description,
      type: data.type,
      target_tiers: data.targetTiers,
      target_categories: data.targetCategories,
      min_followers: data.minFollowers,
      min_engagement_rate: data.minEngagementRate,
      target_geos: data.targetGeos,
      budget_kr: data.budgetKr,
      compensation_per_influencer: data.compensationPerInfluencer,
      max_influencers: data.maxInfluencers,
      required_posts: data.requiredPosts,
      required_videos: data.requiredVideos,
      required_stories: data.requiredStories,
      content_guidelines: data.contentGuidelines,
      hashtags: data.hashtags,
      mentions: data.mentions,
      contest_id: data.contest_id,
      application_deadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
      campaign_start_date: new Date(data.campaignStartDate),
      campaign_end_date: new Date(data.campaignEndDate)
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// POST /api/v1/marketplace/campaigns/:id/publish - Publish campaign
router.post('/campaigns/:id/publish', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await BrandMarketplaceService.publishCampaign(String(req.params.id), req.user_id!);
    res.json(campaign);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/marketplace/campaigns - Browse campaigns (Influencer view)
router.get('/campaigns', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type ? (parseQueryString(req.query.type) || '').split(',') : undefined;
    const categories = req.query.categories ? (parseQueryString(req.query.categories) || '').split(',') : undefined;
    const minCompensation = req.query.minCompensation ? parseFloat(parseQueryString(req.query.minCompensation) || '') : undefined;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await BrandMarketplaceService.browseCampaigns({
      influencerId: req.query.influencerId as string | undefined,
      type,
      categories,
      minCompensation,
      cursor,
      limit
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/marketplace/campaigns/:id/apply - Apply to campaign (Influencer)
router.post('/campaigns/:id/apply', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      influencerId: z.string().uuid(),
      pitch: z.string().min(50).max(1000),
      proposedRate: z.number().positive().optional(),
      availability: z.string().optional()
    });

    const data = schema.parse(req.body);
    
    const application = await BrandMarketplaceService.applyToCampaign({
      campaign_id: String(req.params.id),
      influencer_id: data.influencerId,
      pitch: data.pitch,
      proposed_rate: data.proposedRate,
      availability: data.availability
    });

    res.status(201).json(application);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// POST /api/v1/marketplace/applications/:id/review - Accept/Reject application (Brand)
router.post('/applications/:id/review', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      decision: z.enum(['ACCEPTED', 'REJECTED']),
      responseNote: z.string().optional()
    });

    const data = schema.parse(req.body);
    
    const result = await BrandMarketplaceService.reviewApplication({
      applicationId: String(req.params.id),
      brand_id: req.user_id!,
      decision: data.decision,
      response_note: data.responseNote
    });

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// ═══════════════════════════════════════════════════════════
// CONTEST SPONSORSHIPS
// ═══════════════════════════════════════════════════════════

// GET /api/v1/marketplace/contests - Browse sponsorable contests
router.get('/contests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const category = req.query.category as string | undefined;
    const minParticipants = req.query.minParticipants ? parseInt(req.query.minParticipants as string) : undefined;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await BrandMarketplaceService.browseSponsorableContests({
      category,
      min_participants: minParticipants,
      cursor,
      limit
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/marketplace/contests/:id/sponsor - Sponsor contest
router.post('/contests/:id/sponsor', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      type: z.enum(['CONTEST_PRIZE', 'CONTEST_BRANDING', 'CONTEST_EXCLUSIVE', 'CONTENT_SPONSORSHIP']),
      sponsorshipKr: z.number().positive(),
      benefits: z.array(z.string()).min(1),
      logoUrl: z.string().url().optional(),
      brandMessage: z.string().max(500).optional(),
      websiteUrl: z.string().url().optional(),
      start_date: z.string().datetime(),
      end_date: z.string().datetime()
    });

    const data = schema.parse(req.body);
    
    const sponsorship = await BrandMarketplaceService.sponsorContest({
      contest_id: String(req.params.id),
      brand_id: req.user_id!,
      type: data.type,
      sponsorship_kr: data.sponsorshipKr,
      benefits: data.benefits,
      logo_url: data.logoUrl,
      brand_message: data.brandMessage,
      website_url: data.websiteUrl,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date)
    });

    res.status(201).json(sponsorship);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// ═══════════════════════════════════════════════════════════
// SALES FUNNEL & CONVERSION
// ═══════════════════════════════════════════════════════════

// POST /api/v1/marketplace/contests/:id/track-purchase - Track purchase entry
router.post('/contests/:id/track-purchase', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      order_id: z.string().uuid(),
      purchaseAmount: z.number().positive(),
      productIds: z.array(z.string().uuid())
    });

    const data = schema.parse(req.body);
    
    const entry = await SalesFunnelService.trackPurchaseEntry({
      contest_id: String(req.params.id),
      userId: req.user_id!,
      orderId: data.order_id,
      purchaseAmount: data.purchaseAmount,
      productIds: data.productIds
    });

    // Award points for purchase
    await SalesFunnelService.awardPoints({
      user_id: req.user_id!,
      activityType: 'PURCHASE_TO_ENTER',
      category: 'SALES',
      pointsEarned: Math.floor(data.purchaseAmount / 10), // 1 point per Kr.10
      referenceType: 'contest',
      referenceId: String(req.params.id)
    });

    res.status(201).json(entry);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// POST /api/v1/marketplace/contests/:id/track-action - Track engagement action
router.post('/contests/:id/track-action', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      actionType: z.string(),
      targetUrl: z.string().url().optional(),
      proofUrl: z.string().url().optional(),
      metadata: z.any().optional()
    });

    const data = schema.parse(req.body);
    
    const action = await SalesFunnelService.trackEngagementAction({
      contest_id: String(req.params.id),
      userId: req.user_id!,
      actionType: data.actionType,
      targetUrl: data.targetUrl,
      proofUrl: data.proofUrl,
      metadata: data.metadata
    });

    // Award points for engagement
    await SalesFunnelService.awardPoints({
      user_id: req.user_id!,
      activityType: data.actionType,
      category: 'ENGAGEMENT',
      pointsEarned: 10,
      referenceType: 'contest',
      referenceId: String(req.params.id)
    });

    res.status(201).json(action);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// POST /api/v1/marketplace/contests/:id/conversion-campaign - Create conversion campaign
router.post('/contests/:id/conversion-campaign', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      type: z.enum(['POST_CONTEST_DISCOUNT', 'WINNER_ADVOCACY', 'PARTICIPANT_RETARGETING', 'ENGAGEMENT_REWARD']),
      title: z.string().min(5).max(200),
      description: z.string().optional(),
      targetSegment: z.enum(['LOSERS', 'WINNERS', 'ALL_PARTICIPANTS', 'HIGH_ENGAGERS']),
      discountPercent: z.number().min(0).max(100).optional(),
      discountCode: z.string().optional(),
      offerExpiresAt: z.string().datetime().optional()
    });

    const data = schema.parse(req.body);
    
    const campaign = await SalesFunnelService.createConversionCampaign({
      contest_id: String(req.params.id),
      brandId: req.user_id,
      type: data.type,
      title: data.title,
      description: data.description,
      targetSegment: data.targetSegment,
      discountPercent: data.discountPercent,
      discountCode: data.discountCode,
      offerExpiresAt: data.offerExpiresAt ? new Date(data.offerExpiresAt) : undefined
    });

    res.status(201).json(campaign);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// POST /api/v1/marketplace/conversion-campaigns/:id/track - Track campaign interaction
router.post('/conversion-campaigns/:id/track', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      action: z.enum(['OPENED', 'CLICKED', 'CONVERTED']),
      order_id: z.string().uuid().optional(),
      revenueKr: z.number().positive().optional()
    });

    const data = schema.parse(req.body);
    
    await SalesFunnelService.trackCampaignInteraction({
      campaign_id: String(req.params.id),
      userId: req.user_id!,
      action: data.action,
      orderId: data.order_id,
      revenueKr: data.revenueKr
    });

    res.json({ success: true });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// GET /api/v1/marketplace/contests/:id/funnel - Get funnel analytics
router.get('/contests/:id/funnel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const analytics = await SalesFunnelService.getContestFunnelAnalytics(String(req.params.id));
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/marketplace/contests/:id/roi - Get ROI metrics
router.get('/contests/:id/roi', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const roi = await SalesFunnelService.getContestROI(String(req.params.id));
    res.json(roi);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
// GAMIFICATION
// ═══════════════════════════════════════════════════════════

// GET /api/v1/marketplace/gamification/me - Get my gamification stats
router.get('/gamification/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await SalesFunnelService.getUserGamificationStats(req.user_id!);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
