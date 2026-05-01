import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { PrismaClient } from '../../generated/prisma/index.js';

const router = Router();
const prisma = new PrismaClient();

// Get all niches (predefined + custom)
router.get('/', authenticate, async (req, res) => {
  const niches = await req.prisma.creatorNiche.findMany({
    orderBy: [
      { isCustom: 'asc' },
      { usageCount: 'desc' }
    ]
  });
  res.json(niches);
});

// Add custom niche
router.post('/custom', authenticate, async (req, res) => {
  const { name } = req.body;
  
  const existing = await req.prisma.creatorNiche.findUnique({
    where: { name: name.toLowerCase() }
  });
  
  if (existing) {
    await req.prisma.creatorNiche.update({
      where: { id: existing.id },
      data: { usageCount: { increment: 1 } }
    });
    return res.json(existing);
  }
  
  const niche = await req.prisma.creatorNiche.create({
    data: {
      name: name.toLowerCase(),
      isCustom: true,
      createdBy: req.user!.id
    }
  });
  
  res.json(niche);
});

// Update user niches
router.patch('/me', authenticate, async (req, res) => {
  const { selectedNiches, customNiches } = req.body;
  
  const user = await req.prisma.user.update({
    where: { id: req.user!.id },
    data: {
      selectedNiches: selectedNiches || [],
      customNiches: customNiches || []
    }
  });
  
  res.json({ selectedNiches: user.selectedNiches, customNiches: user.customNiches });
});

// Get user niches
router.get('/me', authenticate, async (req, res) => {
  const user = await req.prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { selectedNiches: true, customNiches: true }
  });
  
  res.json(user);
});

// Get niches for specific user (public)
router.get('/user/:userId', async (req, res) => {
  const user = await req.prisma.user.findUnique({
    where: { id: req.params.userId },
    select: { selectedNiches: true, customNiches: true }
  });
  
  res.json(user);
});

export default router;
