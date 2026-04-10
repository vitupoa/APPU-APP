"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const contests_service_1 = require("./contests.service");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createContestSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(100),
    description: zod_1.z.string().min(10).max(2000),
    mediaType: zod_1.z.enum(['PHOTO', 'VIDEO', 'PHOTO_AND_VIDEO']),
    category: zod_1.z.enum(['DANCE', 'CHALLENGE', 'PROMOTION', 'CREATIVE', 'ART', 'MUSIC']),
    prizeKr: zod_1.z.number().positive('Prize must be positive'),
    requiredActions: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.string(),
        targetUrl: zod_1.z.string().optional(),
        label: zod_1.z.string()
    })).min(1),
    maxWinners: zod_1.z.number().int().min(1).max(3),
    prizeDistribution: zod_1.z.array(zod_1.z.object({
        rank: zod_1.z.number().int().min(1),
        percentage: zod_1.z.number().min(0).max(100)
    })).min(1),
    judgingCriteria: zod_1.z.enum(['CREATOR_PICKS', 'COMMUNITY_VOTE', 'MOST_ENGAGEMENT']),
    sponsorName: zod_1.z.string().max(100).optional(),
    sponsorUrl: zod_1.z.string().url().optional(),
    deadline: zod_1.z.string().datetime(),
    coverMediaUrl: zod_1.z.string().url().optional()
});
const submitEntrySchema = zod_1.z.object({
    mediaUrl: zod_1.z.string().url('Invalid media URL'),
    mediaType: zod_1.z.enum(['PHOTO', 'VIDEO']),
    proofUrls: zod_1.z.array(zod_1.z.string().url()).optional()
});
const distributeSchema = zod_1.z.object({
    winnerIds: zod_1.z.array(zod_1.z.string().uuid()).min(1).max(3)
});
// GET /api/v1/contests
router.get('/', auth_1.optionalAuth, async (req, res) => {
    try {
        const status = req.query.status;
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const result = await contests_service_1.ContestService.listContests({ status, cursor, limit, userId: req.userId });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/contests
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = createContestSchema.parse(req.body);
        const contest = await contests_service_1.ContestService.createContest({
            creatorId: req.userId,
            ...data,
            deadline: new Date(data.deadline)
        });
        res.status(201).json(contest);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        else {
            res.status(400).json({ error: error.message });
        }
    }
});
// GET /api/v1/contests/my-contests
router.get('/my-contests', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await contests_service_1.ContestService.listContests({ userId: req.userId, limit: 50 });
        const mine = result.items.filter((c) => c.creator?.id === req.userId);
        res.status(200).json(mine);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/v1/contests/:id
router.get('/:id', auth_1.optionalAuth, async (req, res) => {
    try {
        const contest = await contests_service_1.ContestService.getContestById(String(req.params.id), req.userId);
        res.status(200).json(contest);
    }
    catch (error) {
        res.status(404).json({ error: 'Contest not found' });
    }
});
// POST /api/v1/contests/:id/join
router.post('/:id/join', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await contests_service_1.ContestService.joinContest(req.userId, String(req.params.id));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// POST /api/v1/contests/:id/submit
router.post('/:id/submit', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = submitEntrySchema.parse(req.body);
        const submission = await contests_service_1.ContestService.submitEntry({
            userId: req.userId,
            contestId: String(req.params.id),
            ...data
        });
        res.status(201).json(submission);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        else {
            res.status(400).json({ error: error.message });
        }
    }
});
// GET /api/v1/contests/:id/submissions — always visible per spec
router.get('/:id/submissions', async (req, res) => {
    try {
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const result = await contests_service_1.ContestService.getSubmissions(String(req.params.id), cursor, limit);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/v1/contests/:id/leaderboard
router.get('/:id/leaderboard', async (req, res) => {
    try {
        const result = await contests_service_1.ContestService.getLeaderboard(String(req.params.id));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/contests/:id/distribute — Admin only
router.post('/:id/distribute', auth_1.authMiddleware, auth_1.adminAuth, async (req, res) => {
    try {
        const { winnerIds } = distributeSchema.parse(req.body);
        await contests_service_1.ContestService.distributeContestPrizes(String(req.params.id), winnerIds);
        res.status(200).json({ success: true, message: 'Prizes distributed successfully' });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        else {
            res.status(400).json({ error: error.message });
        }
    }
});
exports.default = router;
//# sourceMappingURL=contests.routes.js.map