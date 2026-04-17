export declare const AccountType: {
    readonly CREATOR: "CREATOR";
    readonly BUSINESS: "BUSINESS";
};
export type AccountType = (typeof AccountType)[keyof typeof AccountType];
export declare const SubscriptionTierType: {
    readonly TOP_FUN: "TOP_FUN";
    readonly REAL_FAN: "REAL_FAN";
    readonly TRUE_FAN: "TRUE_FAN";
    readonly SUPER_FAN: "SUPER_FAN";
};
export type SubscriptionTierType = (typeof SubscriptionTierType)[keyof typeof SubscriptionTierType];
export declare const ContestMediaType: {
    readonly PHOTO: "PHOTO";
    readonly VIDEO: "VIDEO";
    readonly PHOTO_AND_VIDEO: "PHOTO_AND_VIDEO";
};
export type ContestMediaType = (typeof ContestMediaType)[keyof typeof ContestMediaType];
export declare const ContestStatus: {
    readonly DRAFT: "DRAFT";
    readonly ACTIVE: "ACTIVE";
    readonly JUDGING: "JUDGING";
    readonly PENDING_PAYOUT: "PENDING_PAYOUT";
    readonly COMPLETED: "COMPLETED";
    readonly CANCELLED: "CANCELLED";
};
export type ContestStatus = (typeof ContestStatus)[keyof typeof ContestStatus];
export declare const JudgingCriteria: {
    readonly CREATOR_PICKS: "CREATOR_PICKS";
    readonly COMMUNITY_VOTE: "COMMUNITY_VOTE";
    readonly MOST_ENGAGEMENT: "MOST_ENGAGEMENT";
    readonly COMBINATION: "COMBINATION";
};
export type JudgingCriteria = (typeof JudgingCriteria)[keyof typeof JudgingCriteria];
export declare const RequirementType: {
    readonly FOLLOW_KRIETA: "FOLLOW_KRIETA";
    readonly YOUTUBE_SUB: "YOUTUBE_SUB";
    readonly SPOTIFY_FOLLOW: "SPOTIFY_FOLLOW";
    readonly INSTAGRAM_FOLLOW: "INSTAGRAM_FOLLOW";
    readonly TIKTOK_FOLLOW: "TIKTOK_FOLLOW";
    readonly WATCH_VIDEO: "WATCH_VIDEO";
    readonly VISIT_SHOP: "VISIT_SHOP";
    readonly CUSTOM: "CUSTOM";
};
export type RequirementType = (typeof RequirementType)[keyof typeof RequirementType];
//# sourceMappingURL=enums.d.ts.map