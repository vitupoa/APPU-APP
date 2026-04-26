import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { CallController } from './calls.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/initiate', CallController.initiateCall);
router.post('/:callId/answer', CallController.answerCall);
router.post('/:callId/decline', CallController.declineCall);
router.post('/:callId/end', CallController.endCall);
router.get('/history/:chatId', CallController.getCallHistory);

export default router;
