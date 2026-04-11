import { Prisma } from '@prisma/client';
export declare class UserService {
    /**
     * Get full user profile with relationship status and stats.
     */
    static getProfile(userId: string, viewerId?: string): Promise<{
        id: string;
        username: string;
        firstName: string;
        lastName: string;
        displayName: string;
        avatarUrl: string | null;
        coverPhotoUrl: string | null;
        bio: string | null;
        country: string;
        currency: string;
        accountType: import(".prisma/client").$Enums.AccountType;
        isVerified: boolean;
        isWalletUnlocked: boolean;
        bioLinks: {
            id: string;
            userId: string;
            label: string;
            url: string;
            icon: string | null;
            sortOrder: number;
        }[];
        stats: {
            admirers: number;
            admiring: number;
            lovers: number;
            contestsWon: number;
        };
        relationshipStatus: string;
        createdAt: string;
    }>;
    /**
     * Update own profile. Rejects name/username changes if wallet is unlocked.
     */
    static updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        displayName?: string;
        username?: string;
        bio?: string;
        avatarUrl?: string;
        coverPhotoUrl?: string;
    }): Promise<{
        id: string;
        email: string;
        username: string;
        firstName: string;
        lastName: string;
        displayName: string;
        avatarUrl: string | null;
        coverPhotoUrl: string | null;
        bio: string | null;
        country: string;
        currency: string;
        googleId: string | null;
        appleId: string | null;
        accountType: import(".prisma/client").$Enums.AccountType;
        isAdmin: boolean;
        isVerified: boolean;
        isWalletUnlocked: boolean;
        walletPinHash: string | null;
        passwordHash: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    /**
     * Admire a user. If mutual, both records become lovers.
     */
    static admire(admirerId: string, admiredId: string): Promise<{
        admired: boolean;
        isLovers: boolean;
    }>;
    /**
     * Unadmire a user. If they were lovers, both records lose lover status.
     */
    static unadmire(admirerId: string, admiredId: string): Promise<{
        admired: boolean;
    }>;
    /**
     * Get paginated list of users who admire the given userId.
     */
    static getAdmirers(userId: string, cursor?: string, limit?: number): Promise<{
        items: {
            isLovers: boolean;
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
            isVerified: boolean;
        }[];
        nextCursor: string | null;
    }>;
    /**
     * Get paginated list of users the given userId admires.
     */
    static getAdmiring(userId: string, cursor?: string, limit?: number): Promise<{
        items: {
            isLovers: boolean;
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
            isVerified: boolean;
        }[];
        nextCursor: string | null;
    }>;
    /**
     * Get mutual admirers (lovers).
     */
    static getLovers(userId: string, cursor?: string, limit?: number): Promise<{
        items: {
            id: string;
            username: string;
            displayName: string;
            avatarUrl: string | null;
            isVerified: boolean;
        }[];
        nextCursor: string | null;
    }>;
    static updateBioLinks(userId: string, links: {
        label: string;
        url: string;
        icon?: string;
    }[]): Promise<{
        id: string;
        userId: string;
        label: string;
        url: string;
        icon: string | null;
        sortOrder: number;
    }[]>;
    static getMilestones(): Promise<({
        completions: ({
            user: {
                id: string;
                username: string;
                displayName: string;
            };
        } & {
            id: string;
            userId: string;
            milestoneId: string;
            completedAt: Date;
        })[];
    } & {
        description: string;
        id: string;
        createdAt: Date;
        contestId: string | null;
        title: string;
        requirementType: string;
        requirementValue: number;
        rewardKr: Prisma.Decimal;
    })[]>;
    static getUserMilestoneProgress(userId: string): Promise<{
        id: string;
        title: string;
        description: string;
        requirementType: string;
        requirementValue: number;
        rewardKr: number;
        isCompleted: boolean;
        completedBy: {
            id: string;
            username: string;
            displayName: string;
        };
    }[]>;
}
//# sourceMappingURL=user.service.d.ts.map