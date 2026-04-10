export declare class ShortsService {
    static getFeed(params: {
        userId: string;
        tab: 'home' | 'discover' | 'admiring';
        cursor?: string;
        limit: number;
    }): Promise<{
        items: {
            id: string;
            creator: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
                accountType: import(".prisma/client").$Enums.AccountType;
                isVerified: boolean;
            };
            videoUrl: string;
            thumbnailUrl: string | null;
            caption: string | null;
            musicTrack: string | null;
            contestId: string | null;
            collectionId: string | null;
            linkedProductId: string | null;
            linkedProduct: {
                id: string;
                title: string;
                imageUrl: string;
                priceKr: number;
            } | null;
            isLocked: boolean;
            requiredTier: import(".prisma/client").$Enums.SubscriptionTierType | null;
            likesCount: number;
            commentsCount: number;
            views: number;
            isLiked: boolean;
            createdAt: string;
        }[];
        nextCursor: string | null;
    }>;
    static createShort(data: {
        userId: string;
        videoUrl: string;
        thumbnailUrl?: string;
        caption: string;
        musicTrack?: string;
        contestId?: string;
        collectionId?: string;
        linkedProductId?: string;
        isLocked: boolean;
        requiredTier?: string;
    }): Promise<{
        creator: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        createdAt: string;
        user: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        id: string;
        userId: string;
        videoUrl: string;
        thumbnailUrl: string | null;
        caption: string | null;
        musicTitle: string | null;
        musicArtist: string | null;
        isLocked: boolean;
        requiredTier: import(".prisma/client").$Enums.SubscriptionTierType | null;
        contestId: string | null;
        collectionId: string | null;
        linkedProductId: string | null;
        views: number;
        likesCount: number;
        commentsCount: number;
    }>;
    static toggleLike(userId: string, shortId: string): Promise<{
        liked: boolean;
    }>;
    static addComment(userId: string, shortId: string, text: string): Promise<{
        createdAt: string;
        user: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        id: string;
        userId: string;
        shortId: string;
        text: string;
    }>;
    static getComments(shortId: string, cursor?: string, limit?: number): Promise<{
        items: {
            createdAt: string;
            user: {
                id: string;
                username: string;
                displayName: string;
                avatarUrl: string | null;
            };
            id: string;
            userId: string;
            shortId: string;
            text: string;
        }[];
        nextCursor: string | null;
    }>;
    static incrementView(shortId: string): Promise<void>;
    static getCollections(userId: string): Promise<{
        shortCount: number;
        createdAt: string;
        _count: {
            shorts: number;
        };
        name: string;
        id: string;
        userId: string;
        sortOrder: number;
        coverUrl: string | null;
    }[]>;
    static createCollection(userId: string, name: string): Promise<{
        createdAt: string;
        name: string;
        id: string;
        userId: string;
        sortOrder: number;
        coverUrl: string | null;
    }>;
}
//# sourceMappingURL=shorts.service.d.ts.map