import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../models";
import { type PrismaClient } from "./class";
export type * from '../models';
export type DMMF = typeof runtime.DMMF;
export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>;
/**
 * Prisma Errors
 */
export declare const PrismaClientKnownRequestError: typeof runtime.PrismaClientKnownRequestError;
export type PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export declare const PrismaClientUnknownRequestError: typeof runtime.PrismaClientUnknownRequestError;
export type PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export declare const PrismaClientRustPanicError: typeof runtime.PrismaClientRustPanicError;
export type PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export declare const PrismaClientInitializationError: typeof runtime.PrismaClientInitializationError;
export type PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export declare const PrismaClientValidationError: typeof runtime.PrismaClientValidationError;
export type PrismaClientValidationError = runtime.PrismaClientValidationError;
/**
 * Re-export of sql-template-tag
 */
export declare const sql: typeof runtime.sqltag;
export declare const empty: runtime.Sql;
export declare const join: typeof runtime.join;
export declare const raw: typeof runtime.raw;
export declare const Sql: typeof runtime.Sql;
export type Sql = runtime.Sql;
/**
 * Decimal.js
 */
export declare const Decimal: typeof runtime.Decimal;
export type Decimal = runtime.Decimal;
export type DecimalJsLike = runtime.DecimalJsLike;
/**
* Extensions
*/
export type Extension = runtime.Types.Extensions.UserArgs;
export declare const getExtensionContext: typeof runtime.Extensions.getExtensionContext;
export type Args<T, F extends runtime.Operation> = runtime.Types.Public.Args<T, F>;
export type Payload<T, F extends runtime.Operation = never> = runtime.Types.Public.Payload<T, F>;
export type Result<T, A, F extends runtime.Operation> = runtime.Types.Public.Result<T, A, F>;
export type Exact<A, W> = runtime.Types.Public.Exact<A, W>;
export type PrismaVersion = {
    client: string;
    engine: string;
};
/**
 * Prisma Client JS version: 7.0.0
 * Query Engine version: 0c19ccc313cf9911a90d99d2ac2eb0280c76c513
 */
export declare const prismaVersion: PrismaVersion;
/**
 * Utility Types
 */
export type Bytes = runtime.Bytes;
export type JsonObject = runtime.JsonObject;
export type JsonArray = runtime.JsonArray;
export type JsonValue = runtime.JsonValue;
export type InputJsonObject = runtime.InputJsonObject;
export type InputJsonArray = runtime.InputJsonArray;
export type InputJsonValue = runtime.InputJsonValue;
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
type SelectAndInclude = {
    select: any;
    include: any;
};
type SelectAndOmit = {
    select: any;
    omit: any;
};
/**
 * From T, pick a set of properties whose keys are in the union K
 */
type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
export type Enumerable<T> = T | Array<T>;
/**
 * Subset
 * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
 */
export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
};
/**
 * SelectSubset
 * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
 * Additionally, it validates, if both select and include are present. If the case, it errors.
 */
export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & (T extends SelectAndInclude ? 'Please either choose `select` or `include`.' : T extends SelectAndOmit ? 'Please either choose `select` or `omit`.' : {});
/**
 * Subset + Intersection
 * @desc From `T` pick properties that exist in `U` and intersect `K`
 */
export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & K;
type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
/**
 * XOR is needed to have a real mutually exclusive union type
 * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
 */
export type XOR<T, U> = T extends object ? U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U : T;
/**
 * Is T a Record?
 */
type IsObject<T extends any> = T extends Array<any> ? False : T extends Date ? False : T extends Uint8Array ? False : T extends BigInt ? False : T extends object ? True : False;
/**
 * If it's T[], return T
 */
export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;
/**
 * From ts-toolbelt
 */
type __Either<O extends object, K extends Key> = Omit<O, K> & {
    [P in K]: Prisma__Pick<O, P & keyof O>;
}[K];
type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;
type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;
type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
}[strict];
export type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown ? _Either<O, K, strict> : never;
export type Union = any;
export type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
} & {};
/** Helper Types for "Merge" **/
export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
} & {};
type _Merge<U extends object> = IntersectOf<Overwrite<U, {
    [K in keyof U]-?: At<U, K>;
}>>;
type Key = string | number | symbol;
type AtStrict<O extends object, K extends Key> = O[K & keyof O];
type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
}[strict];
export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
} & {};
export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
} & {};
type _Record<K extends keyof any, T> = {
    [P in K]: T;
};
type NoExpand<T> = T extends unknown ? T : never;
export type AtLeast<O extends object, K extends string> = NoExpand<O extends unknown ? (K extends keyof O ? {
    [P in K]: O[P];
} & O : O) | {
    [P in keyof O as P extends K ? P : never]-?: O[P];
} & O : never>;
type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;
export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
/** End Helper Types for "Merge" **/
export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;
export type Boolean = True | False;
export type True = 1;
export type False = 0;
export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
}[B];
export type Extends<A1 extends any, A2 extends any> = [A1] extends [never] ? 0 : A1 extends A2 ? 1 : 0;
export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;
export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
        0: 0;
        1: 1;
    };
    1: {
        0: 1;
        1: 1;
    };
}[B1][B2];
export type Keys<U extends Union> = U extends unknown ? keyof U : never;
export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O ? O[P] : never;
} : never;
type FieldPaths<T, U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>> = IsObject<T> extends True ? U : T;
export type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<'OR', K>, Extends<'AND', K>>, Extends<'NOT', K>> extends True ? T[K] extends infer TK ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never> : never : {} extends FieldPaths<T[K]> ? never : K;
}[keyof T];
/**
 * Convert tuple to union
 */
type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
export type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;
/**
 * Like `Pick`, but additionally can also accept an array of keys
 */
export type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;
/**
 * Exclude all keys with underscores
 */
