import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

// Get boost settings
router.get('/settings', authenticate, async (req, res) => {
  const settings = await req.prisma.creatorBoostSettings.findUnique({
    where: { id: '00000000-0000-0000-0000-000000000001' }
  });
  res.json(settings);
});

// Update boost settings (super admin only)
router.patch('/settings', authenticate, requireAdmin, async (req, res) => {
  const { minBoostAmountKes, shortCpmKes, postCpmKes, liveCpmKes } = req.body;
  
  const settings = await req.prisma.creatorBoostSettings.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      minBoostAmountKes,
      shortCpmKes,
      postCpmKes,
      liveCpmKes,
      updatedBy: req.user!.id
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      minBoostAmountKes,
      shortCpmKes,
      postCpmKes,
      liveCpmKes,
      updatedBy: req.user!.id
    }
  });
  
  res.json(settings);
});

export default router;
