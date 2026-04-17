import { SubscriptionTierType } from '@prisma/client';
export declare class ShortsService {
    /**
     * Get shorts feed based on type
     * - discover: Users NOT in admiring list (For You)
     * - admiring: Users in admiring list (Following)
     */
    static getFeed(type: string, cursor?: string, limit?: number, userId?: string): Promise<{
        items: {
            id: string;
            creator: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
                isVerified: boolean;
            };
            videoUrl: string;
            caption: string;
            musicTrack: string | null;
            likesCount: number;
            commentsCount: number;
            isLiked: boolean;
            isLocked: boolean;
            requiredTier: import("../../generated/enums.js").SubscriptionTierType | null;
            linkedProduct: {
                id: string;
                title: string;
                priceKr: number;
                imageUrl: string | null;
            } | null;
            createdAt: string;
        }[];
        nextCursor: string | null;
    }>;
    /**
     * Create a new short
     */
    static createShort(data: {
        creatorId: string;
        videoUrl: string;
        caption?: string;
        musicTrack?: string;
        linkedProductId?: string;
        isLocked?: boolean;
        requiredTier?: SubscriptionTierType;
    }): Promise<{
        id: string;
        creator: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        videoUrl: string;
        caption: string | null;
        musicTrack: string | null;
        likesCount: number;
        commentsCount: number;
        isLiked: boolean;
        isLocked: boolean;
        requiredTier: import("../../generated/enums.js").SubscriptionTierType | null;
        createdAt: string;
    }>;
    /**
     * Toggle like on a short
     */
    static toggleLike(userId: string, shortId: string): Promise<{
        liked: boolean;
        likesCount: number;
    }>;
    /**
     * Increment view count
     */
    static incrementView(shortId: string, userId?: string): Promise<void>;
}
//# sourceMappingURL=shorts.service.d.ts.map