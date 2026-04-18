import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// For signed upload presets, all uploads go to the folder configured in the preset
// In this case: Krieta/uploads
// We keep these constants for reference, but they all point to the same folder
export const CLOUDINARY_FOLDERS = {
  // All uploads go to Krieta/uploads (configured in the preset)
  PROFILE_IMAGES: 'Krieta/uploads',
  PROFILE_VIDEOS: 'Krieta/uploads',
  SHORTS_VIDEOS: 'Krieta/uploads',
  SHORTS_IMAGES: 'Krieta/uploads',
  CONTESTS_IMAGES: 'Krieta/uploads',
  CONTESTS_VIDEOS: 'Krieta/uploads',
  DRIPS_IMAGES: 'Krieta/uploads',
  SHOP_IMAGES: 'Krieta/uploads',
  CHAT_IMAGES: 'Krieta/uploads',
  CHAT_VIDEOS: 'Krieta/uploads',
  CHAT_AUDIO: 'Krieta/uploads',
} as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

/**
 * Generate signed upload params for client-side direct upload.
 * Enforces folder routing — client cannot choose arbitrary folders.
 * 
 * IMPORTANT: Cloudinary excludes these params from signature verification:
 * file, cloud_name, resource_type, type, api_key.
 * Only sign parameters that Cloudinary actually verifies (timestamp, folder, etc.).
 * resource_type is conveyed via the URL path, NOT the signature.
 * 
 * @param folder - The Cloudinary folder path for organizing uploads
 * @param resourceType - The type of resource being uploaded ('image', 'video', or 'raw')
 */
export function generateUploadSignature(
  folder: CloudinaryFolder,
  resourceType: 'image' | 'video' | 'raw' = 'image'
) {
  const timestamp = Math.round(Date.now() / 1000);
  const uploadPreset = 'Krieta'; // Signed upload preset name

  // For signed upload presets: sign timestamp and upload_preset
  // The folder is controlled by the preset itself (Krieta/uploads), not by the signature
  // IMPORTANT: Use snake_case (upload_preset) not camelCase for Cloudinary API
  const paramsToSign = { 
    timestamp,
    upload_preset: uploadPreset,
  };
  
  console.log('[Cloudinary] Params being signed:', JSON.stringify(paramsToSign, null, 2));
  console.log('[Cloudinary] API Secret length:', env.CLOUDINARY_API_SECRET?.length || 0, 'characters');
  console.log('[Cloudinary] API Secret starts with:', env.CLOUDINARY_API_SECRET?.substring(0, 4) + '...');
  
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET
  );
  
  console.log('[Cloudinary] Generated signature:', signature);

  return {
    signature,
    timestamp,
    uploadPreset,
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
