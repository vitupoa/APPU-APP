import { z } from 'zod';
export declare const createShortSchema: z.ZodObject<{
    videoUrl: z.ZodString;
    thumbnailUrl: z.ZodOptional<z.ZodString>;
    caption: z.ZodString;
    musicTrack: z.ZodOptional<z.ZodString>;
    contestId: z.ZodOptional<z.ZodString>;
    collectionId: z.ZodOptional<z.ZodString>;
    linkedProductId: z.ZodOptional<z.ZodString>;
    isLocked: z.ZodDefault<z.ZodBoolean>;
    requiredTier: z.ZodOptional<z.ZodEnum<["TOP_FUN", "REAL_FAN", "TRUE_FAN", "SUPER_FAN"]>>;
}, "strip", z.ZodTypeAny, {
    videoUrl: string;
    caption: string;
    isLocked: boolean;
    thumbnailUrl?: string | undefined;
    requiredTier?: "TOP_FUN" | "REAL_FAN" | "TRUE_FAN" | "SUPER_FAN" | undefined;
    contestId?: string | undefined;
    collectionId?: string | undefined;
    linkedProductId?: string | undefined;
    musicTrack?: string | undefined;
}, {
    videoUrl: string;
    caption: string;
    thumbnailUrl?: string | undefined;
    isLocked?: boolean | undefined;
    requiredTier?: "TOP_FUN" | "REAL_FAN" | "TRUE_FAN" | "SUPER_FAN" | undefined;
    contestId?: string | undefined;
    collectionId?: string | undefined;
    linkedProductId?: string | undefined;
    musicTrack?: string | undefined;
}>;
export declare const addCommentSchema: z.ZodObject<{
    text: z.ZodString;
}, "strip", z.ZodTypeAny, {
    text: string;
}, {
    text: string;
}>;
export declare const feedQuerySchema: z.ZodObject<{
    tab: z.ZodDefault<z.ZodEnum<["home", "discover", "admiring"]>>;
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodString>, number, string | undefined>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    tab: "admiring" | "home" | "discover";
    cursor?: string | undefined;
}, {
    limit?: string | undefined;
    cursor?: string | undefined;
    tab?: "admiring" | "home" | "discover" | undefined;
}>;
export declare const createCollectionSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
//# sourceMappingURL=shorts.validation.d.ts.map