"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const user_service_1 = require("./user.service");
const subscription_service_1 = require("./subscription.service");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const updateProfileSchema = zod_1.z.object({
    firstName: zod_1.z.string().min(2).max(50).optional(),
    lastName: zod_1.z.string().min(2).max(50).optional(),
    displayName: zod_1.z.string().min(2).max(100).optional(),
    username: zod_1.z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
    bio: zod_1.z.string().max(300).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    coverPhotoUrl: zod_1.z.string().url().optional()
});
const bioLinksSchema = zod_1.z.array(zod_1.z.object({
    label: zod_1.z.string().min(1).max(30),
    url: zod_1.z.string().url(),
    icon: zod_1.z.string().optional()
})).max(5);
const updateTiersSchema = zod_1.z.array(zod_1.z.object({
    tier: zod_1.z.enum(['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN']),
    krAmount: zod_1.z.number().positive(),
    benefits: zod_1.z.string().min(1).max(500),
    isEnabled: zod_1.z.boolean()
})).min(1).max(4);
const subscribeSchema = zod_1.z.object({
    tier: zod_1.z.enum(['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN'])
});
// ─── PROFILE ──────────────────────────────────────
// GET /api/v1/users/me
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const profile = await user_service_1.UserService.getProfile(req.userId, req.userId);
        res.status(200).json(profile);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT /api/v1/users/me
router.put('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = updateProfileSchema.parse(req.body);
        const updated = await user_service_1.UserService.updateProfile(req.userId, data);
        res.status(200).json(updated);
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
// PUT /api/v1/users/me/bio-links
router.put('/me/bio-links', auth_1.authMiddleware, async (req, res) => {
    try {
        const links = bioLinksSchema.parse(req.body);
        const result = await user_service_1.UserService.updateBioLinks(req.userId, links);
        res.status(200).json(result);
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
// GET /api/v1/users/:id
router.get('/:id', auth_1.optionalAuth, async (req, res) => {
    try {
        const profile = await user_service_1.UserService.getProfile(String(req.params.id), req.userId);
        res.status(200).json(profile);
    }
    catch (error) {
        res.status(404).json({ error: 'User not found' });
    }
});
// ─── ADMIRE / LOVER ───────────────────────────────
// POST /api/v1/users/:id/admire
router.post('/:id/admire', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await user_service_1.UserService.admire(req.userId, String(req.params.id));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// DELETE /api/v1/users/:id/admire
router.delete('/:id/admire', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await user_service_1.UserService.unadmire(req.userId, String(req.params.id));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// GET /api/v1/users/:id/admirers
router.get('/:id/admirers', async (req, res) => {
    try {
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const result = await user_service_1.UserService.getAdmirers(String(req.params.id), cursor);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/v1/users/:id/admiring
router.get('/:id/admiring', async (req, res) => {
    try {
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const result = await user_service_1.UserService.getAdmiring(String(req.params.id), cursor);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/v1/users/:id/lovers
router.get('/:id/lovers', async (req, res) => {
    try {
        const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
        const result = await user_service_1.UserService.getLovers(String(req.params.id), cursor);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── MILESTONES ───────────────────────────────────
// GET /api/v1/users/me/milestones
router.get('/me/milestones', auth_1.authMiddleware, async (req, res) => {
    try {
        const progress = await user_service_1.UserService.getUserMilestoneProgress(req.userId);
        res.status(200).json(progress);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/v1/milestones (mounted separately or here)
router.get('/milestones', async (_req, res) => {
    try {
        const milestones = await user_service_1.UserService.getMilestones();
        res.status(200).json(milestones);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ─── SUBSCRIPTIONS ────────────────────────────────
// GET /api/v1/users/me/subscription-tiers
router.get('/me/subscription-tiers', auth_1.authMiddleware, async (req, res) => {
    try {
        const tiers = await subscription_service_1.SubscriptionService.getCreatorTiers(req.userId);
        res.status(200).json(tiers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PUT /api/v1/users/me/subscription-tiers
router.put('/me/subscription-tiers', auth_1.authMiddleware, async (req, res) => {
    try {
        const tiers = updateTiersSchema.parse(req.body);
        const result = await subscription_service_1.SubscriptionService.updateTiers(req.userId, tiers);
        res.status(200).json(result);
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
// GET /api/v1/users/:id/subscription-tiers
router.get('/:id/subscription-tiers', async (req, res) => {
    try {
        const tiers = await subscription_service_1.SubscriptionService.getAvailableTiers(String(req.params.id));
        res.status(200).json(tiers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/v1/users/:id/subscribe
router.post('/:id/subscribe', auth_1.authMiddleware, async (req, res) => {
    try {
        const { tier } = subscribeSchema.parse(req.body);
        const subscription = await subscription_service_1.SubscriptionService.subscribe(req.userId, String(req.params.id), tier);
        res.status(200).json(subscription);
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
// DELETE /api/v1/users/:id/subscribe
router.delete('/:id/subscribe', auth_1.authMiddleware, async (req, res) => {
    try {
        const result = await subscription_service_1.SubscriptionService.unsubscribe(req.userId, String(req.params.id));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=user.routes.js.map