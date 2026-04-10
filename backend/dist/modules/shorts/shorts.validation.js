"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCollectionSchema = exports.feedQuerySchema = exports.addCommentSchema = exports.createShortSchema = void 0;
const zod_1 = require("zod");
exports.createShortSchema = zod_1.z.object({
    videoUrl: zod_1.z.string().url('Invalid video URL'),
    thumbnailUrl: zod_1.z.string().url().optional(),
    caption: zod_1.z.string().max(500, 'Caption must be under 500 characters'),
    musicTrack: zod_1.z.string().optional(),
    contestId: zod_1.z.string().uuid().optional(),
    collectionId: zod_1.z.string().uuid().optional(),
    linkedProductId: zod_1.z.string().uuid().optional(),
    isLocked: zod_1.z.boolean().default(false),
    requiredTier: zod_1.z.enum(['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN']).optional()
});
exports.addCommentSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(500, 'Comment too long')
});
exports.feedQuerySchema = zod_1.z.object({
    tab: zod_1.z.enum(['home', 'discover', 'admiring']).default('discover'),
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.string().default('15').transform(Number)
});
exports.createCollectionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(50)
});
//# sourceMappingURL=shorts.validation.js.map