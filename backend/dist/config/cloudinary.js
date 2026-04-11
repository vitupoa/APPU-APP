"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.CLOUDINARY_FOLDERS = void 0;
exports.generateUploadSignature = generateUploadSignature;
exports.validateUploadFolder = validateUploadFolder;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const env_1 = require("./env");
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME,
    api_key: env_1.env.CLOUDINARY_API_KEY,
    api_secret: env_1.env.CLOUDINARY_API_SECRET,
    secure: true,
});
exports.CLOUDINARY_FOLDERS = {
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
};
/**
 * Generate signed upload params for client-side direct upload.
 * Enforces folder routing — client cannot choose arbitrary folders.
 */
function generateUploadSignature(folder) {
    const timestamp = Math.round(Date.now() / 1000);
    // Eager optimizations offloading thumbnails to Cloudinary Infrastructure asynchronously
    const eagerTransformations = folder.includes('Videos')
        ? 'c_fill,h_400,w_400,f_auto,so_0'
        : 'c_fill,w_400,h_400,f_auto';
    const params = {
        timestamp,
        folder,
        upload_preset: 'krieta_signed',
        eager: eagerTransformations,
        eager_async: true,
    };
    const signature = cloudinary_1.v2.utils.api_sign_request(params, env_1.env.CLOUDINARY_API_SECRET);
    return {
        signature,
        timestamp,
        folder,
        apiKey: env_1.env.CLOUDINARY_API_KEY,
        cloudName: env_1.env.CLOUDINARY_CLOUD_NAME,
    };
}
/**
 * Validate that an uploaded resource is in the expected folder.
 * Called in webhooks to reject uploads to wrong folders.
 */
function validateUploadFolder(publicId, expectedFolder) {
    return publicId.startsWith(expectedFolder);
}
//# sourceMappingURL=cloudinary.js.map