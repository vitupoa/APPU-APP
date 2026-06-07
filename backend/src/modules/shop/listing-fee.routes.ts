import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { listingFeeService } from './listing-fee.service';
import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

const router = Router();

router.use(authMiddleware);

// Calculate listing fee for a product
router.get('/calculate', async (req, res): Promise<void> => {
  try {
    const { category } = req.query;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true }
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const result = await listingFeeService.calculateListingFee(
      userId,
      category as any,
      user.country
    );
    
    res.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

// Get user's listing quota status
router.get('/quota', async (req, res): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    let quota = await prisma.user_listing_quota.findUnique({
      where: { user_id: userId }
    });
    
    if (!quota) {
      quota = await prisma.user_listing_quota.create({ data: { user_id: userId }} as any));
    }
    
    const config = await prisma.listing_fee_config.findFirst({
      where: { is_enabled: true, is_active: true },
      orderBy: { priority: 'desc' }
    });
    
    res.json({
      dailyUsed: quota.daily_used,
      weeklyUsed: quota.weekly_used,
      monthlyUsed: quota.monthly_used,
      dailyLimit: config?.daily_free_quota || 0,
      weeklyLimit: config?.weekly_free_quota || 0,
      monthlyLimit: config?.monthly_free_quota || 0
    });
  } catch (error: unknown) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});

export default router;
