import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { generateUploadSignature, validateUploadFolder, CloudinaryFolder, CLOUDINARY_FOLDERS } from '../../config/cloudinary.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for upload signature requests (prevent abuse)
const uploadSignatureLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 signature requests per 15 minutes
  message: { error: 'Too many upload signature requests' },
  validate: { trustProxy: false },
});

const signatureSchema = z.object({
  folder: z.enum([
    'Runinga/Profile/Images',
    'Runinga/Profile/Videos',
    'Runinga/Shorts/Videos',
    'Runinga/Shorts/Images',
    'Runinga/Contests/Images',
    'Runinga/Contests/Videos',
    'Runinga/Drips/Images',
    'Runinga/Shop/Images',
    'Runinga/Chats/Direct/Images',
    'Runinga/Chats/Direct/Videos',
    'Runinga/Chats/Group/Images',
    'Runinga/Chats/Group/Videos',
    'Runinga/Chats/Chama/Images',
    'Runinga/Chats/Chama/Videos',
    'Runinga/Chats/GroupAvatar/Images',
    'Runinga/Stories/Images',
    'Runinga/Stories/Videos',
  ]),
  resourceType: z.enum(['image', 'video', 'raw']).optional()
});

/**
 * GET /api/v1/media/upload-signature
 * Generate signed upload parameters for Cloudinary
 * Requires: Authentication
 * Rate Limited: 50 requests per 15 minutes
 */
router.get('/upload-signature', 
  authMiddleware, 
  uploadSignatureLimiter,
  (req: AuthRequest, res: Response) => {
  try {
    const { folder, resourceType } = signatureSchema.parse(req.query);
    
    // Validate folder is in allowed list
    const allowedFolders = Object.values(CLOUDINARY_FOLDERS);
    if (!allowedFolders.includes(folder as CloudinaryFolder)) {
      res.status(400).json({ 
        error: 'Invalid folder',
        message: 'Folder must be one of the predefined Cloudinary folders'
      });
      return;
    }
    
    const signatureData = generateUploadSignature(
      folder as CloudinaryFolder,
      resourceType as 'image' | 'video' | 'raw' | undefined
    );
    
    // Log signature generation for audit
    res.status(200).json(signatureData);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

export default router;