export type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;
export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;
type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;
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
export interface TypeMapCb<GlobalOmitOptions = {}> extends runtime.Types.Utils.Fn<{
    extArgs: runtime.Types.Extensions.InternalArgs;
}, runtime.Types.Utils.Record<string, any>> {
    returns: TypeMap<this['params']['extArgs'], GlobalOmitOptions>;
}
export type TypeMap<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
        omit: GlobalOmitOptions;
    };
    meta: {
        modelProps: "user" | "refreshToken" | "wallet" | "transaction" | "escrow" | "admire" | "bioLink" | "subscriptionTier" | "subscription" | "milestone" | "milestoneCompletion" | "short" | "shortCollection" | "shortLike" | "shortComment" | "post" | "postLike" | "postComment" | "contest" | "contestAction" | "contestPrizeDistribution" | "contestParticipant" | "contestSubmission" | "contestActionCompletion" | "contestWinner" | "contestJudge" | "contestVote" | "product" | "dailyStat";
        txIsolationLevel: TransactionIsolationLevel;
    };
    model: {
        User: {
            payload: Prisma.$UserPayload<ExtArgs>;
            fields: Prisma.UserFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.UserFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findFirst: {
                    args: Prisma.UserFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                findMany: {
                    args: Prisma.UserFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                create: {
                    args: Prisma.UserCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                createMany: {
                    args: Prisma.UserCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                delete: {
                    args: Prisma.UserDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                update: {
                    args: Prisma.UserUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                deleteMany: {
                    args: Prisma.UserDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.UserUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>[];
                };
                upsert: {
                    args: Prisma.UserUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$UserPayload>;
                };
                aggregate: {
                    args: Prisma.UserAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateUser>;
                };
                groupBy: {
                    args: Prisma.UserGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserGroupByOutputType>[];
                };
                count: {
                    args: Prisma.UserCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.UserCountAggregateOutputType> | number;
                };
            };
        };
        RefreshToken: {
            payload: Prisma.$RefreshTokenPayload<ExtArgs>;
            fields: Prisma.RefreshTokenFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.RefreshTokenFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.RefreshTokenFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload>;
                };
                findFirst: {
                    args: Prisma.RefreshTokenFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.RefreshTokenFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload>;
                };
                findMany: {
                    args: Prisma.RefreshTokenFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload>[];
                };
                create: {
                    args: Prisma.RefreshTokenCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload>;
                };
                createMany: {
                    args: Prisma.RefreshTokenCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.RefreshTokenCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload>[];
                };
                delete: {
                    args: Prisma.RefreshTokenDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload>;
                };
                update: {
                    args: Prisma.RefreshTokenUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload>;
                };
                deleteMany: {
                    args: Prisma.RefreshTokenDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.RefreshTokenUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.RefreshTokenUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload>[];
                };
                upsert: {
                    args: Prisma.RefreshTokenUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$RefreshTokenPayload>;
                };
                aggregate: {
                    args: Prisma.RefreshTokenAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateRefreshToken>;
                };
                groupBy: {
                    args: Prisma.RefreshTokenGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RefreshTokenGroupByOutputType>[];
                };
                count: {
                    args: Prisma.RefreshTokenCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.RefreshTokenCountAggregateOutputType> | number;
                };
            };
        };
        Wallet: {
            payload: Prisma.$WalletPayload<ExtArgs>;
            fields: Prisma.WalletFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.WalletFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.WalletFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload>;
                };
                findFirst: {
                    args: Prisma.WalletFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.WalletFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload>;
                };
                findMany: {
                    args: Prisma.WalletFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload>[];
                };
                create: {
                    args: Prisma.WalletCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload>;
                };
                createMany: {
                    args: Prisma.WalletCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.WalletCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload>[];
                };
                delete: {
                    args: Prisma.WalletDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload>;
                };
                update: {
                    args: Prisma.WalletUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload>;
                };
                deleteMany: {
                    args: Prisma.WalletDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.WalletUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.WalletUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload>[];
                };
                upsert: {
                    args: Prisma.WalletUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$WalletPayload>;
                };
                aggregate: {
                    args: Prisma.WalletAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateWallet>;
                };
                groupBy: {
                    args: Prisma.WalletGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WalletGroupByOutputType>[];
                };
                count: {
                    args: Prisma.WalletCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.WalletCountAggregateOutputType> | number;
                };
            };
        };
        Transaction: {
            payload: Prisma.$TransactionPayload<ExtArgs>;
            fields: Prisma.TransactionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.TransactionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.TransactionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                findFirst: {
                    args: Prisma.TransactionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.TransactionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                findMany: {
                    args: Prisma.TransactionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>[];
                };
                create: {
                    args: Prisma.TransactionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                createMany: {
                    args: Prisma.TransactionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.TransactionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>[];
                };
                delete: {
                    args: Prisma.TransactionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                update: {
                    args: Prisma.TransactionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                deleteMany: {
                    args: Prisma.TransactionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.TransactionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.TransactionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>[];
                };
                upsert: {
                    args: Prisma.TransactionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$TransactionPayload>;
                };
                aggregate: {
                    args: Prisma.TransactionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateTransaction>;
                };
                groupBy: {
                    args: Prisma.TransactionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TransactionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.TransactionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.TransactionCountAggregateOutputType> | number;
                };
            };
        };
        Escrow: {
            payload: Prisma.$EscrowPayload<ExtArgs>;
            fields: Prisma.EscrowFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.EscrowFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.EscrowFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload>;
                };
                findFirst: {
                    args: Prisma.EscrowFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.EscrowFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload>;
                };
                findMany: {
                    args: Prisma.EscrowFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload>[];
                };
                create: {
                    args: Prisma.EscrowCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload>;
                };
                createMany: {
                    args: Prisma.EscrowCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.EscrowCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload>[];
                };
                delete: {
                    args: Prisma.EscrowDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload>;
                };
                update: {
                    args: Prisma.EscrowUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload>;
                };
                deleteMany: {
                    args: Prisma.EscrowDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.EscrowUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.EscrowUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload>[];
                };
                upsert: {
                    args: Prisma.EscrowUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$EscrowPayload>;
                };
                aggregate: {
                    args: Prisma.EscrowAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateEscrow>;
                };
                groupBy: {
                    args: Prisma.EscrowGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.EscrowGroupByOutputType>[];
                };
                count: {
                    args: Prisma.EscrowCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.EscrowCountAggregateOutputType> | number;
                };
            };
        };
        Admire: {
            payload: Prisma.$AdmirePayload<ExtArgs>;
            fields: Prisma.AdmireFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.AdmireFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.AdmireFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload>;
                };
                findFirst: {
                    args: Prisma.AdmireFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.AdmireFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload>;
                };
                findMany: {
                    args: Prisma.AdmireFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload>[];
                };
                create: {
                    args: Prisma.AdmireCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload>;
                };
                createMany: {
                    args: Prisma.AdmireCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.AdmireCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload>[];
                };
                delete: {
                    args: Prisma.AdmireDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload>;
                };
                update: {
                    args: Prisma.AdmireUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload>;
                };
                deleteMany: {
                    args: Prisma.AdmireDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.AdmireUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.AdmireUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload>[];
                };
                upsert: {
                    args: Prisma.AdmireUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$AdmirePayload>;
                };
                aggregate: {
                    args: Prisma.AdmireAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAdmire>;
                };
                groupBy: {
                    args: Prisma.AdmireGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AdmireGroupByOutputType>[];
                };
                count: {
                    args: Prisma.AdmireCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AdmireCountAggregateOutputType> | number;
                };
            };
        };
        BioLink: {
            payload: Prisma.$BioLinkPayload<ExtArgs>;
            fields: Prisma.BioLinkFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.BioLinkFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.BioLinkFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload>;
                };
                findFirst: {
                    args: Prisma.BioLinkFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.BioLinkFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload>;
                };
                findMany: {
                    args: Prisma.BioLinkFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload>[];
                };
                create: {
                    args: Prisma.BioLinkCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload>;
                };
                createMany: {
                    args: Prisma.BioLinkCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.BioLinkCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload>[];
                };
                delete: {
                    args: Prisma.BioLinkDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload>;
                };
                update: {
                    args: Prisma.BioLinkUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload>;
                };
                deleteMany: {
                    args: Prisma.BioLinkDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.BioLinkUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.BioLinkUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload>[];
                };
                upsert: {
                    args: Prisma.BioLinkUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$BioLinkPayload>;
                };
                aggregate: {
                    args: Prisma.BioLinkAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateBioLink>;
                };
                groupBy: {
                    args: Prisma.BioLinkGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.BioLinkGroupByOutputType>[];
                };
                count: {
                    args: Prisma.BioLinkCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.BioLinkCountAggregateOutputType> | number;
                };
            };
        };
        SubscriptionTier: {
            payload: Prisma.$SubscriptionTierPayload<ExtArgs>;
            fields: Prisma.SubscriptionTierFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SubscriptionTierFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SubscriptionTierFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload>;
                };
                findFirst: {
                    args: Prisma.SubscriptionTierFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SubscriptionTierFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload>;
                };
                findMany: {
                    args: Prisma.SubscriptionTierFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload>[];
                };
                create: {
                    args: Prisma.SubscriptionTierCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload>;
                };
                createMany: {
                    args: Prisma.SubscriptionTierCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SubscriptionTierCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload>[];
                };
                delete: {
                    args: Prisma.SubscriptionTierDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload>;
                };
                update: {
                    args: Prisma.SubscriptionTierUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload>;
                };
                deleteMany: {
                    args: Prisma.SubscriptionTierDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SubscriptionTierUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SubscriptionTierUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload>[];
                };
                upsert: {
                    args: Prisma.SubscriptionTierUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionTierPayload>;
                };
                aggregate: {
                    args: Prisma.SubscriptionTierAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSubscriptionTier>;
                };
                groupBy: {
                    args: Prisma.SubscriptionTierGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubscriptionTierGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SubscriptionTierCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubscriptionTierCountAggregateOutputType> | number;
                };
            };
        };
        Subscription: {
            payload: Prisma.$SubscriptionPayload<ExtArgs>;
            fields: Prisma.SubscriptionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.SubscriptionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.SubscriptionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                findFirst: {
                    args: Prisma.SubscriptionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.SubscriptionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                findMany: {
                    args: Prisma.SubscriptionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>[];
                };
                create: {
                    args: Prisma.SubscriptionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                createMany: {
                    args: Prisma.SubscriptionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.SubscriptionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>[];
                };
                delete: {
                    args: Prisma.SubscriptionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                update: {
                    args: Prisma.SubscriptionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                deleteMany: {
                    args: Prisma.SubscriptionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.SubscriptionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.SubscriptionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>[];
                };
                upsert: {
                    args: Prisma.SubscriptionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$SubscriptionPayload>;
                };
                aggregate: {
                    args: Prisma.SubscriptionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateSubscription>;
                };
                groupBy: {
                    args: Prisma.SubscriptionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubscriptionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.SubscriptionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.SubscriptionCountAggregateOutputType> | number;
                };
            };
        };
        Milestone: {
            payload: Prisma.$MilestonePayload<ExtArgs>;
            fields: Prisma.MilestoneFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.MilestoneFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.MilestoneFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload>;
                };
                findFirst: {
                    args: Prisma.MilestoneFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.MilestoneFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload>;
                };
                findMany: {
                    args: Prisma.MilestoneFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload>[];
                };
                create: {
                    args: Prisma.MilestoneCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload>;
                };
                createMany: {
                    args: Prisma.MilestoneCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.MilestoneCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload>[];
                };
                delete: {
                    args: Prisma.MilestoneDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload>;
                };
                update: {
                    args: Prisma.MilestoneUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload>;
                };
                deleteMany: {
                    args: Prisma.MilestoneDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.MilestoneUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.MilestoneUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload>[];
                };
                upsert: {
                    args: Prisma.MilestoneUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestonePayload>;
                };
                aggregate: {
                    args: Prisma.MilestoneAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateMilestone>;
                };
                groupBy: {
                    args: Prisma.MilestoneGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MilestoneGroupByOutputType>[];
                };
                count: {
                    args: Prisma.MilestoneCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MilestoneCountAggregateOutputType> | number;
                };
            };
        };
        MilestoneCompletion: {
            payload: Prisma.$MilestoneCompletionPayload<ExtArgs>;
            fields: Prisma.MilestoneCompletionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.MilestoneCompletionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.MilestoneCompletionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload>;
                };
                findFirst: {
                    args: Prisma.MilestoneCompletionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.MilestoneCompletionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload>;
                };
                findMany: {
                    args: Prisma.MilestoneCompletionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload>[];
                };
                create: {
                    args: Prisma.MilestoneCompletionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload>;
                };
                createMany: {
                    args: Prisma.MilestoneCompletionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.MilestoneCompletionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload>[];
                };
                delete: {
                    args: Prisma.MilestoneCompletionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload>;
                };
                update: {
                    args: Prisma.MilestoneCompletionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload>;
                };
                deleteMany: {
                    args: Prisma.MilestoneCompletionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.MilestoneCompletionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.MilestoneCompletionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload>[];
                };
                upsert: {
                    args: Prisma.MilestoneCompletionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$MilestoneCompletionPayload>;
                };
                aggregate: {
                    args: Prisma.MilestoneCompletionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateMilestoneCompletion>;
                };
                groupBy: {
                    args: Prisma.MilestoneCompletionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MilestoneCompletionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.MilestoneCompletionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.MilestoneCompletionCountAggregateOutputType> | number;
                };
            };
        };
        Short: {
            payload: Prisma.$ShortPayload<ExtArgs>;
            fields: Prisma.ShortFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ShortFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ShortFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload>;
                };
                findFirst: {
                    args: Prisma.ShortFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ShortFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload>;
                };
                findMany: {
                    args: Prisma.ShortFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload>[];
                };
                create: {
                    args: Prisma.ShortCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload>;
                };
                createMany: {
                    args: Prisma.ShortCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ShortCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload>[];
                };
                delete: {
                    args: Prisma.ShortDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload>;
                };
                update: {
                    args: Prisma.ShortUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload>;
                };
                deleteMany: {
                    args: Prisma.ShortDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ShortUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ShortUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload>[];
                };
                upsert: {
                    args: Prisma.ShortUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortPayload>;
                };
                aggregate: {
                    args: Prisma.ShortAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateShort>;
                };
                groupBy: {
                    args: Prisma.ShortGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ShortGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ShortCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ShortCountAggregateOutputType> | number;
                };
            };
        };
        ShortCollection: {
            payload: Prisma.$ShortCollectionPayload<ExtArgs>;
            fields: Prisma.ShortCollectionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ShortCollectionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ShortCollectionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload>;
                };
                findFirst: {
                    args: Prisma.ShortCollectionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ShortCollectionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload>;
                };
                findMany: {
                    args: Prisma.ShortCollectionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload>[];
                };
                create: {
                    args: Prisma.ShortCollectionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload>;
                };
                createMany: {
                    args: Prisma.ShortCollectionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ShortCollectionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload>[];
                };
                delete: {
                    args: Prisma.ShortCollectionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload>;
                };
                update: {
                    args: Prisma.ShortCollectionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload>;
                };
                deleteMany: {
                    args: Prisma.ShortCollectionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ShortCollectionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ShortCollectionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload>[];
                };
                upsert: {
                    args: Prisma.ShortCollectionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCollectionPayload>;
                };
                aggregate: {
                    args: Prisma.ShortCollectionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateShortCollection>;
                };
                groupBy: {
                    args: Prisma.ShortCollectionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ShortCollectionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ShortCollectionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ShortCollectionCountAggregateOutputType> | number;
                };
            };
        };
        ShortLike: {
            payload: Prisma.$ShortLikePayload<ExtArgs>;
            fields: Prisma.ShortLikeFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ShortLikeFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ShortLikeFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload>;
                };
                findFirst: {
                    args: Prisma.ShortLikeFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ShortLikeFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload>;
                };
                findMany: {
                    args: Prisma.ShortLikeFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload>[];
                };
                create: {
                    args: Prisma.ShortLikeCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload>;
                };
                createMany: {
                    args: Prisma.ShortLikeCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ShortLikeCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload>[];
                };
                delete: {
                    args: Prisma.ShortLikeDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload>;
                };
                update: {
                    args: Prisma.ShortLikeUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload>;
                };
                deleteMany: {
                    args: Prisma.ShortLikeDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ShortLikeUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ShortLikeUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload>[];
                };
                upsert: {
                    args: Prisma.ShortLikeUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortLikePayload>;
                };
                aggregate: {
                    args: Prisma.ShortLikeAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateShortLike>;
                };
                groupBy: {
                    args: Prisma.ShortLikeGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ShortLikeGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ShortLikeCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ShortLikeCountAggregateOutputType> | number;
                };
            };
        };
        ShortComment: {
            payload: Prisma.$ShortCommentPayload<ExtArgs>;
            fields: Prisma.ShortCommentFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ShortCommentFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ShortCommentFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload>;
                };
                findFirst: {
                    args: Prisma.ShortCommentFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ShortCommentFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload>;
                };
                findMany: {
                    args: Prisma.ShortCommentFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload>[];
                };
                create: {
                    args: Prisma.ShortCommentCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload>;
                };
                createMany: {
                    args: Prisma.ShortCommentCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ShortCommentCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload>[];
                };
                delete: {
                    args: Prisma.ShortCommentDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload>;
                };
                update: {
                    args: Prisma.ShortCommentUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload>;
                };
                deleteMany: {
                    args: Prisma.ShortCommentDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ShortCommentUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ShortCommentUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload>[];
                };
                upsert: {
                    args: Prisma.ShortCommentUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ShortCommentPayload>;
                };
                aggregate: {
                    args: Prisma.ShortCommentAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateShortComment>;
                };
                groupBy: {
                    args: Prisma.ShortCommentGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ShortCommentGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ShortCommentCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ShortCommentCountAggregateOutputType> | number;
                };
            };
        };
        Post: {
            payload: Prisma.$PostPayload<ExtArgs>;
            fields: Prisma.PostFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PostFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PostFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                findFirst: {
                    args: Prisma.PostFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PostFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                findMany: {
                    args: Prisma.PostFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>[];
                };
                create: {
                    args: Prisma.PostCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                createMany: {
                    args: Prisma.PostCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PostCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>[];
                };
                delete: {
                    args: Prisma.PostDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                update: {
                    args: Prisma.PostUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                deleteMany: {
                    args: Prisma.PostDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PostUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PostUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>[];
                };
                upsert: {
                    args: Prisma.PostUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostPayload>;
                };
                aggregate: {
                    args: Prisma.PostAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePost>;
                };
                groupBy: {
                    args: Prisma.PostGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PostGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PostCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PostCountAggregateOutputType> | number;
                };
            };
        };
        PostLike: {
            payload: Prisma.$PostLikePayload<ExtArgs>;
            fields: Prisma.PostLikeFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PostLikeFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PostLikeFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload>;
                };
                findFirst: {
                    args: Prisma.PostLikeFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PostLikeFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload>;
                };
                findMany: {
                    args: Prisma.PostLikeFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload>[];
                };
                create: {
                    args: Prisma.PostLikeCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload>;
                };
                createMany: {
                    args: Prisma.PostLikeCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PostLikeCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload>[];
                };
                delete: {
                    args: Prisma.PostLikeDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload>;
                };
                update: {
                    args: Prisma.PostLikeUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload>;
                };
                deleteMany: {
                    args: Prisma.PostLikeDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PostLikeUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PostLikeUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload>[];
                };
                upsert: {
                    args: Prisma.PostLikeUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostLikePayload>;
                };
                aggregate: {
                    args: Prisma.PostLikeAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePostLike>;
                };
                groupBy: {
                    args: Prisma.PostLikeGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PostLikeGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PostLikeCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PostLikeCountAggregateOutputType> | number;
                };
            };
        };
        PostComment: {
            payload: Prisma.$PostCommentPayload<ExtArgs>;
            fields: Prisma.PostCommentFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.PostCommentFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.PostCommentFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload>;
                };
                findFirst: {
                    args: Prisma.PostCommentFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.PostCommentFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload>;
                };
                findMany: {
                    args: Prisma.PostCommentFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload>[];
                };
                create: {
                    args: Prisma.PostCommentCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload>;
                };
                createMany: {
                    args: Prisma.PostCommentCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.PostCommentCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload>[];
                };
                delete: {
                    args: Prisma.PostCommentDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload>;
                };
                update: {
                    args: Prisma.PostCommentUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload>;
                };
                deleteMany: {
                    args: Prisma.PostCommentDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.PostCommentUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.PostCommentUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload>[];
                };
                upsert: {
                    args: Prisma.PostCommentUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$PostCommentPayload>;
                };
                aggregate: {
                    args: Prisma.PostCommentAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregatePostComment>;
                };
                groupBy: {
                    args: Prisma.PostCommentGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PostCommentGroupByOutputType>[];
                };
                count: {
                    args: Prisma.PostCommentCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.PostCommentCountAggregateOutputType> | number;
                };
            };
        };
        Contest: {
            payload: Prisma.$ContestPayload<ExtArgs>;
            fields: Prisma.ContestFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ContestFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ContestFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload>;
                };
                findFirst: {
                    args: Prisma.ContestFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ContestFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload>;
                };
                findMany: {
                    args: Prisma.ContestFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload>[];
                };
                create: {
                    args: Prisma.ContestCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload>;
                };
                createMany: {
                    args: Prisma.ContestCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ContestCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload>[];
                };
                delete: {
                    args: Prisma.ContestDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload>;
                };
                update: {
                    args: Prisma.ContestUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload>;
                };
                deleteMany: {
                    args: Prisma.ContestDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ContestUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ContestUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload>[];
                };
                upsert: {
                    args: Prisma.ContestUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPayload>;
                };
                aggregate: {
                    args: Prisma.ContestAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateContest>;
                };
                groupBy: {
                    args: Prisma.ContestGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ContestCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestCountAggregateOutputType> | number;
                };
            };
        };
        ContestAction: {
            payload: Prisma.$ContestActionPayload<ExtArgs>;
            fields: Prisma.ContestActionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ContestActionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ContestActionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload>;
                };
                findFirst: {
                    args: Prisma.ContestActionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ContestActionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload>;
                };
                findMany: {
                    args: Prisma.ContestActionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload>[];
                };
                create: {
                    args: Prisma.ContestActionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload>;
                };
                createMany: {
                    args: Prisma.ContestActionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ContestActionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload>[];
                };
                delete: {
                    args: Prisma.ContestActionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload>;
                };
                update: {
                    args: Prisma.ContestActionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload>;
                };
                deleteMany: {
                    args: Prisma.ContestActionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ContestActionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ContestActionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload>[];
                };
                upsert: {
                    args: Prisma.ContestActionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionPayload>;
                };
                aggregate: {
                    args: Prisma.ContestActionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateContestAction>;
                };
                groupBy: {
                    args: Prisma.ContestActionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestActionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ContestActionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestActionCountAggregateOutputType> | number;
                };
            };
        };
        ContestPrizeDistribution: {
            payload: Prisma.$ContestPrizeDistributionPayload<ExtArgs>;
            fields: Prisma.ContestPrizeDistributionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ContestPrizeDistributionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ContestPrizeDistributionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload>;
                };
                findFirst: {
                    args: Prisma.ContestPrizeDistributionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ContestPrizeDistributionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload>;
                };
                findMany: {
                    args: Prisma.ContestPrizeDistributionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload>[];
                };
                create: {
                    args: Prisma.ContestPrizeDistributionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload>;
                };
                createMany: {
                    args: Prisma.ContestPrizeDistributionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ContestPrizeDistributionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload>[];
                };
                delete: {
                    args: Prisma.ContestPrizeDistributionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload>;
                };
                update: {
                    args: Prisma.ContestPrizeDistributionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload>;
                };
                deleteMany: {
                    args: Prisma.ContestPrizeDistributionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ContestPrizeDistributionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ContestPrizeDistributionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload>[];
                };
                upsert: {
                    args: Prisma.ContestPrizeDistributionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestPrizeDistributionPayload>;
                };
                aggregate: {
                    args: Prisma.ContestPrizeDistributionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateContestPrizeDistribution>;
                };
                groupBy: {
                    args: Prisma.ContestPrizeDistributionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestPrizeDistributionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ContestPrizeDistributionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestPrizeDistributionCountAggregateOutputType> | number;
                };
            };
        };
        ContestParticipant: {
            payload: Prisma.$ContestParticipantPayload<ExtArgs>;
            fields: Prisma.ContestParticipantFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ContestParticipantFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ContestParticipantFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload>;
                };
                findFirst: {
                    args: Prisma.ContestParticipantFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ContestParticipantFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload>;
                };
                findMany: {
                    args: Prisma.ContestParticipantFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload>[];
                };
                create: {
                    args: Prisma.ContestParticipantCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload>;
                };
                createMany: {
                    args: Prisma.ContestParticipantCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ContestParticipantCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload>[];
                };
                delete: {
                    args: Prisma.ContestParticipantDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload>;
                };
                update: {
                    args: Prisma.ContestParticipantUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload>;
                };
                deleteMany: {
                    args: Prisma.ContestParticipantDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ContestParticipantUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ContestParticipantUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload>[];
                };
                upsert: {
                    args: Prisma.ContestParticipantUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestParticipantPayload>;
                };
                aggregate: {
                    args: Prisma.ContestParticipantAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateContestParticipant>;
                };
                groupBy: {
                    args: Prisma.ContestParticipantGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestParticipantGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ContestParticipantCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestParticipantCountAggregateOutputType> | number;
                };
            };
        };
        ContestSubmission: {
            payload: Prisma.$ContestSubmissionPayload<ExtArgs>;
            fields: Prisma.ContestSubmissionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ContestSubmissionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ContestSubmissionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload>;
                };
                findFirst: {
                    args: Prisma.ContestSubmissionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ContestSubmissionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload>;
                };
                findMany: {
                    args: Prisma.ContestSubmissionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload>[];
                };
                create: {
                    args: Prisma.ContestSubmissionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload>;
                };
                createMany: {
                    args: Prisma.ContestSubmissionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ContestSubmissionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload>[];
                };
                delete: {
                    args: Prisma.ContestSubmissionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload>;
                };
                update: {
                    args: Prisma.ContestSubmissionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload>;
                };
                deleteMany: {
                    args: Prisma.ContestSubmissionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ContestSubmissionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ContestSubmissionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload>[];
                };
                upsert: {
                    args: Prisma.ContestSubmissionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestSubmissionPayload>;
                };
                aggregate: {
                    args: Prisma.ContestSubmissionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateContestSubmission>;
                };
                groupBy: {
                    args: Prisma.ContestSubmissionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestSubmissionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ContestSubmissionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestSubmissionCountAggregateOutputType> | number;
                };
            };
        };
        ContestActionCompletion: {
            payload: Prisma.$ContestActionCompletionPayload<ExtArgs>;
            fields: Prisma.ContestActionCompletionFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ContestActionCompletionFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ContestActionCompletionFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload>;
                };
                findFirst: {
                    args: Prisma.ContestActionCompletionFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ContestActionCompletionFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload>;
                };
                findMany: {
                    args: Prisma.ContestActionCompletionFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload>[];
                };
                create: {
                    args: Prisma.ContestActionCompletionCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload>;
                };
                createMany: {
                    args: Prisma.ContestActionCompletionCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ContestActionCompletionCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload>[];
                };
                delete: {
                    args: Prisma.ContestActionCompletionDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload>;
                };
                update: {
                    args: Prisma.ContestActionCompletionUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload>;
                };
                deleteMany: {
                    args: Prisma.ContestActionCompletionDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ContestActionCompletionUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ContestActionCompletionUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload>[];
                };
                upsert: {
                    args: Prisma.ContestActionCompletionUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestActionCompletionPayload>;
                };
                aggregate: {
                    args: Prisma.ContestActionCompletionAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateContestActionCompletion>;
                };
                groupBy: {
                    args: Prisma.ContestActionCompletionGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestActionCompletionGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ContestActionCompletionCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestActionCompletionCountAggregateOutputType> | number;
                };
            };
        };
        ContestWinner: {
            payload: Prisma.$ContestWinnerPayload<ExtArgs>;
            fields: Prisma.ContestWinnerFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ContestWinnerFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ContestWinnerFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload>;
                };
                findFirst: {
                    args: Prisma.ContestWinnerFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ContestWinnerFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload>;
                };
                findMany: {
                    args: Prisma.ContestWinnerFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload>[];
                };
                create: {
                    args: Prisma.ContestWinnerCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload>;
                };
                createMany: {
                    args: Prisma.ContestWinnerCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ContestWinnerCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload>[];
                };
                delete: {
                    args: Prisma.ContestWinnerDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload>;
                };
                update: {
                    args: Prisma.ContestWinnerUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload>;
                };
                deleteMany: {
                    args: Prisma.ContestWinnerDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ContestWinnerUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ContestWinnerUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload>[];
                };
                upsert: {
                    args: Prisma.ContestWinnerUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestWinnerPayload>;
                };
                aggregate: {
                    args: Prisma.ContestWinnerAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateContestWinner>;
                };
                groupBy: {
                    args: Prisma.ContestWinnerGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestWinnerGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ContestWinnerCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestWinnerCountAggregateOutputType> | number;
                };
            };
        };
        ContestJudge: {
            payload: Prisma.$ContestJudgePayload<ExtArgs>;
            fields: Prisma.ContestJudgeFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ContestJudgeFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ContestJudgeFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload>;
                };
                findFirst: {
                    args: Prisma.ContestJudgeFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ContestJudgeFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload>;
                };
                findMany: {
                    args: Prisma.ContestJudgeFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload>[];
                };
                create: {
                    args: Prisma.ContestJudgeCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload>;
                };
                createMany: {
                    args: Prisma.ContestJudgeCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ContestJudgeCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload>[];
                };
                delete: {
                    args: Prisma.ContestJudgeDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload>;
                };
                update: {
                    args: Prisma.ContestJudgeUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload>;
                };
                deleteMany: {
                    args: Prisma.ContestJudgeDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ContestJudgeUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ContestJudgeUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload>[];
                };
                upsert: {
                    args: Prisma.ContestJudgeUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestJudgePayload>;
                };
                aggregate: {
                    args: Prisma.ContestJudgeAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateContestJudge>;
                };
                groupBy: {
                    args: Prisma.ContestJudgeGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestJudgeGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ContestJudgeCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestJudgeCountAggregateOutputType> | number;
                };
            };
        };
        ContestVote: {
            payload: Prisma.$ContestVotePayload<ExtArgs>;
            fields: Prisma.ContestVoteFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ContestVoteFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ContestVoteFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload>;
                };
                findFirst: {
                    args: Prisma.ContestVoteFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ContestVoteFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload>;
                };
                findMany: {
                    args: Prisma.ContestVoteFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload>[];
                };
                create: {
                    args: Prisma.ContestVoteCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload>;
                };
                createMany: {
                    args: Prisma.ContestVoteCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ContestVoteCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload>[];
                };
                delete: {
                    args: Prisma.ContestVoteDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload>;
                };
                update: {
                    args: Prisma.ContestVoteUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload>;
                };
                deleteMany: {
                    args: Prisma.ContestVoteDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ContestVoteUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ContestVoteUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload>[];
                };
                upsert: {
                    args: Prisma.ContestVoteUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ContestVotePayload>;
                };
                aggregate: {
                    args: Prisma.ContestVoteAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateContestVote>;
                };
                groupBy: {
                    args: Prisma.ContestVoteGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestVoteGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ContestVoteCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ContestVoteCountAggregateOutputType> | number;
                };
            };
        };
        Product: {
            payload: Prisma.$ProductPayload<ExtArgs>;
            fields: Prisma.ProductFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.ProductFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.ProductFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload>;
                };
                findFirst: {
                    args: Prisma.ProductFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.ProductFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload>;
                };
                findMany: {
                    args: Prisma.ProductFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload>[];
                };
                create: {
                    args: Prisma.ProductCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload>;
                };
                createMany: {
                    args: Prisma.ProductCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.ProductCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload>[];
                };
                delete: {
                    args: Prisma.ProductDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload>;
                };
                update: {
                    args: Prisma.ProductUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload>;
                };
                deleteMany: {
                    args: Prisma.ProductDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.ProductUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.ProductUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload>[];
                };
                upsert: {
                    args: Prisma.ProductUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$ProductPayload>;
                };
                aggregate: {
                    args: Prisma.ProductAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateProduct>;
                };
                groupBy: {
                    args: Prisma.ProductGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ProductGroupByOutputType>[];
                };
                count: {
                    args: Prisma.ProductCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ProductCountAggregateOutputType> | number;
                };
            };
        };
        DailyStat: {
            payload: Prisma.$DailyStatPayload<ExtArgs>;
            fields: Prisma.DailyStatFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.DailyStatFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.DailyStatFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload>;
                };
                findFirst: {
                    args: Prisma.DailyStatFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.DailyStatFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload>;
                };
                findMany: {
                    args: Prisma.DailyStatFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload>[];
                };
                create: {
                    args: Prisma.DailyStatCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload>;
                };
                createMany: {
                    args: Prisma.DailyStatCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.DailyStatCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload>[];
                };
                delete: {
                    args: Prisma.DailyStatDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload>;
                };
                update: {
                    args: Prisma.DailyStatUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload>;
                };
                deleteMany: {
                    args: Prisma.DailyStatDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.DailyStatUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.DailyStatUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload>[];
                };
                upsert: {
                    args: Prisma.DailyStatUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$DailyStatPayload>;
                };
                aggregate: {
                    args: Prisma.DailyStatAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDailyStat>;
                };
                groupBy: {
                    args: Prisma.DailyStatGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DailyStatGroupByOutputType>[];
                };
                count: {
                    args: Prisma.DailyStatCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.DailyStatCountAggregateOutputType> | number;
                };
            };
        };
    };
} & {
    other: {
        payload: any;
        operations: {
            $executeRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $executeRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
            $queryRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $queryRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
        };
    };
};
/**
 * Enums
 */
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
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
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
    readonly DbNull: import("@prisma/client-runtime-utils").DbNullClass;
    readonly JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
    readonly AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
