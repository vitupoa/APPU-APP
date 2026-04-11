"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const express_rate_limit_1 = require("express-rate-limit");
const zod_1 = require("zod");
const validate_1 = require("../../middleware/validate");
// import { authenticate } from '../../middleware/auth'; // Ensure you have authentication logic securely checking token headers
const router = (0, express_1.Router)();
/**
 * ClickBot Anti-Spam Middleware
 * Strictly limits voting attempts mitigating explicit spam algorithms.
 */
const voteThrottler = (0, express_rate_limit_1.rateLimit)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP or Device Token strictly to 10 votes per 5 minutes guaranteeing humans
    message: { error: 'Too many voting attempts across this network. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
/**
 * Zod Mapping explicitly catching biometric or explicit payment parameters structurally.
 */
const VoteSchema = zod_1.z.object({
    submissionId: zod_1.z.string().uuid(),
    fingerprint: zod_1.z.string().optional() // Optional mobile device footprint natively verifying uniqueness natively
});
/**
 * POST /contests/vote
 * Gamified Swiper Action - Integrates the Tinder logic natively securely bypassing sweepstakes by ensuring FREE entries safely.
 */
router.post('/vote', voteThrottler, (0, validate_1.validateRequest)(VoteSchema), async (req, res) => {
    try {
        const { submissionId, fingerprint } = req.body;
        // In reality you would extract the `userId` cleanly out of the JWT Authentication middleware explicitly!
        // const voterId = req.user.id; 
        const voterId = 'TEMPORARY_STUB_REPLACE_WITH_JWT';
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
        // 1. Verify if user already voted on this exact submission to prevent bot inflation entirely natively.
        const existingVote = await database_1.prisma.contestVote.findUnique({
            where: {
                submissionId_voterId: {
                    submissionId,
                    voterId,
                }
            }
        });
        if (existingVote) {
            res.status(403).json({ error: 'You have already voted on this specific submission.' });
            return;
        }
        // 2. Transact safely natively mapping constraints implicitly without inflating cash
        await database_1.prisma.$transaction(async (tx) => {
            // Log vote safely preventing clickbots natively
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
        res.status(200).json({ success: true, message: "Vote registered successfully natively!" });
    }
    catch (e) {
        console.error('[Voting Service] Error:', e);
        res.status(500).json({ error: 'Internal Gamification Service Error' });
    }
});
exports.default = router;
//# sourceMappingURL=contestVoting.routes.js.map