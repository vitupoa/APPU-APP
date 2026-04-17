import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { AdsService } from './ads.service.js';

const router = Router();

// POST /api/v1/ads/rewarded — Credit user for watching rewarded ad
router.post('/rewarded', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await AdsService.creditRewardedAd(req.userId!);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/ads/impression — Record ad impression (analytics)
router.post('/impression', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { adUnitId, adType, placement } = req.body;
    await AdsService.recordImpression({
      userId: req.userId,
      adUnitId,
      adType,
      placement
    });
    res.status(200).json({ recorded: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
