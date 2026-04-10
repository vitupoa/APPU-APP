import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const CLOUDINARY_FOLDERS = {
  PROFILE_PHOTO: 'Krieta/profile/photo',
  PROFILE_VIDEO: 'Krieta/profile/video',
  SHORTS_VIDEO: 'Krieta/shorts/video',
  SHORTS_PHOTO: 'Krieta/shorts/photo',
  CONTESTS_PHOTO: 'Krieta/contests/photo',
  CONTESTS_VIDEO: 'Krieta/contests/video',
  FEED_PHOTO: 'Krieta/feed/photo',
  SHOP_PHOTO: 'Krieta/shop/photo',
  CHAT_PHOTO: 'Krieta/chat/photo',
  CHAT_VIDEO: 'Krieta/chat/video',
  CHAT_AUDIO: 'Krieta/chat/audio',
} as const;

export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];

/**
 * Generate signed upload params for client-side direct upload.
 * Enforces folder routing — client cannot choose arbitrary folders.
 */
export function generateUploadSignature(folder: CloudinaryFolder) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    upload_preset: 'krieta_signed',
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
