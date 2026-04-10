"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const shorts_service_1 = require("./shorts.service");
const shorts_validation_1 = require("./shorts.validation");
const router = (0, express_1.Router)();
// GET /api/v1/shorts/feed — paginated feed (optional auth for personalization)
router.get('/feed', auth_1.optionalAuth, async (req, res) => {
    try {
        const query = shorts_validation_1.feedQuerySchema.parse(req.query);
        const result = await shorts_service_1.ShortsService.getFeed({
            userId: req.userId || 'anonymous',
            tab: query.tab,
            cursor: query.cursor,
            limit: query.limit
        });
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// POST /api/v1/shorts — create short
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = shorts_validation_1.createShortSchema.parse(req.body);
        const short = await shorts_service_1.ShortsService.createShort({ userId: req.userId, ...data });
        res.status(201).json(short);
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
// POST /api/v1/shorts/:id/like — toggle like
router.post('/:id/like', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await shorts_service_1.ShortsService.toggleLike(req.userId, String(req.params.id));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/v1/shorts/:id/like — alias (same toggle logic)
router.delete('/:id/like', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await shorts_service_1.ShortsService.toggleLike(req.userId, String(req.params.id));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/shorts/:id/comment
router.post('/:id/comment', auth_1.authMiddleware, async (req, res) => {
    try {
        const { text } = shorts_validation_1.addCommentSchema.parse(req.body);
        const comment = await shorts_service_1.ShortsService.addComment(req.userId, String(req.params.id), text);
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
// GET /api/v1/shorts/:id/comments
router.get('/:id/comments', async (req, res) => {
    try {
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const limit = req.query.limit ? parseInt(req.query.limit) : 20;
        const result = await shorts_service_1.ShortsService.getComments(String(req.params.id), cursor, limit);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/shorts/:id/view — increment view counter (fire-and-forget)
router.post('/:id/view', async (req, res) => {
    shorts_service_1.ShortsService.incrementView(String(req.params.id));
    res.status(204).send();
});
// GET /api/v1/shorts/collections/:userId
router.get('/collections/:userId', async (req, res) => {
    try {
        const collections = await shorts_service_1.ShortsService.getCollections(String(req.params.userId));
        res.status(200).json(collections);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/shorts/collections
router.post('/collections', auth_1.authMiddleware, async (req, res) => {
    try {
        const { name } = shorts_validation_1.createCollectionSchema.parse(req.body);
        const collection = await shorts_service_1.ShortsService.createCollection(req.userId, name);
        res.status(201).json(collection);
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
//# sourceMappingURL=shorts.routes.js.map