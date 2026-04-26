import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { LiveController } from './live.controller.js';

const router = Router();

// All live routes require auth
router.use(authMiddleware);

// Stream lifecycle
router.post('/start', LiveController.startStream);
router.post('/:streamId/end', LiveController.endStream);

// Discovery
router.get('/active', LiveController.getActiveStreams);
router.get('/:streamId', LiveController.getStream);

// Engagement
router.post('/:streamId/tip', LiveController.sendTip);
router.post('/:streamId/like', LiveController.sendLikes);
router.get('/:streamId/leaderboard', LiveController.getLeaderboard);

// Commerce
router.post('/:streamId/pin-product', LiveController.pinProduct);
router.delete('/:streamId/pin-product/:productId', LiveController.unpinProduct);

// Gift Goals
router.post('/:streamId/gift-goal', LiveController.setGiftGoal);

// Moderation
router.post('/:streamId/ban', LiveController.banViewer);
router.post('/:streamId/mute', LiveController.muteViewer);

// Battles
router.post('/:streamId/battle/start', LiveController.startBattle);
router.post('/battle/:battleId/accept', LiveController.acceptBattle);

// Co-hosting
router.post('/:streamId/co-host/invite', LiveController.inviteCoHost);

export default router;
