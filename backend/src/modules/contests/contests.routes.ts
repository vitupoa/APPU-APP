import { Router, Response } from 'express';
import { authMiddleware, optionalAuth, adminAuth, AuthRequest } from '../../middleware/auth.js';
import { ContestService } from './contests.service.js';
import { z } from 'zod';

const router = Router();

const createContestSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  mediaType: z.enum(['PHOTO', 'VIDEO', 'PHOTO_AND_VIDEO']),
  category: z.enum(['DANCE', 'CHALLENGE', 'PROMOTION', 'CREATIVE', 'ART', 'MUSIC']),
  prizeKr: z.number().positive('Prize must be positive'),
  requiredActions: z.array(z.object({
    type: z.string(),
    targetUrl: z.string().optional(),
    label: z.string()
  })).min(1),
  maxWinners: z.number().int().min(1).max(3),
  prizeDistribution: z.array(z.object({
    rank: z.number().int().min(1),
    percentage: z.number().min(0).max(100)
  })).min(1),
  judgingCriteria: z.enum(['CREATOR_PICKS', 'COMMUNITY_VOTE', 'MOST_ENGAGEMENT', 'COMBINATION']),
  sponsorName: z.string().max(100).optional(),
  sponsorUrl: z.string().url().optional(),
  deadline: z.string().datetime(),
  coverMediaUrl: z.string().url().optional(),

  // Wizard Gamification Metrics
  entryFeeKr: z.number().positive().optional(),
  publicVoteWeight: z.number().min(0).max(100).optional(),
  allowDailyPrizes: z.boolean().optional(),
  dailyPrizeKr: z.number().positive().optional(),
  targetAges: z.array(z.number()).length(2).optional(),
  targetGeos: z.array(z.string().length(2)).optional(),
  airdropKr: z.number().positive().optional(),
  airdropLimit: z.number().int().positive().optional(),
  judges: z.array(z.string().uuid()).max(20).optional(), // 20 Judge limit explicitly enforced natively
});

const submitEntrySchema = z.object({
  mediaUrl: z.string().url('Invalid media URL'),
  mediaType: z.enum(['PHOTO', 'VIDEO']),
  proofUrls: z.array(z.string().url()).optional()
});

const distributeSchema = z.object({
  winnerIds: z.array(z.string().uuid()).min(1).max(3)
});

// GET /api/v1/contests
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await ContestService.listContests({ status, cursor, limit, userId: req.userId });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/contests
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createContestSchema.parse(req.body);
    const contest = await ContestService.createContest({
      creatorId: req.userId!,
      ...data,
      deadline: new Date(data.deadline)
    });
    res.status(201).json(contest);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// GET /api/v1/contests/my-contests
router.get('/my-contests', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ContestService.listContests({ userId: req.userId, limit: 50 });
    const mine = result.items.filter((c: any) => c.creator?.id === req.userId);
    res.status(200).json(mine);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/contests/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const contest = await ContestService.getContestById(String(req.params.id), req.userId);
    res.status(200).json(contest);
  } catch (error: any) {
    res.status(404).json({ error: 'Contest not found' });
  }
});

// POST /api/v1/contests/:id/join
router.post('/:id/join', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ContestService.joinContest(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/contests/:id/submit
router.post('/:id/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = submitEntrySchema.parse(req.body);
    const submission = await ContestService.submitEntry({
      userId: req.userId!,
      contestId: String(req.params.id),
      ...data
    });
    res.status(201).json(submission);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// GET /api/v1/contests/:id/submissions — always visible per spec
router.get('/:id/submissions', async (req: AuthRequest, res: Response) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await ContestService.getSubmissions(String(req.params.id), cursor, limit);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/contests/submissions/feed — All contest submissions feed
router.get('/submissions/feed', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const result = await ContestService.getSubmissionsFeed(cursor, limit, req.userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/contests/submissions/:submissionId/vote
router.post('/submissions/:submissionId/vote', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { voteType } = z.object({ voteType: z.enum(['UPVOTE', 'DOWNVOTE']) }).parse(req.body);
    const result = await ContestService.voteOnSubmission(req.userId!, String(req.params.submissionId), voteType);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// GET /api/v1/contests/:id/leaderboard
router.get('/:id/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const result = await ContestService.getLeaderboard(String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/contests/:id/distribute — Admin only
router.post('/:id/distribute', authMiddleware, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { winnerIds } = distributeSchema.parse(req.body);
    await ContestService.distributeContestPrizes(String(req.params.id), winnerIds);
    res.status(200).json({ success: true, message: 'Prizes distributed successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

export default router;
