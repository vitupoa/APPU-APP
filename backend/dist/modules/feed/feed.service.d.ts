export declare class FeedService {
    static getFeed(params: {
        userId?: string;
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
            imageUrls: string[];
            caption: string | null;
            isLocked: boolean;
            requiredTier: import(".prisma/client").$Enums.SubscriptionTierType | null;
            likesCount: number;
            commentsCount: number;
            isLiked: boolean;
            createdAt: string;
        }[];
        nextCursor: string | null;
    }>;
    static createPost(data: {
        userId: string;
        imageUrls: string[];
        caption: string;
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
        caption: string | null;
        isLocked: boolean;
        requiredTier: import(".prisma/client").$Enums.SubscriptionTierType | null;
        likesCount: number;
        commentsCount: number;
        imageUrls: string[];
    }>;
    static toggleLike(userId: string, postId: string): Promise<{
        liked: boolean;
    }>;
    static addComment(userId: string, postId: string, text: string): Promise<{
        createdAt: string;
        user: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
        };
        id: string;
        userId: string;
        text: string;
        postId: string;
    }>;
}
//# sourceMappingURL=feed.service.d.ts.map