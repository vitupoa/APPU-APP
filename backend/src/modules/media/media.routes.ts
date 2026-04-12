import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { generateUploadSignature, validateUploadFolder, CloudinaryFolder } from '../../config/cloudinary';
import { z } from 'zod';

const router = Router();

const signatureSchema = z.object({
  folder: z.string().min(1)
});

// GET /api/v1/media/upload-signature
router.get('/upload-signature', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { folder } = signatureSchema.parse(req.query);
    const signatureData = generateUploadSignature(folder as CloudinaryFolder);
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
