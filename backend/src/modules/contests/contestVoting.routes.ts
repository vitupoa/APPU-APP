import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database.js';
import { z } from 'zod';
import { validateRequest } from '../../middleware/validate.js';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { votingRateLimiter } from '../../middleware/rateLimiter.js';
import { csrfProtection } from '../../middleware/csrfProtection.js';

const router = Router();

/**
 * Zod schema for vote validation with required fingerprint and IP tracking
 */
const VoteSchema = z.object({
    submissionId: z.string().uuid(),
    fingerprint: z.string().min(1, 'Device fingerprint is required')
});

/**
 * POST /contests/vote
 * Gamified Swiper Action - Integrates the Tinder logic natively securely bypassing sweepstakes by ensuring FREE entries safely.
 */
router.post('/vote', 
  authMiddleware, 
  csrfProtection,
  votingRateLimiter, 
  validateRequest(VoteSchema), 
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { submissionId, fingerprint } = req.body;
        const voterId = req.userId!;
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

        // 1. Check for duplicate votes by IP or fingerprint to prevent bot abuse
        const duplicateVote = await prisma.contestVote.findFirst({
            where: {
                submissionId,
                OR: [
                    { voterId },
                    { ipAddress },
                    { fingerprint }
                ]
            }
        });

        if (duplicateVote) {
             res.status(403).json({ error: 'Duplicate vote detected. You have already voted on this submission.' });
             return;
        }

        // 2. Register vote with required IP and fingerprint tracking
        await prisma.$transaction(async (tx: any) => {
            // Log vote with required tracking fields
            await tx.contestVote.create({
                data: {
                    submissionId,
                    voterId,
                    ipAddress,
                    fingerprint
                }
            });

            // Increment public tracker implicitly
            await tx.contestSubmission.update({
                where: { id: submissionId },
                data: {
                    votesCount: {
                        increment: 1
                    }
                }
            });
        });

        res.status(200).json({ success: true, message: "Vote registered successfully" });

    } catch (e: any) {
        console.error('[Voting Service] Error:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
