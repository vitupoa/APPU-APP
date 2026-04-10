import { v2 as cloudinary } from 'cloudinary';
export declare const CLOUDINARY_FOLDERS: {
    readonly PROFILE_PHOTO: "Krieta/profile/photo";
    readonly PROFILE_VIDEO: "Krieta/profile/video";
    readonly SHORTS_VIDEO: "Krieta/shorts/video";
    readonly SHORTS_PHOTO: "Krieta/shorts/photo";
    readonly CONTESTS_PHOTO: "Krieta/contests/photo";
    readonly CONTESTS_VIDEO: "Krieta/contests/video";
    readonly FEED_PHOTO: "Krieta/feed/photo";
    readonly SHOP_PHOTO: "Krieta/shop/photo";
    readonly CHAT_PHOTO: "Krieta/chat/photo";
    readonly CHAT_VIDEO: "Krieta/chat/video";
    readonly CHAT_AUDIO: "Krieta/chat/audio";
};
export type CloudinaryFolder = (typeof CLOUDINARY_FOLDERS)[keyof typeof CLOUDINARY_FOLDERS];
/**
 * Generate signed upload params for client-side direct upload.
 * Enforces folder routing — client cannot choose arbitrary folders.
 */
export declare function generateUploadSignature(folder: CloudinaryFolder): {
    signature: string;
    timestamp: number;
    folder: CloudinaryFolder;
    apiKey: string;
    cloudName: string;
};
/**
 * Validate that an uploaded resource is in the expected folder.
 * Called in webhooks to reject uploads to wrong folders.
 */
export declare function validateUploadFolder(publicId: string, expectedFolder: CloudinaryFolder): boolean;
export { cloudinary };
//# sourceMappingURL=cloudinary.d.ts.map