import { Router, Response } from 'express';
import { authMiddleware, optionalAuth, AuthRequest } from '../../middleware/auth.js';
import { CommentsService } from './comments.service.js';
import { z } from 'zod';

const router = Router();
const commentsService = new CommentsService();

const getCommentsSchema = z.object({
  contentType: z.enum(['post', 'short', 'contest_submission']),
  contentId: z.string().uuid(),
  sortBy: z.enum(['latest', 'top', 'oldest']).optional().default('latest'),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

const getRepliesSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(50).optional().default(10),
});

const createCommentSchema = z.object({
  text: z.string().min(1).max(500),
  parentId: z.string().uuid().optional(),
  replyToUserId: z.string().uuid().optional(),
});

const updateCommentSchema = z.object({
  text: z.string().min(1).max(500),
});

const reportCommentSchema = z.object({
  reason: z.string().min(1).max(100),
});

const updateSettingsSchema = z.object({
  commentsEnabled: z.boolean(),
  repliesEnabled: z.boolean(),
});

// GET /api/v1/comments - Get comments for content
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { contentType, contentId, sortBy, cursor, limit } = getCommentsSchema.parse(req.query);

    const result = await commentsService.getComments(
      contentType,
      contentId,
      sortBy,
      cursor || null,
      limit,
      req.userId || null
    );

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// GET /api/v1/comments/:commentId/replies - Get replies for a comment
router.get('/:commentId/replies', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { cursor, limit } = getRepliesSchema.parse(req.query);

    const result = await commentsService.getReplies(
      commentId,
      cursor || null,
      limit,
      req.userId || null
    );

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(404).json({ error: error.message });
    }
  }
});

// POST /api/v1/comments - Create a comment
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { contentType, contentId } = getCommentsSchema.pick({ contentType: true, contentId: true }).parse(req.query);
    const { text, parentId, replyToUserId } = createCommentSchema.parse(req.body);

    const result = await commentsService.createComment(
      req.userId!,
      contentType,
      contentId,
      text,
      parentId || null,
      replyToUserId || null
    );

    res.status(201).json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// PUT /api/v1/comments/:commentId - Update a comment
router.put('/:commentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { text } = updateCommentSchema.parse(req.body);

    const result = await commentsService.updateComment(commentId, req.userId!, text);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(403).json({ error: error.message });
    }
  }
});

// DELETE /api/v1/comments/:commentId - Delete a comment
router.delete('/:commentId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    const result = await commentsService.deleteComment(commentId, req.userId!);

    res.json(result);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// POST /api/v1/comments/:commentId/like - Like a comment
router.post('/:commentId/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    const result = await commentsService.likeComment(commentId, req.userId!);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/v1/comments/:commentId/like - Unlike a comment
router.delete('/:commentId/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    const result = await commentsService.unlikeComment(commentId, req.userId!);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/v1/comments/:commentId/pin - Pin a comment
router.post('/:commentId/pin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    const result = await commentsService.pinComment(commentId, req.userId!);

    res.json(result);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// DELETE /api/v1/comments/:commentId/pin - Unpin a comment
router.delete('/:commentId/pin', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;

    const result = await commentsService.unpinComment(commentId, req.userId!);

    res.json(result);
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
});

// POST /api/v1/comments/:commentId/report - Report a comment
router.post('/:commentId/report', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const { reason } = reportCommentSchema.parse(req.body);

    const result = await commentsService.reportComment(commentId, req.userId!, reason);

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// PUT /api/v1/comments/settings - Update comment settings
router.put('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { contentType, contentId } = getCommentsSchema.pick({ contentType: true, contentId: true }).parse(req.query);
    const { commentsEnabled, repliesEnabled } = updateSettingsSchema.parse(req.body);

    const result = await commentsService.updateCommentSettings(
      req.userId!,
      contentType,
      contentId,
      commentsEnabled,
      repliesEnabled
    );

    res.json(result);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(403).json({ error: error.message });
    }
  }
});

export default router;
