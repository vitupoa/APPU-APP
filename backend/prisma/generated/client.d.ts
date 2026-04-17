import * as runtime from "@prisma/client/runtime/client";
import * as $Class from "./internal/class";
import * as Prisma from "./internal/prismaNamespace";
export * as $Enums from './enums';
export * from "./enums";
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export declare const PrismaClient: $Class.PrismaClientConstructor;
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>;
export { Prisma };
/**
 * Model User
 *
 */
export type User = Prisma.UserModel;
/**
 * Model RefreshToken
 *
 */
export type RefreshToken = Prisma.RefreshTokenModel;
/**
 * Model Wallet
 *
 */
export type Wallet = Prisma.WalletModel;
/**
 * Model Transaction
 *
 */
export type Transaction = Prisma.TransactionModel;
/**
 * Model Escrow
 *
 */
export type Escrow = Prisma.EscrowModel;
/**
 * Model Admire
 *
 */
export type Admire = Prisma.AdmireModel;
/**
 * Model BioLink
 *
 */
export type BioLink = Prisma.BioLinkModel;
/**
 * Model SubscriptionTier
 *
 */
export type SubscriptionTier = Prisma.SubscriptionTierModel;
/**
 * Model Subscription
 *
 */
export type Subscription = Prisma.SubscriptionModel;
/**
 * Model Milestone
 *
 */
export type Milestone = Prisma.MilestoneModel;
/**
 * Model MilestoneCompletion
 *
 */
export type MilestoneCompletion = Prisma.MilestoneCompletionModel;
/**
 * Model Short
 *
 */
export type Short = Prisma.ShortModel;
/**
 * Model ShortCollection
 *
 */
export type ShortCollection = Prisma.ShortCollectionModel;
/**
 * Model ShortLike
 *
 */
export type ShortLike = Prisma.ShortLikeModel;
/**
 * Model ShortComment
 *
 */
export type ShortComment = Prisma.ShortCommentModel;
/**
 * Model Post
 *
 */
export type Post = Prisma.PostModel;
/**
 * Model PostLike
 *
 */
export type PostLike = Prisma.PostLikeModel;
/**
 * Model PostComment
 *
 */
export type PostComment = Prisma.PostCommentModel;
/**
 * Model Contest
 *
 */
export type Contest = Prisma.ContestModel;
/**
 * Model ContestAction
 *
 */
export type ContestAction = Prisma.ContestActionModel;
/**
 * Model ContestPrizeDistribution
 *
 */
export type ContestPrizeDistribution = Prisma.ContestPrizeDistributionModel;
/**
 * Model ContestParticipant
 *
 */
export type ContestParticipant = Prisma.ContestParticipantModel;
/**
 * Model ContestSubmission
 *
 */
export type ContestSubmission = Prisma.ContestSubmissionModel;
/**
 * Model ContestActionCompletion
 *
 */
export type ContestActionCompletion = Prisma.ContestActionCompletionModel;
/**
 * Model ContestWinner
 *
 */
export type ContestWinner = Prisma.ContestWinnerModel;
/**
 * Model ContestJudge
 *
 */
export type ContestJudge = Prisma.ContestJudgeModel;
/**
 * Model ContestVote
 *
 */
export type ContestVote = Prisma.ContestVoteModel;
/**
 * Model Product
 *
 */
export type Product = Prisma.ProductModel;
/**
 * Model DailyStat
 *
 */
export type DailyStat = Prisma.DailyStatModel;
//# sourceMappingURL=client.d.ts.map