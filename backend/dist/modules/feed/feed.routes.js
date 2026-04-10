"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const feed_service_1 = require("./feed.service");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createPostSchema = zod_1.z.object({
    imageUrls: zod_1.z.array(zod_1.z.string().url()).min(1).max(10),
    caption: zod_1.z.string().max(2200).default(''),
    isLocked: zod_1.z.boolean().default(false),
    requiredTier: zod_1.z.enum(['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN']).optional()
});
const addCommentSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(500)
});
// GET /api/v1/feed
router.get('/', auth_1.optionalAuth, async (req, res) => {
    try {
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const result = await feed_service_1.FeedService.getFeed({ userId: req.userId, cursor, limit });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/feed
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = createPostSchema.parse(req.body);
        const post = await feed_service_1.FeedService.createPost({ userId: req.userId, ...data });
        res.status(201).json(post);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        else {
            res.status(500).json({ error: error.message });
        }
    }
});
// POST /api/v1/feed/:id/like
router.post('/:id/like', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await feed_service_1.FeedService.toggleLike(req.userId, String(req.params.id));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/v1/feed/:id/like
router.delete('/:id/like', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await feed_service_1.FeedService.toggleLike(req.userId, String(req.params.id));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/feed/:id/comment
router.post('/:id/comment', auth_1.authMiddleware, async (req, res) => {
    try {
        const { text } = addCommentSchema.parse(req.body);
        const comment = await feed_service_1.FeedService.addComment(req.userId, String(req.params.id), text);
        res.status(201).json(comment);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        else {
            res.status(500).json({ error: error.message });
        }
    }
});
exports.default = router;
//# sourceMappingURL=feed.routes.js.map