import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

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
  FEED_IMAGES: 'Krieta/feed/Images',
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
 */
export function generateUploadSignature(folder: CloudinaryFolder) {
  const timestamp = Math.round(Date.now() / 1000);
  
  // Eager optimizations offloading thumbnails to Cloudinary Infrastructure asynchronously
  const eagerTransformations = folder.includes('Videos') 
    ? 'c_fill,h_400,w_400,f_auto,so_0' 
    : 'c_fill,w_400,h_400,f_auto';

  const params = {
    timestamp,
    folder,
    eager: eagerTransformations,
    eager_async: true,
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    env.CLOUDINARY_API_SECRET
  );

  return {
    signature,
    timestamp,
    folder,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    eager: eagerTransformations,
    eagerAsync: true,
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
