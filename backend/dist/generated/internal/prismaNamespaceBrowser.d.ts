import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models';
export type * from './prismaNamespace';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly User: "User";
    readonly RefreshToken: "RefreshToken";
    readonly Wallet: "Wallet";
    readonly Transaction: "Transaction";
    readonly Escrow: "Escrow";
    readonly Admire: "Admire";
    readonly BioLink: "BioLink";
    readonly SubscriptionTier: "SubscriptionTier";
    readonly Subscription: "Subscription";
    readonly Milestone: "Milestone";
    readonly MilestoneCompletion: "MilestoneCompletion";
    readonly Short: "Short";
    readonly ShortCollection: "ShortCollection";
    readonly ShortLike: "ShortLike";
    readonly ShortComment: "ShortComment";
    readonly Post: "Post";
    readonly PostLike: "PostLike";
    readonly PostComment: "PostComment";
    readonly Contest: "Contest";
    readonly ContestAction: "ContestAction";
    readonly ContestPrizeDistribution: "ContestPrizeDistribution";
    readonly ContestParticipant: "ContestParticipant";
    readonly ContestSubmission: "ContestSubmission";
    readonly ContestActionCompletion: "ContestActionCompletion";
    readonly ContestWinner: "ContestWinner";
    readonly ContestJudge: "ContestJudge";
    readonly ContestVote: "ContestVote";
    readonly Product: "Product";
    readonly DailyStat: "DailyStat";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: "id";
    readonly email: "email";
    readonly username: "username";
    readonly firstName: "firstName";
    readonly lastName: "lastName";
    readonly displayName: "displayName";
    readonly avatarUrl: "avatarUrl";
    readonly coverPhotoUrl: "coverPhotoUrl";
    readonly bio: "bio";
    readonly country: "country";
    readonly currency: "currency";
    readonly googleId: "googleId";
    readonly appleId: "appleId";
    readonly accountType: "accountType";
    readonly isAdmin: "isAdmin";
    readonly isVerified: "isVerified";
    readonly isWalletUnlocked: "isWalletUnlocked";
    readonly walletPinHash: "walletPinHash";
    readonly passwordHash: "passwordHash";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const RefreshTokenScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly tokenHash: "tokenHash";
    readonly deviceId: "deviceId";
    readonly expiresAt: "expiresAt";
    readonly createdAt: "createdAt";
};
export type RefreshTokenScalarFieldEnum = (typeof RefreshTokenScalarFieldEnum)[keyof typeof RefreshTokenScalarFieldEnum];
export declare const WalletScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly krBalance: "krBalance";
    readonly createdAt: "createdAt";
    readonly updatedAt: "updatedAt";
};
export type WalletScalarFieldEnum = (typeof WalletScalarFieldEnum)[keyof typeof WalletScalarFieldEnum];
export declare const TransactionScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly type: "type";
    readonly amountKr: "amountKr";
    readonly amountFiat: "amountFiat";
    readonly currency: "currency";
    readonly provider: "provider";
    readonly status: "status";
    readonly reference: "reference";
    readonly counterpartyId: "counterpartyId";
    readonly metadata: "metadata";
    readonly createdAt: "createdAt";
};
export type TransactionScalarFieldEnum = (typeof TransactionScalarFieldEnum)[keyof typeof TransactionScalarFieldEnum];
export declare const EscrowScalarFieldEnum: {
    readonly id: "id";
    readonly contestId: "contestId";
    readonly userId: "userId";
    readonly prizeAmountKr: "prizeAmountKr";
    readonly feeAmountKr: "feeAmountKr";
    readonly status: "status";
    readonly createdAt: "createdAt";
};
export type EscrowScalarFieldEnum = (typeof EscrowScalarFieldEnum)[keyof typeof EscrowScalarFieldEnum];
export declare const AdmireScalarFieldEnum: {
    readonly id: "id";
    readonly admirerId: "admirerId";
    readonly admiredId: "admiredId";
    readonly isLovers: "isLovers";
    readonly createdAt: "createdAt";
};
export type AdmireScalarFieldEnum = (typeof AdmireScalarFieldEnum)[keyof typeof AdmireScalarFieldEnum];
export declare const BioLinkScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly label: "label";
    readonly url: "url";
    readonly icon: "icon";
    readonly sortOrder: "sortOrder";
};
export type BioLinkScalarFieldEnum = (typeof BioLinkScalarFieldEnum)[keyof typeof BioLinkScalarFieldEnum];
export declare const SubscriptionTierScalarFieldEnum: {
    readonly id: "id";
    readonly creatorId: "creatorId";
    readonly tier: "tier";
    readonly krAmount: "krAmount";
    readonly benefits: "benefits";
    readonly isEnabled: "isEnabled";
    readonly createdAt: "createdAt";
};
export type SubscriptionTierScalarFieldEnum = (typeof SubscriptionTierScalarFieldEnum)[keyof typeof SubscriptionTierScalarFieldEnum];
export declare const SubscriptionScalarFieldEnum: {
    readonly id: "id";
    readonly subscriberId: "subscriberId";
    readonly creatorId: "creatorId";
    readonly tierId: "tierId";
    readonly tier: "tier";
    readonly krAmount: "krAmount";
    readonly status: "status";
    readonly startedAt: "startedAt";
    readonly nextBillingAt: "nextBillingAt";
    readonly cancelledAt: "cancelledAt";
};
export type SubscriptionScalarFieldEnum = (typeof SubscriptionScalarFieldEnum)[keyof typeof SubscriptionScalarFieldEnum];
export declare const MilestoneScalarFieldEnum: {
    readonly id: "id";
    readonly title: "title";
    readonly description: "description";
    readonly requirementType: "requirementType";
    readonly requirementValue: "requirementValue";
    readonly rewardKr: "rewardKr";
    readonly contestId: "contestId";
    readonly createdAt: "createdAt";
};
export type MilestoneScalarFieldEnum = (typeof MilestoneScalarFieldEnum)[keyof typeof MilestoneScalarFieldEnum];
export declare const MilestoneCompletionScalarFieldEnum: {
    readonly id: "id";
    readonly milestoneId: "milestoneId";
    readonly userId: "userId";
    readonly completedAt: "completedAt";
};
export type MilestoneCompletionScalarFieldEnum = (typeof MilestoneCompletionScalarFieldEnum)[keyof typeof MilestoneCompletionScalarFieldEnum];
export declare const ShortScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly videoUrl: "videoUrl";
    readonly thumbnailUrl: "thumbnailUrl";
    readonly caption: "caption";
    readonly musicTitle: "musicTitle";
    readonly musicArtist: "musicArtist";
    readonly isLocked: "isLocked";
    readonly requiredTier: "requiredTier";
    readonly contestId: "contestId";
    readonly collectionId: "collectionId";
    readonly linkedProductId: "linkedProductId";
    readonly views: "views";
    readonly likesCount: "likesCount";
    readonly commentsCount: "commentsCount";
    readonly createdAt: "createdAt";
};
export type ShortScalarFieldEnum = (typeof ShortScalarFieldEnum)[keyof typeof ShortScalarFieldEnum];
export declare const ShortCollectionScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly name: "name";
    readonly coverUrl: "coverUrl";
    readonly sortOrder: "sortOrder";
    readonly createdAt: "createdAt";
};
export type ShortCollectionScalarFieldEnum = (typeof ShortCollectionScalarFieldEnum)[keyof typeof ShortCollectionScalarFieldEnum];
export declare const ShortLikeScalarFieldEnum: {
    readonly id: "id";
    readonly shortId: "shortId";
    readonly userId: "userId";
    readonly createdAt: "createdAt";
};
export type ShortLikeScalarFieldEnum = (typeof ShortLikeScalarFieldEnum)[keyof typeof ShortLikeScalarFieldEnum];
export declare const ShortCommentScalarFieldEnum: {
    readonly id: "id";
    readonly shortId: "shortId";
    readonly userId: "userId";
    readonly text: "text";
    readonly createdAt: "createdAt";
};
export type ShortCommentScalarFieldEnum = (typeof ShortCommentScalarFieldEnum)[keyof typeof ShortCommentScalarFieldEnum];
export declare const PostScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly caption: "caption";
    readonly imageUrls: "imageUrls";
    readonly isLocked: "isLocked";
    readonly requiredTier: "requiredTier";
    readonly likesCount: "likesCount";
    readonly commentsCount: "commentsCount";
    readonly createdAt: "createdAt";
};
export type PostScalarFieldEnum = (typeof PostScalarFieldEnum)[keyof typeof PostScalarFieldEnum];
export declare const PostLikeScalarFieldEnum: {
    readonly id: "id";
    readonly postId: "postId";
    readonly userId: "userId";
    readonly createdAt: "createdAt";
};
export type PostLikeScalarFieldEnum = (typeof PostLikeScalarFieldEnum)[keyof typeof PostLikeScalarFieldEnum];
export declare const PostCommentScalarFieldEnum: {
    readonly id: "id";
    readonly postId: "postId";
    readonly userId: "userId";
    readonly text: "text";
    readonly createdAt: "createdAt";
};
export type PostCommentScalarFieldEnum = (typeof PostCommentScalarFieldEnum)[keyof typeof PostCommentScalarFieldEnum];
export declare const ContestScalarFieldEnum: {
    readonly id: "id";
    readonly creatorId: "creatorId";
    readonly title: "title";
    readonly description: "description";
    readonly mediaType: "mediaType";
    readonly category: "category";
    readonly coverMediaUrl: "coverMediaUrl";
    readonly prizeTotalKr: "prizeTotalKr";
    readonly platformFeeKr: "platformFeeKr";
    readonly entryFeeKr: "entryFeeKr";
    readonly publicVoteWeight: "publicVoteWeight";
    readonly targetAges: "targetAges";
    readonly targetGeos: "targetGeos";
    readonly airdropKr: "airdropKr";
    readonly airdropLimit: "airdropLimit";
    readonly allowDailyPrizes: "allowDailyPrizes";
    readonly dailyPrizeKr: "dailyPrizeKr";
    readonly maxWinners: "maxWinners";
    readonly judgingCriteria: "judgingCriteria";
    readonly sponsorName: "sponsorName";
    readonly sponsorUrl: "sponsorUrl";
    readonly deadline: "deadline";
    readonly status: "status";
    readonly totalParticipants: "totalParticipants";
    readonly totalSubmissions: "totalSubmissions";
    readonly createdAt: "createdAt";
};
export type ContestScalarFieldEnum = (typeof ContestScalarFieldEnum)[keyof typeof ContestScalarFieldEnum];
export declare const ContestActionScalarFieldEnum: {
    readonly id: "id";
    readonly contestId: "contestId";
    readonly actionType: "actionType";
    readonly targetUrl: "targetUrl";
    readonly label: "label";
    readonly isVerifiable: "isVerifiable";
    readonly requiresUpload: "requiresUpload";
    readonly sortOrder: "sortOrder";
};
export type ContestActionScalarFieldEnum = (typeof ContestActionScalarFieldEnum)[keyof typeof ContestActionScalarFieldEnum];
export declare const ContestPrizeDistributionScalarFieldEnum: {
    readonly id: "id";
    readonly contestId: "contestId";
    readonly rank: "rank";
    readonly percentage: "percentage";
};
export type ContestPrizeDistributionScalarFieldEnum = (typeof ContestPrizeDistributionScalarFieldEnum)[keyof typeof ContestPrizeDistributionScalarFieldEnum];
export declare const ContestParticipantScalarFieldEnum: {
    readonly id: "id";
    readonly contestId: "contestId";
    readonly userId: "userId";
    readonly joinedAt: "joinedAt";
};
export type ContestParticipantScalarFieldEnum = (typeof ContestParticipantScalarFieldEnum)[keyof typeof ContestParticipantScalarFieldEnum];
export declare const ContestSubmissionScalarFieldEnum: {
    readonly id: "id";
    readonly contestId: "contestId";
    readonly userId: "userId";
    readonly mediaUrl: "mediaUrl";
    readonly mediaType: "mediaType";
    readonly proofUrls: "proofUrls";
    readonly votesCount: "votesCount";
    readonly judgeScore: "judgeScore";
    readonly finalScore: "finalScore";
    readonly rank: "rank";
    readonly submittedAt: "submittedAt";
};
export type ContestSubmissionScalarFieldEnum = (typeof ContestSubmissionScalarFieldEnum)[keyof typeof ContestSubmissionScalarFieldEnum];
export declare const ContestActionCompletionScalarFieldEnum: {
    readonly id: "id";
    readonly submissionId: "submissionId";
    readonly actionId: "actionId";
    readonly isCompleted: "isCompleted";
    readonly proofUrl: "proofUrl";
};
export type ContestActionCompletionScalarFieldEnum = (typeof ContestActionCompletionScalarFieldEnum)[keyof typeof ContestActionCompletionScalarFieldEnum];
export declare const ContestWinnerScalarFieldEnum: {
    readonly id: "id";
    readonly contestId: "contestId";
    readonly userId: "userId";
    readonly rank: "rank";
    readonly prizeKr: "prizeKr";
    readonly awardedAt: "awardedAt";
};
export type ContestWinnerScalarFieldEnum = (typeof ContestWinnerScalarFieldEnum)[keyof typeof ContestWinnerScalarFieldEnum];
export declare const ContestJudgeScalarFieldEnum: {
    readonly id: "id";
    readonly contestId: "contestId";
    readonly userId: "userId";
    readonly status: "status";
    readonly addedAt: "addedAt";
};
export type ContestJudgeScalarFieldEnum = (typeof ContestJudgeScalarFieldEnum)[keyof typeof ContestJudgeScalarFieldEnum];
export declare const ContestVoteScalarFieldEnum: {
    readonly id: "id";
    readonly submissionId: "submissionId";
    readonly voterId: "voterId";
    readonly ipAddress: "ipAddress";
    readonly fingerprint: "fingerprint";
    readonly createdAt: "createdAt";
};
export type ContestVoteScalarFieldEnum = (typeof ContestVoteScalarFieldEnum)[keyof typeof ContestVoteScalarFieldEnum];
export declare const ProductScalarFieldEnum: {
    readonly id: "id";
    readonly sellerId: "sellerId";
    readonly title: "title";
    readonly description: "description";
    readonly imageUrls: "imageUrls";
    readonly priceKr: "priceKr";
    readonly category: "category";
    readonly whatsappNumber: "whatsappNumber";
    readonly status: "status";
    readonly createdAt: "createdAt";
};
export type ProductScalarFieldEnum = (typeof ProductScalarFieldEnum)[keyof typeof ProductScalarFieldEnum];
export declare const DailyStatScalarFieldEnum: {
    readonly id: "id";
    readonly userId: "userId";
    readonly date: "date";
    readonly views: "views";
    readonly likes: "likes";
    readonly newAdmirers: "newAdmirers";
    readonly krEarned: "krEarned";
    readonly krSpent: "krSpent";
};
export type DailyStatScalarFieldEnum = (typeof DailyStatScalarFieldEnum)[keyof typeof DailyStatScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const NullableJsonNullValueInput: {
    readonly DbNull: "DbNull";
    readonly JsonNull: "JsonNull";
};
export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: "DbNull";
    readonly JsonNull: "JsonNull";
    readonly AnyNull: "AnyNull";
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map