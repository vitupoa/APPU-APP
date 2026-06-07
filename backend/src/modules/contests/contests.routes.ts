import { Router, Response } from 'express';
import { authMiddleware, optionalAuth, adminAuth, AuthRequest } from '../../middleware/auth.js';
import { ContestService } from './contests.service.js';
import { z } from 'zod';
import { richXssProtection, strictXssProtection } from '../../middleware/xssProtection.js';
import { csrfProtection } from '../../middleware/csrfProtection.js';


// Helper to safely extract string from query parameter
function getQueryParam(param: any): string | undefined {
  if (Array.isArray(param)) return param[0];
  if (typeof param === 'string') return param;
  return undefined;
}
const router = Router();

const createContestSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  media_type: z.enum(['PHOTO', 'VIDEO', 'PHOTO_AND_VIDEO']),
  category: z.enum(['DANCE', 'CHALLENGE', 'PROMOTION', 'CREATIVE', 'ART', 'MUSIC']),
  prizeTotalKr: z.number().positive('Prize must be positive'),
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
  dailyprizeTotalKr: z.number().positive().optional(),
  targetAges: z.array(z.number()).length(2).optional(),
  targetGeos: z.array(z.string().length(2)).optional(),
  airdropKr: z.number().positive().optional(),
  airdropLimit: z.number().int().positive().optional(),
  judges: z.array(z.string().uuid()).max(20).optional(), // 20 Judge limit explicitly enforced natively

  // Team Participation Fields
  participationType: z.enum(['INDIVIDUAL_ONLY', 'TEAM_ONLY', 'BOTH']),
  teamSize: z.number().int().min(2).max(10).optional(),
  maxTeams: z.number().int().positive().optional(),
});

const submitEntrySchema = z.object({
  media_url: z.string().url('Invalid media URL'),
  media_type: z.enum(['PHOTO', 'VIDEO']),
  proofUrls: z.array(z.string().url()).optional()
});

const distributeSchema = z.object({
  winnerIds: z.array(z.string().uuid()).min(1).max(10).optional()
});

// GET /api/v1/contests
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const currency = getQueryParam(req.query.currency);
    const result = await ContestService.listContests({ 
      status, 
      cursor, 
      limit, 
      userId: req.userId,
      userCurrency: currency
    });
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/contests
router.post('/', 
  authMiddleware, 
  csrfProtection,
  richXssProtection(['title', 'description', 'sponsorName']),
  async (req: AuthRequest, res: Response) => {
  try {
    const data = createContestSchema.parse(req.body);
    const contest = await ContestService.createContest({
      creator_id: req.userId!,
      title: data.title,
      description: data.description,
      mediaType: data.media_type,
      category: data.category,
      prizeTotalKr: data.prizeTotalKr,
      requiredActions: data.requiredActions as { type: string; targetUrl?: string; label: string; }[],
      maxWinners: data.maxWinners,
      prizeDistribution: data.prizeDistribution as { rank: number; percentage: number; }[],
      judgingCriteria: data.judgingCriteria,
      sponsorName: data.sponsorName,
      sponsorUrl: data.sponsorUrl,
      deadline: new Date(data.deadline),
      coverMediaUrl: data.coverMediaUrl,
      entryFeeKr: data.entryFeeKr,
      publicVoteWeight: data.publicVoteWeight,
      allowDailyPrizes: data.allowDailyPrizes,
      dailyprizeTotalKr: data.dailyprizeTotalKr,
      targetAges: data.targetAges,
      targetGeos: data.targetGeos,
      airdropKr: data.airdropKr,
      airdropLimit: data.airdropLimit,
      judges: data.judges,
      participationType: data.participationType,
      teamSize: data.teamSize,
      maxTeams: data.maxTeams
    });
    // Return only contestId and message as expected by frontend
    res.status(201).json({ 
      contest_id: contest.contest_id,
      message: 'Contest created successfully' 
    });
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
    const mine = result.items.filter((c: any) => c.user?.id === req.userId);
    res.status(200).json(mine);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/contests/:id
router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const currency = getQueryParam(req.query.currency);
    const contest = await ContestService.getContestById(String(req.params.id), req.userId, currency);
    res.status(200).json(contest);
  } catch (error: any) {
    res.status(404).json({ error: 'Contest not found' });
  }
});

