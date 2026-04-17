import { z } from 'zod';
export const createShortSchema = z.object({
    videoUrl: z.string().url('Invalid video URL'),
    thumbnailUrl: z.string().url().optional(),
    caption: z.string().max(500, 'Caption must be under 500 characters'),
    musicTrack: z.string().optional(),
    contestId: z.string().uuid().optional(),
    collectionId: z.string().uuid().optional(),
    linkedProductId: z.string().uuid().optional(),
    isLocked: z.boolean().default(false),
    requiredTier: z.enum(['TOP_FUN', 'REAL_FAN', 'TRUE_FAN', 'SUPER_FAN']).optional()
});
export const addCommentSchema = z.object({
    text: z.string().min(1).max(500, 'Comment too long')
});
export const feedQuerySchema = z.object({
    tab: z.enum(['home', 'discover', 'admiring']).default('discover'),
    cursor: z.string().optional(),
    limit: z.string().default('15').transform(Number)
});
export const createCollectionSchema = z.object({
    name: z.string().min(1).max(50)
});
//# sourceMappingURL=shorts.validation.js.map