/**
 * Field references
 */
/**
 * Reference to a field of type 'String'
 */
export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>;
/**
 * Reference to a field of type 'String[]'
 */
export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>;
/**
 * Reference to a field of type 'AccountType'
 */
export type EnumAccountTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccountType'>;
/**
 * Reference to a field of type 'AccountType[]'
 */
export type ListEnumAccountTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccountType[]'>;
/**
 * Reference to a field of type 'Boolean'
 */
export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>;
/**
 * Reference to a field of type 'DateTime'
 */
export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>;
/**
 * Reference to a field of type 'DateTime[]'
 */
export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>;
/**
 * Reference to a field of type 'Decimal'
 */
export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>;
/**
 * Reference to a field of type 'Decimal[]'
 */
export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>;
/**
 * Reference to a field of type 'Json'
 */
export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>;
/**
 * Reference to a field of type 'QueryMode'
 */
export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>;
/**
 * Reference to a field of type 'Int'
 */
export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>;
/**
 * Reference to a field of type 'Int[]'
 */
export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>;
/**
 * Reference to a field of type 'SubscriptionTierType'
 */
export type EnumSubscriptionTierTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionTierType'>;
/**
 * Reference to a field of type 'SubscriptionTierType[]'
 */
export type ListEnumSubscriptionTierTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'SubscriptionTierType[]'>;
/**
 * Reference to a field of type 'ContestMediaType'
 */
