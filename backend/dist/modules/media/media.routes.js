import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { generateUploadSignature } from '../../config/cloudinary.js';
import { z } from 'zod';
const router = Router();
const signatureSchema = z.object({
    folder: z.string().min(1),
    resourceType: z.enum(['image', 'video', 'raw']).optional()
});
// GET /api/v1/media/upload-signature
router.get('/upload-signature', authMiddleware, (req, res) => {
    try {
        const { folder, resourceType } = signatureSchema.parse(req.query);
        // Diagnostic logging for signature generation
        console.log(`[Cloudinary Signature] Generating signature for folder: ${folder}, resourceType: ${resourceType || 'image'}`);
        const signatureData = generateUploadSignature(folder, resourceType);
        console.log(`[Cloudinary Signature] Generated signature with timestamp: ${signatureData.timestamp}`);
        res.status(200).json(signatureData);
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        else {
            res.status(500).json({ error: error.message });
        }
    }
});
export default router;
//# sourceMappingURL=media.routes.js.map