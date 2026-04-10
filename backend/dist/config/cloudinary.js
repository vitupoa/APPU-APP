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
};
/**
 * Generate signed upload params for client-side direct upload.
 * Enforces folder routing — client cannot choose arbitrary folders.
 */
function generateUploadSignature(folder) {
    const timestamp = Math.round(Date.now() / 1000);
    const params = {
        timestamp,
        folder,
        upload_preset: 'krieta_signed',
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