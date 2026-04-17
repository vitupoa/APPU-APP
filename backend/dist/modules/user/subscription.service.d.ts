export declare class SubscriptionService {
    /**
     * Get creator's subscription tier config.
     */
    static getCreatorTiers(creatorId: string): Promise<{
        id: string;
        createdAt: Date;
        krAmount: import("@prisma/client-runtime-utils").Decimal;
        creatorId: string;
        tier: import("../../generated/enums.js").SubscriptionTierType;
        benefits: string;
        isEnabled: boolean;
    }[]>;
    /**
     * Get available tiers for a user (public — for subscriber view).
     */
    static getAvailableTiers(creatorId: string): Promise<{
        id: string;
        createdAt: Date;
        krAmount: import("@prisma/client-runtime-utils").Decimal;
        creatorId: string;
        tier: import("../../generated/enums.js").SubscriptionTierType;
        benefits: string;
        isEnabled: boolean;
    }[]>;
    /**
     * Creator updates their tier config (upsert up to 4 tiers).
     */
    static updateTiers(creatorId: string, tiers: {
        tier: string;
        krAmount: number;
        benefits: string;
        isEnabled: boolean;
    }[]): Promise<{
        id: string;
        createdAt: Date;
        krAmount: import("@prisma/client-runtime-utils").Decimal;
        creatorId: string;
        tier: import("../../generated/enums.js").SubscriptionTierType;
        benefits: string;
        isEnabled: boolean;
    }[]>;
    /**
     * Subscribe to a creator's tier. Charges subscriber wallet, credits creator (minus platform fee).
     */
    static subscribe(subscriberId: string, creatorId: string, tierType: string): Promise<{
        status: string;
        id: string;
        krAmount: import("@prisma/client-runtime-utils").Decimal;
        creatorId: string;
        tier: import("../../generated/enums.js").SubscriptionTierType;
        subscriberId: string;
        tierId: string;
        startedAt: Date;
        nextBillingAt: Date | null;
        cancelledAt: Date | null;
    }>;
    /**
     * Unsubscribe from a creator.
     */
    static unsubscribe(subscriberId: string, creatorId: string): Promise<{
        status: string;
        id: string;
        krAmount: import("@prisma/client-runtime-utils").Decimal;
        creatorId: string;
        tier: import("../../generated/enums.js").SubscriptionTierType;
        subscriberId: string;
        tierId: string;
        startedAt: Date;
        nextBillingAt: Date | null;
        cancelledAt: Date | null;
    }>;
    /**
     * Check if subscriber has access to content at a given tier level.
     */
    static hasAccess(subscriberId: string, creatorId: string, requiredTier: string): Promise<boolean>;
}
//# sourceMappingURL=subscription.service.d.ts.map