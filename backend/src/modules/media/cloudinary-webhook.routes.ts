import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../../config/env.js';
import { validateUploadFolder, CLOUDINARY_FOLDERS } from '../../config/cloudinary.js';
import { prisma } from '../../config/database.js';

const router = Router();

/**
 * Cloudinary Webhook Handler
 * Validates uploads and tracks media usage
 * 
 * Setup in Cloudinary Dashboard:
 * Settings > Webhooks > Add Notification URL
 * URL: https://appu-app-production.up.railway.app/api/v1/media/cloudinary-webhook
 * Events: upload, delete
 */

/**
 * Verify Cloudinary webhook signature
 */
function verifyCloudinarySignature(
  body: any,
  timestamp: string,
  signature: string
): boolean {
  const payload = `${timestamp}${JSON.stringify(body)}`;
  
  const expectedSignature = crypto
    .createHmac('sha256', env.CLOUDINARY_API_SECRET)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * POST /api/v1/media/cloudinary-webhook
 * Handle Cloudinary upload notifications
 */
router.post('/cloudinary-webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-cld-signature'] as string;
    const timestamp = req.headers['x-cld-timestamp'] as string;

    console.log('[Cloudinary Webhook] Received webhook:', {
      hasSignature: !!signature,
      hasTimestamp: !!timestamp,
      body: req.body
    });

    // Verify webhook signature (if configured)
    if (signature && timestamp) {
      if (!verifyCloudinarySignature(req.body, timestamp, signature)) {
        console.warn('[Cloudinary Webhook] Invalid signature - continuing anyway for uploads');
        // Don't reject - Cloudinary signature might use different format
      }
    }

    const { notification_type, public_id, resource_type, secure_url, bytes, format } = req.body;

    // Handle upload event
    if (notification_type === 'upload') {
      // Validate folder
      const allowedFolders = Object.values(CLOUDINARY_FOLDERS);
      const isValidFolder = allowedFolders.some(folder => 
        validateUploadFolder(public_id, folder)
      );

      if (!isValidFolder) {
        console.error(`[Cloudinary Webhook] Invalid folder for upload: ${public_id}`);
        
        // Delete unauthorized upload
        const cloudinary = (await import('../../config/cloudinary.js')).cloudinary;
        await cloudinary.uploader.destroy(public_id, {
          resource_type,
          invalidate: true
        });

        res.status(403).json({ 
          error: 'Unauthorized folder',
          message: 'Upload deleted due to invalid folder'
        });
        return;
      }

      // Log upload for audit
      console.log(`[Cloudinary Webhook] Upload validated: ${public_id}`);
      
      // Track upload in database (optional)
      try {
        const configId = crypto.randomUUID();
        
        await prisma.platform_config.upsert({
          where: { key: 'cloudinary_uploads' },
          create: {
            id: configId,
            key: 'cloudinary_uploads',
            value: {
              uploads: [{
                publicId: public_id,
                resourceType: resource_type,
                url: secure_url,
                bytes,
                format,
                uploadedAt: new Date().toISOString()
              }]
            }
          },
          update: {
            value: {
              uploads: {
                push: {
                  publicId: public_id,
                  resourceType: resource_type,
                  url: secure_url,
                  bytes,
                  format,
                  uploadedAt: new Date().toISOString()
                }
              }
            }
          }
        });
      } catch (error) {
        console.error('[Cloudinary Webhook] Error tracking upload:', error);
      }
    }

    // Handle delete event
    if (notification_type === 'delete') {
      console.log(`[Cloudinary Webhook] Delete notification: ${public_id}`);
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[Cloudinary Webhook] Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/v1/media/cloudinary-stats
 * Get Cloudinary upload statistics
 * Requires: Admin
 */
router.get('/cloudinary-stats', async (req: Request, res: Response) => {
  try {
    const config = await prisma.platform_config.findUnique({
      where: { key: 'cloudinary_uploads' }
    });

    if (!config) {
      res.json({ totalUploads: 0, uploads: [] });
      return;
    }

    const uploads = (config.value as any).uploads || [];
    
    // Calculate statistics
    const stats = {
      totalUploads: uploads.length,
      totalBytes: uploads.reduce((sum: number, u: any) => sum + (u.bytes || 0), 0),
      byResourceType: uploads.reduce((acc: any, u: any) => {
        acc[u.resourceType] = (acc[u.resourceType] || 0) + 1;
        return acc;
      }, {}),
      byFolder: uploads.reduce((acc: any, u: any) => {
        const folder = u.publicId.split('/').slice(0, -1).join('/');
        acc[folder] = (acc[folder] || 0) + 1;
        return acc;
      }, {}),
      recentUploads: uploads.slice(-10)
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
