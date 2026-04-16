"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const cloudinary_1 = require("../../config/cloudinary");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const signatureSchema = zod_1.z.object({
    folder: zod_1.z.string().min(1),
    resourceType: zod_1.z.enum(['image', 'video', 'raw']).optional()
});
// GET /api/v1/media/upload-signature
router.get('/upload-signature', auth_1.authMiddleware, (req, res) => {
    try {
        const { folder, resourceType } = signatureSchema.parse(req.query);
        // Diagnostic logging for signature generation
        console.log(`[Cloudinary Signature] Generating signature for folder: ${folder}, resourceType: ${resourceType || 'image'}`);
        const signatureData = (0, cloudinary_1.generateUploadSignature)(folder, resourceType);
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
exports.default = router;
//# sourceMappingURL=media.routes.js.map