import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';

const router = Router();

// Get boost settings
router.get('/settings', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const settings = await prisma.creator_boost_global_settings.findUnique({
    where: { id: '00000000-0000-0000-0000-000000000001' }
  });
  res.json(settings);
});

// Update boost settings (super admin only)
router.patch('/settings', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  const { minBoostAmountKes, shortCpmKes, postCpmKes, liveCpmKes } = req.body;
  
  const settings = await prisma.creator_boost_global_settings.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      minBoostAmountKes,
      shortCpmKes,
      postCpmKes,
      liveCpmKes,
      updatedBy: req.userId
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      minBoostAmountKes,
      shortCpmKes,
      postCpmKes,
      liveCpmKes,
      updatedBy: req.userId
    }
  });
  
  res.json(settings);
});

export default router;
