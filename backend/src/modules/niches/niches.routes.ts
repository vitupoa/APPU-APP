import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';
import { getQueryString } from '../../utils/queryParams.js';

const router = Router();

// Get all niches (predefined + custom)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const niches = await prisma.creatorNiche.findMany({
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
  
  const existing = await prisma.creatorNiche.findUnique({
    where: { name: name.toLowerCase() }
  });
  
  if (existing) {
    await prisma.creatorNiche.update({
      where: { id: existing.id },
      data: { usageCount: { increment: 1 } }
    });
    res.json(existing);
    return;
  }
  
  const niche = await prisma.creatorNiche.create({
    data: {
      name: name.toLowerCase(),
      isCustom: true,
      createdBy: req.userId!
    }
  });
  
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
