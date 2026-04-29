import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
import { prisma } from '../config/database.js';

/**
 * Verifies that the authenticated user owns the influencer profile
 */
export async function verifyInfluencerOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { influencerId } = req.body;
    
    if (!influencerId) {
      res.status(400).json({ error: 'Influencer ID is required' });
      return;
    }
    
    const influencerProfile = await prisma.influencerProfile.findUnique({
      where: { id: influencerId },
      select: { userId: true }
    });
    
    if (!influencerProfile) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }
    
    if (influencerProfile.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden: You do not own this influencer profile' });
      return;
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify ownership' });
  }
}

/**
 * Verifies that the authenticated user owns the social media account
 */
export async function verifySocialAccountOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const accountId = Array.isArray(req.params.accountId) 
      ? req.params.accountId[0] 
      : req.params.accountId;
    
    if (!accountId) {
      res.status(400).json({ error: 'Account ID is required' });
      return;
    }
    
    const account = await prisma.socialMediaAccount.findUnique({
      where: { id: accountId },
      include: {
        influencer: {
          select: { userId: true }
        }
      }
    });
    
    if (!account) {
      res.status(404).json({ error: 'Social media account not found' });
      return;
    }
    
    if (account.influencer.userId !== req.userId) {
      res.status(403).json({ error: 'Forbidden: You do not own this social media account' });
      return;
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify ownership' });
  }
}
