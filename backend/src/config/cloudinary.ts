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
  PROFILE_IMAGES: 'Krieta/profile/Images',
  PROFILE_VIDEOS: 'Krieta/profile/Videos',
  // Shorts
  SHORTS_VIDEOS: 'Krieta/shorts/Videos',
  SHORTS_IMAGES: 'Krieta/shorts/Images',
  // Contests
  CONTESTS_IMAGES: 'Krieta/contests/Images',
  CONTESTS_VIDEOS: 'Krieta/contests/Videos',
  // Feed
  DRIPS_IMAGES: 'Krieta/drips/Images',
  // Shop
  SHOP_IMAGES: 'Krieta/shop/Images',
  // Chat
  CHAT_IMAGES: 'Krieta/chat/Images',
  CHAT_VIDEOS: 'Krieta/chat/Videos',
  CHAT_AUDIO: 'Krieta/chat/Audio',
} as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

/**
 * Generate signed upload params for client-side direct upload.
 * Enforces folder routing — client cannot choose arbitrary folders.
 * 
 * Direct signed upload (no upload_preset):
 * - Sign: timestamp + folder
 * - Send: api_key, timestamp, signature, folder, file
 * 
 * NOTE: upload_preset is NOT used because sending it causes Cloudinary
 * to treat the request as unsigned regardless of signature presence.
 * Instead, folder is sent directly as a signed parameter.
 * 
 * Cloudinary excludes from signature: file, cloud_name, resource_type, type, api_key.
 * Parameters are sorted alphabetically by api_sign_request.
 * 
 * @param folder - The Cloudinary folder path (signed and sent to Cloudinary)
 * @param resourceType - The type of resource being uploaded ('image', 'video', or 'raw')
 */
export function generateUploadSignature(
  folder: CloudinaryFolder,
  resourceType: 'image' | 'video' | 'raw' = 'image'
) {
  const timestamp = Math.round(Date.now() / 1000);

  // Sign timestamp + folder. Do NOT include upload_preset.
  const paramsToSign = { 
    timestamp,
    folder,
  };
  
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

export { cloudinary };
