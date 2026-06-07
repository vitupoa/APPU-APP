import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';
import { parseQueryString } from '../../utils/queryParams.js';
import crypto from 'crypto';

const router = Router();

// Get all niches (predefined + custom)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const niches = await prisma.creator_niche.findMany({
    orderBy: [
      { isCustom: 'asc' },
      { usageCount: 'desc' }
    ]
  });
  res.json(niches);
});

// Add custom niche
router.post('/custom', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.body;
  
  const existing = await prisma.creator_niche.findUnique({
    where: { name: name.toLowerCase() }
  });
  
  if (existing) {
    await prisma.creator_niche.update({
      where: { id: existing.id },
      data: { usageCount: { increment: 1 } }
    });
    res.json(existing);
    return;
  }
  
  const niche = await prisma.creator_niche.create({ data: { id: crypto.randomUUID(), name: name.toLowerCase(),
      isCustom: true,
      createdBy: req.userId!}} as any));
  
  res.json(niche);
});

// Update user niches
router.patch('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { selectedNiches, customNiches } = req.body;
  
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: {
      selectedNiches: selectedNiches || [],
      customNiches: customNiches || []
    }
  });
  
  res.json({ selectedNiches: user.selectedNiches, customNiches: user.customNiches });
});

// Get user niches
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { selectedNiches: true, customNiches: true }
  });
  
  res.json(user);
});

// Get niches for specific user (public)
router.get('/user/:userId', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId as string },
    select: { selectedNiches: true, customNiches: true }
  });
  
  res.json(user);
});

export default router;
