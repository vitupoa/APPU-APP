import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "./prismaNamespace";
export type LogOptions<ClientOptions extends Prisma.PrismaClientOptions> = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never;
export interface PrismaClientConstructor {
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
    new <Options extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions, LogOpts extends LogOptions<Options> = LogOptions<Options>, OmitOpts extends Prisma.PrismaClientOptions['omit'] = Options extends {
        omit: infer U;
    } ? U : Prisma.PrismaClientOptions['omit'], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs>(options: Prisma.Subset<Options, Prisma.PrismaClientOptions>): PrismaClient<LogOpts, OmitOpts, ExtArgs>;
}
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
export interface PrismaClient<in LogOpts extends Prisma.LogLevel = never, in out OmitOpts extends Prisma.PrismaClientOptions['omit'] = undefined, in out ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['other'];
    };
    $on<V extends LogOpts>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;
    /**
     * Connect with the database
     */
    $connect(): runtime.Types.Utils.JsPromise<void>;
    /**
     * Disconnect from the database
     */
    $disconnect(): runtime.Types.Utils.JsPromise<void>;
    /**
       * Executes a prepared raw query and returns the number of affected rows.
       * @example
       * ```
       * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
       * ```
       *
       * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
       */
    $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;
    /**
     * Executes a raw query and returns the number of affected rows.
     * Susceptible to SQL injections, see documentation.
     * @example
     * ```
     * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
     * ```
     *
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
     */
    $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;
    /**
     * Performs a prepared raw query and returns the `SELECT` data.
     * @example
     * ```
     * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
     * ```
     *
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
     */
    $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;
    /**
     * Performs a raw query and returns the `SELECT` data.
     * Susceptible to SQL injections, see documentation.
     * @example
     * ```
     * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
     * ```
     *
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
     */
    $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;
    /**
     * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
     * @example
     * ```
     * const [george, bob, alice] = await prisma.$transaction([
     *   prisma.user.create({ data: { name: 'George' } }),
     *   prisma.user.create({ data: { name: 'Bob' } }),
     *   prisma.user.create({ data: { name: 'Alice' } }),
     * ])
     * ```
     *
     * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
     */
    $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: {
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
    $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => runtime.Types.Utils.JsPromise<R>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<R>;
    $extends: runtime.Types.Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<OmitOpts>, ExtArgs, runtime.Types.Utils.Call<Prisma.TypeMapCb<OmitOpts>, {
        extArgs: ExtArgs;
    }>>;
    /**
 * `prisma.user`: Exposes CRUD operations for the **User** model.
  * Example usage:
  * ```ts
  * // Fetch zero or more Users
  * const users = await prisma.user.findMany()
  * ```
  */
    get user(): Prisma.UserDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.refreshToken`: Exposes CRUD operations for the **RefreshToken** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more RefreshTokens
      * const refreshTokens = await prisma.refreshToken.findMany()
      * ```
      */
    get refreshToken(): Prisma.RefreshTokenDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.wallet`: Exposes CRUD operations for the **Wallet** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Wallets
      * const wallets = await prisma.wallet.findMany()
      * ```
      */
    get wallet(): Prisma.WalletDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.transaction`: Exposes CRUD operations for the **Transaction** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Transactions
      * const transactions = await prisma.transaction.findMany()
      * ```
      */
    get transaction(): Prisma.TransactionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.escrow`: Exposes CRUD operations for the **Escrow** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Escrows
      * const escrows = await prisma.escrow.findMany()
      * ```
      */
    get escrow(): Prisma.EscrowDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.admire`: Exposes CRUD operations for the **Admire** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Admires
      * const admires = await prisma.admire.findMany()
      * ```
      */
    get admire(): Prisma.AdmireDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.bioLink`: Exposes CRUD operations for the **BioLink** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more BioLinks
      * const bioLinks = await prisma.bioLink.findMany()
      * ```
      */
    get bioLink(): Prisma.BioLinkDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.subscriptionTier`: Exposes CRUD operations for the **SubscriptionTier** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more SubscriptionTiers
      * const subscriptionTiers = await prisma.subscriptionTier.findMany()
      * ```
      */
    get subscriptionTier(): Prisma.SubscriptionTierDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.subscription`: Exposes CRUD operations for the **Subscription** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Subscriptions
      * const subscriptions = await prisma.subscription.findMany()
      * ```
      */
    get subscription(): Prisma.SubscriptionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.milestone`: Exposes CRUD operations for the **Milestone** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Milestones
      * const milestones = await prisma.milestone.findMany()
      * ```
      */
    get milestone(): Prisma.MilestoneDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.milestoneCompletion`: Exposes CRUD operations for the **MilestoneCompletion** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more MilestoneCompletions
      * const milestoneCompletions = await prisma.milestoneCompletion.findMany()
      * ```
      */
    get milestoneCompletion(): Prisma.MilestoneCompletionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.short`: Exposes CRUD operations for the **Short** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Shorts
      * const shorts = await prisma.short.findMany()
      * ```
      */
    get short(): Prisma.ShortDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.shortCollection`: Exposes CRUD operations for the **ShortCollection** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ShortCollections
      * const shortCollections = await prisma.shortCollection.findMany()
      * ```
      */
    get shortCollection(): Prisma.ShortCollectionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.shortLike`: Exposes CRUD operations for the **ShortLike** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ShortLikes
      * const shortLikes = await prisma.shortLike.findMany()
      * ```
      */
    get shortLike(): Prisma.ShortLikeDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.shortComment`: Exposes CRUD operations for the **ShortComment** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ShortComments
      * const shortComments = await prisma.shortComment.findMany()
      * ```
      */
    get shortComment(): Prisma.ShortCommentDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.post`: Exposes CRUD operations for the **Post** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Posts
      * const posts = await prisma.post.findMany()
      * ```
      */
    get post(): Prisma.PostDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.postLike`: Exposes CRUD operations for the **PostLike** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more PostLikes
      * const postLikes = await prisma.postLike.findMany()
      * ```
      */
    get postLike(): Prisma.PostLikeDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.postComment`: Exposes CRUD operations for the **PostComment** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more PostComments
      * const postComments = await prisma.postComment.findMany()
      * ```
      */
    get postComment(): Prisma.PostCommentDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.contest`: Exposes CRUD operations for the **Contest** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Contests
      * const contests = await prisma.contest.findMany()
      * ```
      */
    get contest(): Prisma.ContestDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.contestAction`: Exposes CRUD operations for the **ContestAction** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ContestActions
      * const contestActions = await prisma.contestAction.findMany()
      * ```
      */
    get contestAction(): Prisma.ContestActionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.contestPrizeDistribution`: Exposes CRUD operations for the **ContestPrizeDistribution** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ContestPrizeDistributions
      * const contestPrizeDistributions = await prisma.contestPrizeDistribution.findMany()
      * ```
      */
    get contestPrizeDistribution(): Prisma.ContestPrizeDistributionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.contestParticipant`: Exposes CRUD operations for the **ContestParticipant** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ContestParticipants
      * const contestParticipants = await prisma.contestParticipant.findMany()
      * ```
      */
    get contestParticipant(): Prisma.ContestParticipantDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.contestSubmission`: Exposes CRUD operations for the **ContestSubmission** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ContestSubmissions
      * const contestSubmissions = await prisma.contestSubmission.findMany()
      * ```
      */
    get contestSubmission(): Prisma.ContestSubmissionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.contestActionCompletion`: Exposes CRUD operations for the **ContestActionCompletion** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ContestActionCompletions
      * const contestActionCompletions = await prisma.contestActionCompletion.findMany()
      * ```
      */
    get contestActionCompletion(): Prisma.ContestActionCompletionDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.contestWinner`: Exposes CRUD operations for the **ContestWinner** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ContestWinners
      * const contestWinners = await prisma.contestWinner.findMany()
      * ```
      */
    get contestWinner(): Prisma.ContestWinnerDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.contestJudge`: Exposes CRUD operations for the **ContestJudge** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ContestJudges
      * const contestJudges = await prisma.contestJudge.findMany()
      * ```
      */
    get contestJudge(): Prisma.ContestJudgeDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.contestVote`: Exposes CRUD operations for the **ContestVote** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more ContestVotes
      * const contestVotes = await prisma.contestVote.findMany()
      * ```
      */
    get contestVote(): Prisma.ContestVoteDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.product`: Exposes CRUD operations for the **Product** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more Products
      * const products = await prisma.product.findMany()
      * ```
      */
    get product(): Prisma.ProductDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    /**
     * `prisma.dailyStat`: Exposes CRUD operations for the **DailyStat** model.
      * Example usage:
      * ```ts
      * // Fetch zero or more DailyStats
      * const dailyStats = await prisma.dailyStat.findMany()
      * ```
      */
    get dailyStat(): Prisma.DailyStatDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
}
export declare function getPrismaClientClass(): PrismaClientConstructor;
//# sourceMappingURL=class.d.ts.map