export type EnumContestMediaTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ContestMediaType'>;
/**
 * Reference to a field of type 'ContestMediaType[]'
 */
export type ListEnumContestMediaTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ContestMediaType[]'>;
/**
 * Reference to a field of type 'JudgingCriteria'
 */
export type EnumJudgingCriteriaFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JudgingCriteria'>;
/**
 * Reference to a field of type 'JudgingCriteria[]'
 */
export type ListEnumJudgingCriteriaFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'JudgingCriteria[]'>;
/**
 * Reference to a field of type 'ContestStatus'
 */
export type EnumContestStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ContestStatus'>;
/**
 * Reference to a field of type 'ContestStatus[]'
 */
export type ListEnumContestStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'ContestStatus[]'>;
/**
 * Reference to a field of type 'RequirementType'
 */
export type EnumRequirementTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RequirementType'>;
/**
 * Reference to a field of type 'RequirementType[]'
 */
export type ListEnumRequirementTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RequirementType[]'>;
/**
 * Reference to a field of type 'Float'
 */
export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>;
/**
 * Reference to a field of type 'Float[]'
 */
export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>;
/**
 * Batch Payload for updateMany & deleteMany & createMany
 */
export type BatchPayload = {
    count: number;
};
export declare const defineExtension: runtime.Types.Extensions.ExtendsHook<"define", TypeMapCb, runtime.Types.Extensions.DefaultArgs>;
export type DefaultPrismaClient = PrismaClient;
export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
export type PrismaClientOptions = ({
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-pg`.
     */
    adapter: runtime.SqlDriverAdapterFactory;
    accelerateUrl?: never;
} | {
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl: string;
    adapter?: never;
}) & {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat;
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     *
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     *
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[];
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: TransactionIsolationLevel;
    };
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: GlobalOmitConfig;
};
export type GlobalOmitConfig = {
    user?: Prisma.UserOmit;
    refreshToken?: Prisma.RefreshTokenOmit;
    wallet?: Prisma.WalletOmit;
    transaction?: Prisma.TransactionOmit;
    escrow?: Prisma.EscrowOmit;
    admire?: Prisma.AdmireOmit;
    bioLink?: Prisma.BioLinkOmit;
    subscriptionTier?: Prisma.SubscriptionTierOmit;
    subscription?: Prisma.SubscriptionOmit;
    milestone?: Prisma.MilestoneOmit;
    milestoneCompletion?: Prisma.MilestoneCompletionOmit;
    short?: Prisma.ShortOmit;
    shortCollection?: Prisma.ShortCollectionOmit;
    shortLike?: Prisma.ShortLikeOmit;
    shortComment?: Prisma.ShortCommentOmit;
    post?: Prisma.PostOmit;
    postLike?: Prisma.PostLikeOmit;
    postComment?: Prisma.PostCommentOmit;
    contest?: Prisma.ContestOmit;
    contestAction?: Prisma.ContestActionOmit;
    contestPrizeDistribution?: Prisma.ContestPrizeDistributionOmit;
    contestParticipant?: Prisma.ContestParticipantOmit;
    contestSubmission?: Prisma.ContestSubmissionOmit;
    contestActionCompletion?: Prisma.ContestActionCompletionOmit;
    contestWinner?: Prisma.ContestWinnerOmit;
    contestJudge?: Prisma.ContestJudgeOmit;
    contestVote?: Prisma.ContestVoteOmit;
    product?: Prisma.ProductOmit;
    dailyStat?: Prisma.DailyStatOmit;
};
export type LogLevel = 'info' | 'query' | 'warn' | 'error';
export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};
export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;
export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T['level'] : T>;
export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;
export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
};
export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};
export type PrismaAction = 'findUnique' | 'findUniqueOrThrow' | 'findMany' | 'findFirst' | 'findFirstOrThrow' | 'create' | 'createMany' | 'createManyAndReturn' | 'update' | 'updateMany' | 'updateManyAndReturn' | 'upsert' | 'delete' | 'deleteMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count' | 'runCommandRaw' | 'findRaw' | 'groupBy';
/**
 * `PrismaClient` proxy available in interactive transactions.
 */
export type TransactionClient = Omit<DefaultPrismaClient, runtime.ITXClientDenyList>;
//# sourceMappingURL=prismaNamespace.d.ts.map