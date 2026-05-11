import { Router } from 'express';
import { authMiddleware as requireAuth } from '../../middleware/auth.js';
import { ChatController } from './chat.controller.js';
import { ChatMediaController } from './chat-media.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { createDirectChatSchema, createGroupChatSchema, sendMessageSchema, updateGroupChatSchema, manageMemberSchema, transferOwnershipSchema, mediaUploadSignatureSchema, validateMediaSchema, validateLinkSchema } from './chat.validation.js';

const router = Router();

// All chat routes require authentication
router.use(requireAuth);

router.get('/', ChatController.getChats);
router.post('/direct', validateRequest(createDirectChatSchema), ChatController.createDirectChat);
router.post('/group', validateRequest(createGroupChatSchema), ChatController.createGroupChat);

router.get('/:chatId/messages', ChatController.getMessages);
router.post('/:chatId/messages', validateRequest(sendMessageSchema), ChatController.sendMessage);

// Media upload routes
router.post('/:chatId/media/signature', validateRequest(mediaUploadSignatureSchema), ChatMediaController.getUploadSignature);
router.post('/media/validate', validateRequest(validateMediaSchema), ChatMediaController.validateMedia);
router.post('/link/validate', validateRequest(validateLinkSchema), ChatMediaController.validateLink);
router.post('/:chatId/avatar/signature', ChatMediaController.getAvatarUploadSignature);
router.post('/:chatId/mark-read', ChatController.markAsRead);
router.post('/:chatId/typing', ChatController.sendTypingIndicator);
router.delete('/messages/:messageId', ChatController.deleteMessage);
router.post('/messages/:messageId/forward', ChatController.forwardMessage);
router.post('/:chatId/tip', ChatController.sendTip);
router.put('/:chatId', validateRequest(updateGroupChatSchema), ChatController.updateGroupChat);
router.post('/:chatId/manage-member', validateRequest(manageMemberSchema), ChatController.manageMember);
router.post('/:chatId/transfer-ownership', validateRequest(transferOwnershipSchema), ChatController.transferOwnership);
router.post('/:chatId/leave', ChatController.leaveGroup);

export default router;
