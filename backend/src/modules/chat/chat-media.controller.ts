import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { generateUploadSignature, CLOUDINARY_FOLDERS } from '../../config/cloudinary.js';
import { validateMediaUrl, validateExternalLink } from '../../utils/media-validator.js';
import { prisma } from '../../config/database.js';

export class ChatMediaController {
  /**
   * Generate signed upload parameters for chat media
   * POST /api/v1/chat/:chatId/media/signature
   */
  static async getUploadSignature(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const chatId = String(req.params.chatId);
      const { mediaType, resourceType } = req.body;

      // Verify user is participant in chat
      const participant = await prisma.chatParticipant.findUnique({
        where: { chatId_userId: { chatId, userId } },
      });

      if (!participant) {
        res.status(403).json({ 
          success: false, 
          error: 'Not authorized to upload media in this chat' 
        });
        return;
      }

      // Get chat type to determine folder
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        select: { type: true },
      });

      if (!chat) {
        res.status(404).json({ success: false, error: 'Chat not found' });
        return;
      }

      // Determine Cloudinary folder based on chat type and media type
      let folder: string;
      
      if (chat.type === 'DIRECT') {
        folder = resourceType === 'video' 
          ? CLOUDINARY_FOLDERS.CHAT_DIRECT_VIDEOS 
          : CLOUDINARY_FOLDERS.CHAT_DIRECT_IMAGES;
      } else if (chat.type === 'GROUP') {
        folder = resourceType === 'video'
          ? CLOUDINARY_FOLDERS.CHAT_GROUP_VIDEOS
          : CLOUDINARY_FOLDERS.CHAT_GROUP_IMAGES;
      } else {
        // CHAMA type
        folder = resourceType === 'video'
          ? CLOUDINARY_FOLDERS.CHAT_CHAMA_VIDEOS
          : CLOUDINARY_FOLDERS.CHAT_CHAMA_IMAGES;
      }

      // Generate signed upload parameters
      const uploadParams = generateUploadSignature(
        folder as any,
        resourceType === 'video' ? 'video' : 'image'
      );

      res.json({
        success: true,
        uploadParams,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate uploaded media URL before sending message
   * POST /api/v1/chat/media/validate
   */
  static async validateMedia(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { mediaUrl, mediaType } = req.body;

      // Validate media URL
      const validation = validateMediaUrl(mediaUrl);

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: validation.error,
        });
        return;
      }

      // Additional validation: Check if URL is from allowed Cloudinary folders
      const allowedFolders = [
        CLOUDINARY_FOLDERS.CHAT_DIRECT_IMAGES,
        CLOUDINARY_FOLDERS.CHAT_DIRECT_VIDEOS,
        CLOUDINARY_FOLDERS.CHAT_GROUP_IMAGES,
        CLOUDINARY_FOLDERS.CHAT_GROUP_VIDEOS,
        CLOUDINARY_FOLDERS.CHAT_CHAMA_IMAGES,
        CLOUDINARY_FOLDERS.CHAT_CHAMA_VIDEOS,
      ];

      const isFromAllowedFolder = allowedFolders.some(folder => 
        mediaUrl.includes(folder.replace('Krieta/', ''))
      );

      if (!isFromAllowedFolder) {
        res.status(400).json({
          success: false,
          error: 'Media must be uploaded to chat folders',
        });
        return;
      }

      res.json({
        success: true,
        sanitizedUrl: validation.sanitizedUrl,
        mediaType,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate external link before sending
   * POST /api/v1/chat/link/validate
   */
  static async validateLink(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { url } = req.body;

      const validation = validateExternalLink(url);

      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: validation.error,
        });
        return;
      }

      res.json({
        success: true,
        sanitizedUrl: validation.sanitizedUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate signature for group avatar upload
   * POST /api/v1/chat/:chatId/avatar/signature
   */
  static async getAvatarUploadSignature(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const chatId = String(req.params.chatId);

      // Verify user is admin of the group
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { participants: true },
      });

      if (!chat || chat.type !== 'GROUP') {
        res.status(404).json({ success: false, error: 'Group not found' });
        return;
      }

      const participant = chat.participants.find(p => p.userId === userId);
      if (!participant || participant.role !== 'admin') {
        res.status(403).json({ 
          success: false, 
          error: 'Only admins can update group avatar' 
        });
        return;
      }

      // Generate signed upload parameters for group avatar
      const uploadParams = generateUploadSignature(
        CLOUDINARY_FOLDERS.CHAT_GROUP_AVATAR_IMAGES,
        'image'
      );

      res.json({
        success: true,
        uploadParams,
      });
    } catch (error) {
      next(error);
    }
  }
}
