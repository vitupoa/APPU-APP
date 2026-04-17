import { v2 as cloudinary } from 'cloudinary';
export declare const CLOUDINARY_FOLDERS: {
    readonly PROFILE_IMAGES: "Krieta/profile/Images";
    readonly PROFILE_VIDEOS: "Krieta/profile/Videos";
    readonly SHORTS_VIDEOS: "Krieta/shorts/Videos";
    readonly SHORTS_IMAGES: "Krieta/shorts/Images";
    readonly CONTESTS_IMAGES: "Krieta/contests/Images";
    readonly CONTESTS_VIDEOS: "Krieta/contests/Videos";
    readonly DRIPS_IMAGES: "Krieta/drips/Images";
    readonly SHOP_IMAGES: "Krieta/shop/Images";
    readonly CHAT_IMAGES: "Krieta/chat/Images";
    readonly CHAT_VIDEOS: "Krieta/chat/Videos";
    readonly CHAT_AUDIO: "Krieta/chat/Audio";
};
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
export declare function generateUploadSignature(folder: CloudinaryFolder, resourceType?: 'image' | 'video' | 'raw'): {
    signature: string;
    timestamp: number;
    resourceType: "image" | "video" | "raw";
    apiKey: string;
    cloudName: string;
    uploadPreset: string;
};
/**
 * Validate that an uploaded resource is in the expected folder.
 * Called in webhooks to reject uploads to wrong folders.
 */
export declare function validateUploadFolder(publicId: string, expectedFolder: CloudinaryFolder): boolean;
export { cloudinary };
//# sourceMappingURL=cloudinary.d.ts.map