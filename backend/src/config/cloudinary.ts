import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Folder structure for organizing uploads by module
export const CLOUDINARY_FOLDERS = {
  // Profiles
  PROFILE_IMAGES: 'Krieta/Profile/Images',
  PROFILE_VIDEOS: 'Krieta/Profile/Videos',
  // Shorts (TikTok-like - permanent)
  SHORTS_VIDEOS: 'Krieta/Shorts/Videos',
  SHORTS_IMAGES: 'Krieta/Shorts/Images',
  // Contests
  CONTESTS_IMAGES: 'Krieta/Contests/Images',
  CONTESTS_VIDEOS: 'Krieta/Contests/Videos',
  // Feed
  DRIPS_IMAGES: 'Krieta/Drips/Images',
  // Shop
  SHOP_IMAGES: 'Krieta/Shop/Images',
  // Chat - Direct
  CHAT_DIRECT_IMAGES: 'Krieta/Chats/Direct/Images',
  CHAT_DIRECT_VIDEOS: 'Krieta/Chats/Direct/Videos',
  // Chat - Normal Groups
  CHAT_GROUP_IMAGES: 'Krieta/Chats/Group/Images',
  CHAT_GROUP_VIDEOS: 'Krieta/Chats/Group/Videos',
  // Chat - Chama Groups
  CHAT_CHAMA_IMAGES: 'Krieta/Chats/Chama/Images',
  CHAT_CHAMA_VIDEOS: 'Krieta/Chats/Chama/Videos',
  // Chat - Group Avatars (both normal and chama)
  CHAT_GROUP_AVATAR_IMAGES: 'Krieta/Chats/GroupAvatar/Images',
  // Stories (WhatsApp-like status - 24h ephemeral)
  STORIES_IMAGES: 'Krieta/Stories/Images',
  STORIES_VIDEOS: 'Krieta/Stories/Videos',
} as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

/**
 * Generate signed upload params for client-side direct upload.
 * Enforces folder routing — client cannot choose arbitrary folders.
 * 
 * SECURITY: Uses signed uploads only (no upload_preset)
 * - Upload preset "Krieta" should be disabled in Cloudinary dashboard
 * - All uploads must go through this signed endpoint
 * - Folder is validated and signed
 * - Webhook validates uploads and deletes unauthorized ones
 * 
 * Direct signed upload:
 * - Sign: timestamp + folder
 * - Send: api_key, timestamp, signature, folder, file
 * 
 * NOTE: upload_preset is NOT used because it allows unsigned uploads.
 * Instead, folder is sent directly as a signed parameter.
 * 
 * Cloudinary excludes from signature: file, cloud_name, resource_type, type, api_key.
 * Parameters are sorted alphabetically by api_sign_request.
 * 
 * @param folder - The Cloudinary folder path (signed and sent to Cloudinary)
 * @param resourceType - The type of resource being uploaded ('image', 'video', or 'raw')
 * @param expiresInHours - Optional TTL for ephemeral content (stories)
 */
export function generateUploadSignature(
  folder: CloudinaryFolder,
  resourceType: 'image' | 'video' | 'raw' = 'image',
  expiresInHours?: number
) {
  const timestamp = Math.round(Date.now() / 1000);

  // Sign timestamp + folder. Do NOT include upload_preset.
  const paramsToSign: any = { 
    timestamp,
    folder,
  };
  
  // Add moderation and tags for ephemeral content
  if (expiresInHours) {
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    paramsToSign.tags = 'ephemeral,story';
    paramsToSign.context = `expires_at=${expiresAt.toISOString()}`;
  }
  
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    folder,
    resourceType,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    ...(expiresInHours && { 
      tags: paramsToSign.tags,
      context: paramsToSign.context 
    }),
  };
}

/**
 * Validate that an uploaded resource is in the expected folder.
 * Called in webhooks to reject uploads to wrong folders.
 */
export function validateUploadFolder(
  publicId: string,
  expectedFolder: CloudinaryFolder
): boolean {
  return publicId.startsWith(expectedFolder);
}

/**
 * Upload a file directly to Cloudinary with optional TTL for ephemeral content.
 * Used for server-side uploads (e.g., stories).
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer | string,
  folder: CloudinaryFolder,
  resourceType: 'image' | 'video' | 'raw' = 'image',
  expiresInHours?: number
) {
  const uploadOptions: any = {
    folder,
    resource_type: resourceType,
    quality: 'auto',
    fetch_format: 'auto',
  };

  // Add tags and context for ephemeral content
  if (expiresInHours) {
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    uploadOptions.tags = ['ephemeral', 'story'];
    uploadOptions.context = `expires_at=${expiresAt.toISOString()}`;
  }

  const uploadSource = Buffer.isBuffer(fileBuffer)
    ? `data:image/jpeg;base64,${fileBuffer.toString('base64')}`
    : fileBuffer;
  return cloudinary.uploader.upload(uploadSource, uploadOptions);
}

/**
 * Delete expired ephemeral content from Cloudinary.
 * Called by cron worker.
 */
export async function deleteExpiredMedia() {
  try {
    const now = new Date().toISOString();
    
    // Search for resources with ephemeral tag and expired context
    const result = await cloudinary.search
      .expression('tags=ephemeral')
      .with_field('context')
      .max_results(500)
      .execute();

    const expiredResources = result.resources.filter((resource: any) => {
      if (!resource.context?.custom?.expires_at) return false;
      return new Date(resource.context.custom.expires_at) < new Date();
    });

    if (expiredResources.length === 0) {
      return { deleted: 0, message: 'No expired resources found' };
    }

    // Delete expired resources
    const publicIds = expiredResources.map((r: any) => r.public_id);
    await cloudinary.api.delete_resources(publicIds, {
      resource_type: 'image',
      invalidate: true,
    });

    // Also delete videos
    await cloudinary.api.delete_resources(publicIds, {
      resource_type: 'video',
      invalidate: true,
    });

    return { 
      deleted: expiredResources.length, 
      publicIds,
      message: `Deleted ${expiredResources.length} expired resources` 
    };
  } catch (error: any) {
    console.error('Error deleting expired media:', error.message);
    throw error;
  }
}

export { cloudinary };
