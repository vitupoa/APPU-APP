import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { rateLimiter } from '../../middleware/rateLimiter';
import { contentDistributionService } from './services/contentDistribution.service';
import { feedGenerationService } from './services/feedGeneration.service';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Apply stricter rate limiting for interaction tracking (prevent spam)
const interactionRateLimiter = rateLimiter({ windowMs: 10000, max: 100 }); // 100 requests per 10 seconds

// Generate Discover feed
router.get('/feed/discover', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const cursor = req.query.cursor as string;

    const feed = await feedGenerationService.generateDiscoverFeed(userId, limit, cursor);
    
    res.json(feed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Admiring feed
router.get('/feed/admiring', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const feed = await feedGenerationService.generateAdmiringFeed(userId, limit);
    
    res.json(feed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Track user interaction (with rate limiting)
router.post('/interactions/track', interactionRateLimiter, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { contentId, contentType, signalType, watchDuration, totalDuration } = req.body;

    // Input validation
    if (!contentId || !contentType || !signalType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validSignalTypes = ['VIEW', 'LIKE', 'SHARE', 'COMMENT', 'REWATCH', 'SKIP', 'NOT_INTERESTED', 'HIDE', 'ADMIRE', 'UNADMIRE'];
    if (!validSignalTypes.includes(signalType)) {
      return res.status(400).json({ error: 'Invalid signal type' });
    }

    const validContentTypes = ['SHORT', 'POST'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    await feedGenerationService.trackInteraction(userId, contentId, contentType, {
      signalType,
      watchDuration,
      totalDuration
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize content distribution (called when content is uploaded)
router.post('/distribution/initialize', async (req, res) => {
  try {
    const { contentId, contentType, hashtags, location } = req.body;
    const creatorId = req.user!.id;

    // Input validation
    if (!contentId || !contentType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validContentTypes = ['SHORT', 'POST'];
    if (!validContentTypes.includes(contentType)) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    const result = await contentDistributionService.initializeDistribution(
      contentId,
      contentType,
      creatorId,
      { hashtags, location }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Evaluate content performance
router.post('/distribution/evaluate', authenticate, async (req, res) => {
  try {
    const { contentId, contentType } = req.body;

    const result = await contentDistributionService.evaluatePerformance(contentId, contentType);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
