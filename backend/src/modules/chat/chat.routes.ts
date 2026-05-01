import { Router } from 'express';
import { authMiddleware as requireAuth } from '../../middleware/auth.js';
import { ChatController } from './chat.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createDirectChatSchema, createGroupChatSchema, sendMessageSchema, updateGroupChatSchema, manageMemberSchema, transferOwnershipSchema } from './chat.validation.js';

const router = Router();

// All chat routes require authentication
router.use(requireAuth);

router.get('/', ChatController.getChats);
router.post('/direct', validateRequest(createDirectChatSchema), ChatController.createDirectChat);
router.post('/group', validateRequest(createGroupChatSchema), ChatController.createGroupChat);

router.get('/:chatId/messages', ChatController.getMessages);
router.post('/:chatId/messages', validateRequest(sendMessageSchema), ChatController.sendMessage);
router.post('/:chatId/tip', ChatController.sendTip);
router.put('/:chatId', validateRequest(updateGroupChatSchema), ChatController.updateGroupChat);
router.post('/:chatId/manage-member', validateRequest(manageMemberSchema), ChatController.manageMember);
router.post('/:chatId/transfer-ownership', validateRequest(transferOwnershipSchema), ChatController.transferOwnership);
router.post('/:chatId/leave', ChatController.leaveGroup);

export default router;
