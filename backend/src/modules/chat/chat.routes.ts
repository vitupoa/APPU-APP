import { Router } from 'express';
import { authMiddleware as requireAuth } from '../../middleware/auth.js';
import { ChatController } from './chat.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createDirectChatSchema, createGroupChatSchema, sendMessageSchema } from './chat.validation.js';

const router = Router();

// All chat routes require authentication
router.use(requireAuth);

router.get('/', ChatController.getChats);
router.post('/direct', validateRequest(createDirectChatSchema), ChatController.createDirectChat);
router.post('/group', validateRequest(createGroupChatSchema), ChatController.createGroupChat);

router.get('/:chatId/messages', ChatController.getMessages);
router.post('/:chatId/messages', validateRequest(sendMessageSchema), ChatController.sendMessage);

export default router;
