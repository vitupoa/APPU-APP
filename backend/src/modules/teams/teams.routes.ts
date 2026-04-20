import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { TeamsService } from './teams.service.js';
import { z } from 'zod';

const router = Router();

const createTeamSchema = z.object({
  name: z.string().min(3).max(50),
  avatarUrl: z.string().url().optional(),
  maxMembers: z.number().int().min(2).max(10),
});

const inviteMemberSchema = z.object({
  userId: z.string().uuid(),
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createTeamSchema.parse(req.body);
    const team = await TeamsService.createTeam({
      leaderId: req.userId!,
      ...data,
    });
    res.status(201).json(team);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

router.get('/my-teams', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const teams = await TeamsService.getMyTeams(req.userId!);
    res.json(teams);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:teamId/invite', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = inviteMemberSchema.parse(req.body);
    const invitation = await TeamsService.inviteMember(
      String(req.params.teamId),
      req.userId!,
      userId
    );
    res.status(201).json(invitation);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

router.post('/invitations/:invitationId/accept', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await TeamsService.respondToInvitation(String(req.params.invitationId), req.userId!, true);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/invitations/:invitationId/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await TeamsService.respondToInvitation(String(req.params.invitationId), req.userId!, false);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:teamId/register-contest', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { contestId } = z.object({ contestId: z.string().uuid() }).parse(req.body);
    await TeamsService.registerTeamForContest(contestId, String(req.params.teamId), req.userId!);
    res.json({ success: true });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

router.post('/:teamId/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = z.object({
      contestId: z.string().uuid(),
      mediaUrl: z.string().url(),
      mediaType: z.enum(['photo', 'video']),
      caption: z.string().optional(),
      contributors: z.array(z.string().uuid()),
    }).parse(req.body);

    const submission = await TeamsService.submitTeamEntry({
      ...data,
      teamId: String(req.params.teamId),
      userId: req.userId!,
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

router.get('/:teamId/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const stats = await TeamsService.getTeamStats(String(req.params.teamId));
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
