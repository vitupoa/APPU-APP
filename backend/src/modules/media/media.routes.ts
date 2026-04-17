import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { generateUploadSignature, validateUploadFolder, CloudinaryFolder } from '../../config/cloudinary.js';
import { z } from 'zod';

const router = Router();

const signatureSchema = z.object({
  folder: z.string().min(1),
  resourceType: z.enum(['image', 'video', 'raw']).optional()
});

// GET /api/v1/media/upload-signature
router.get('/upload-signature', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { folder, resourceType } = signatureSchema.parse(req.query);
    
    // Diagnostic logging for signature generation
    console.log(`[Cloudinary Signature] Generating signature for folder: ${folder}, resourceType: ${resourceType || 'image'}`);
    
    const signatureData = generateUploadSignature(
      folder as CloudinaryFolder,
      resourceType as 'image' | 'video' | 'raw' | undefined
    );
    
    console.log(`[Cloudinary Signature] Generated signature with timestamp: ${signatureData.timestamp}`);
    
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
