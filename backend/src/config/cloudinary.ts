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
 * For signed uploads with upload preset:
 * - The signature includes: timestamp, upload_preset
 * - The folder is configured in the Cloudinary upload preset settings
 * - DO NOT include folder in the signature or upload request
 * 
 * IMPORTANT: Cloudinary excludes these params from signature verification:
 * file, cloud_name, resource_type, type, api_key.
 * 
 * Parameters are automatically sorted alphabetically by api_sign_request.
 * 
 * @param folder - The Cloudinary folder path (returned for reference, not used in signature)
 * @param resourceType - The type of resource being uploaded ('image', 'video', or 'raw')
 */
export function generateUploadSignature(
  folder: CloudinaryFolder,
  resourceType: 'image' | 'video' | 'raw' = 'image'
) {
  const timestamp = Math.round(Date.now() / 1000);
  const uploadPreset = 'Krieta'; // Signed upload preset name

  // For signed upload presets: ONLY sign timestamp and upload_preset
  // The folder should be configured in the Cloudinary preset settings
  const paramsToSign = { 
    timestamp,
    upload_preset: uploadPreset,
  };
  
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    uploadPreset,
    folder, // Returned for reference only, should NOT be sent to Cloudinary
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