// POST /api/v1/contests/:id/join
router.post('/:id/join', authMiddleware, csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ContestService.joinContest(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/contests/:id/requirements
router.get('/:id/requirements', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await ContestService.getContestRequirements(req.userId!, String(req.params.id));
    res.status(200).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/contests/:id/submit
router.post('/:id/submit', 
  authMiddleware, 
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
  try {
    const data = submitEntrySchema.parse(req.body);
    const submission = await ContestService.submitEntry({
      user_id: req.userId!,
      contestId: String(req.params.id),
      mediaUrl: data.media_url,
      mediaType: data.media_type,
      proofUrls: data.proofUrls
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
router.post('/submissions/:submissionId/vote', 
  authMiddleware, 
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
  try {
    const { voteType } = z.object({ voteType: z.enum(['UPVOTE', 'DOWNVOTE']) }).parse(req.body);
    const result = await ContestService.voteOnSubmission(req.userId!, String(req.params.submission_id), voteType);
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

// POST /api/v1/contests/:id/distribute — Admin only (supports both manual and auto)
router.post('/:id/distribute', 
  authMiddleware, 
  adminAuth, 
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
  try {
    const parsed = distributeSchema.parse(req.body);
    await ContestService.distributeContestPrizes(String(req.params.id), parsed.winnerIds);
    res.status(200).json({ success: true, message: 'Prizes distributed successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// ─── JUDGE INVITE ENDPOINTS ───────────────────────────────

const inviteJudgesSchema = z.object({
  judgeIds: z.array(z.string().uuid()).min(1).max(15)
});

// POST /api/v1/contests/:id/judges/invite
router.post('/:id/judges/invite', 
  authMiddleware, 
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
  try {
    const { judgeIds } = inviteJudgesSchema.parse(req.body);
    const result = await ContestService.inviteJudges(String(req.params.id), judgeIds);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// GET /api/v1/contests/judge/invitations
router.get('/judge/invitations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const invitations = await ContestService.getJudgeInvitations(req.userId!);
    res.status(200).json(invitations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/contests/judge/invitations/:inviteId/accept
router.post('/judge/invitations/:inviteId/accept', 
  authMiddleware, 
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
  try {
    const result = await ContestService.acceptJudgeInvite(String(req.params.inviteId), req.userId!);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/contests/judge/invitations/:inviteId/decline
router.post('/judge/invitations/:inviteId/decline', 
  authMiddleware, 
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
  try {
    const result = await ContestService.declineJudgeInvite(String(req.params.inviteId), req.userId!);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/contests/judge/assigned
router.get('/judge/assigned', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const contests = await ContestService.getAssignedContests(req.userId!);
    res.status(200).json(contests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── JUDGING & SCORING ENDPOINTS ───────────────────────────────

// POST /api/v1/contests/:id/transition-to-judging
router.post('/:id/transition-to-judging', 
  authMiddleware, 
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
  try {
    const result = await ContestService.transitionToJudging(String(req.params.id), req.userId);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const scoreSubmissionSchema = z.object({
  score: z.number().min(0).max(100),
  feedback: z.string().max(500).optional()
});

// POST /api/v1/contests/submissions/:submissionId/score
router.post('/submissions/:submissionId/score', 
  authMiddleware, 
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
  try {
    const { score, feedback } = scoreSubmissionSchema.parse(req.body);
    const result = await ContestService.scoreSubmission(
      req.userId!,
      String(req.params.submissionId),
      score,
      feedback
    );
    res.status(200).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// GET /api/v1/contests/:id/calculate-winners
router.get('/:id/calculate-winners', 
  authMiddleware, 
  async (req: AuthRequest, res: Response) => {
  try {
    const winners = await ContestService.calculateWinners(String(req.params.id));
    res.status(200).json(winners);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/v1/contests/:id/prize-breakdown
router.get('/:id/prize-breakdown', async (req: AuthRequest, res: Response) => {
  try {
    const currency = getQueryParam(req.query.currency) || 'usd';
    const breakdown = await ContestService.getPrizeBreakdown(String(req.params.id), currency);
    res.status(200).json(breakdown);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/contests/:id/distribute-auto — Automatic distribution based on scores
router.post('/:id/distribute-auto', 
  authMiddleware, 
  adminAuth, 
  csrfProtection,
  async (req: AuthRequest, res: Response) => {
  try {
    await ContestService.distributeContestPrizes(String(req.params.id));
    res.status(200).json({ success: true, message: 'Prizes distributed automatically based on scores' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
