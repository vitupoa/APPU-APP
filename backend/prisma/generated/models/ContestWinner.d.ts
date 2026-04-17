import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model ContestWinner
 *
 */
export type ContestWinnerModel = runtime.Types.Result.DefaultSelection<Prisma.$ContestWinnerPayload>;
export type AggregateContestWinner = {
    _count: ContestWinnerCountAggregateOutputType | null;
    _avg: ContestWinnerAvgAggregateOutputType | null;
    _sum: ContestWinnerSumAggregateOutputType | null;
    _min: ContestWinnerMinAggregateOutputType | null;
    _max: ContestWinnerMaxAggregateOutputType | null;
};
export type ContestWinnerAvgAggregateOutputType = {
    rank: number | null;
    prizeKr: runtime.Decimal | null;
};
export type ContestWinnerSumAggregateOutputType = {
    rank: number | null;
    prizeKr: runtime.Decimal | null;
};
export type ContestWinnerMinAggregateOutputType = {
    id: string | null;
    contestId: string | null;
    userId: string | null;
    rank: number | null;
    prizeKr: runtime.Decimal | null;
    awardedAt: Date | null;
};
export type ContestWinnerMaxAggregateOutputType = {
    id: string | null;
    contestId: string | null;
    userId: string | null;
    rank: number | null;
    prizeKr: runtime.Decimal | null;
    awardedAt: Date | null;
};
export type ContestWinnerCountAggregateOutputType = {
    id: number;
    contestId: number;
    userId: number;
    rank: number;
    prizeKr: number;
    awardedAt: number;
    _all: number;
};
export type ContestWinnerAvgAggregateInputType = {
    rank?: true;
    prizeKr?: true;
};
export type ContestWinnerSumAggregateInputType = {
    rank?: true;
    prizeKr?: true;
};
export type ContestWinnerMinAggregateInputType = {
    id?: true;
    contestId?: true;
    userId?: true;
    rank?: true;
    prizeKr?: true;
    awardedAt?: true;
};
export type ContestWinnerMaxAggregateInputType = {
    id?: true;
    contestId?: true;
    userId?: true;
    rank?: true;
    prizeKr?: true;
    awardedAt?: true;
};
export type ContestWinnerCountAggregateInputType = {
    id?: true;
    contestId?: true;
    userId?: true;
    rank?: true;
    prizeKr?: true;
    awardedAt?: true;
    _all?: true;
};
export type ContestWinnerAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which ContestWinner to aggregate.
     */
    where?: Prisma.ContestWinnerWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestWinners to fetch.
     */
    orderBy?: Prisma.ContestWinnerOrderByWithRelationInput | Prisma.ContestWinnerOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.ContestWinnerWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestWinners from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestWinners.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ContestWinners
    **/
    _count?: true | ContestWinnerCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: ContestWinnerAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: ContestWinnerSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: ContestWinnerMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: ContestWinnerMaxAggregateInputType;
};
export type GetContestWinnerAggregateType<T extends ContestWinnerAggregateArgs> = {
    [P in keyof T & keyof AggregateContestWinner]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateContestWinner[P]> : Prisma.GetScalarType<T[P], AggregateContestWinner[P]>;
};
export type ContestWinnerGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ContestWinnerWhereInput;
    orderBy?: Prisma.ContestWinnerOrderByWithAggregationInput | Prisma.ContestWinnerOrderByWithAggregationInput[];
    by: Prisma.ContestWinnerScalarFieldEnum[] | Prisma.ContestWinnerScalarFieldEnum;
    having?: Prisma.ContestWinnerScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ContestWinnerCountAggregateInputType | true;
    _avg?: ContestWinnerAvgAggregateInputType;
    _sum?: ContestWinnerSumAggregateInputType;
    _min?: ContestWinnerMinAggregateInputType;
    _max?: ContestWinnerMaxAggregateInputType;
};
export type ContestWinnerGroupByOutputType = {
    id: string;
    contestId: string;
    userId: string;
    rank: number;
    prizeKr: runtime.Decimal;
    awardedAt: Date;
    _count: ContestWinnerCountAggregateOutputType | null;
    _avg: ContestWinnerAvgAggregateOutputType | null;
    _sum: ContestWinnerSumAggregateOutputType | null;
    _min: ContestWinnerMinAggregateOutputType | null;
    _max: ContestWinnerMaxAggregateOutputType | null;
};
type GetContestWinnerGroupByPayload<T extends ContestWinnerGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ContestWinnerGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ContestWinnerGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ContestWinnerGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ContestWinnerGroupByOutputType[P]>;
}>>;
export type ContestWinnerWhereInput = {
    AND?: Prisma.ContestWinnerWhereInput | Prisma.ContestWinnerWhereInput[];
    OR?: Prisma.ContestWinnerWhereInput[];
    NOT?: Prisma.ContestWinnerWhereInput | Prisma.ContestWinnerWhereInput[];
    id?: Prisma.StringFilter<"ContestWinner"> | string;
    contestId?: Prisma.StringFilter<"ContestWinner"> | string;
    userId?: Prisma.StringFilter<"ContestWinner"> | string;
    rank?: Prisma.IntFilter<"ContestWinner"> | number;
    prizeKr?: Prisma.DecimalFilter<"ContestWinner"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFilter<"ContestWinner"> | Date | string;
    contest?: Prisma.XOR<Prisma.ContestScalarRelationFilter, Prisma.ContestWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type ContestWinnerOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    rank?: Prisma.SortOrder;
    prizeKr?: Prisma.SortOrder;
    awardedAt?: Prisma.SortOrder;
    contest?: Prisma.ContestOrderByWithRelationInput;
    user?: Prisma.UserOrderByWithRelationInput;
};
export type ContestWinnerWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.ContestWinnerWhereInput | Prisma.ContestWinnerWhereInput[];
    OR?: Prisma.ContestWinnerWhereInput[];
    NOT?: Prisma.ContestWinnerWhereInput | Prisma.ContestWinnerWhereInput[];
    contestId?: Prisma.StringFilter<"ContestWinner"> | string;
    userId?: Prisma.StringFilter<"ContestWinner"> | string;
    rank?: Prisma.IntFilter<"ContestWinner"> | number;
    prizeKr?: Prisma.DecimalFilter<"ContestWinner"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFilter<"ContestWinner"> | Date | string;
    contest?: Prisma.XOR<Prisma.ContestScalarRelationFilter, Prisma.ContestWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id">;
export type ContestWinnerOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    rank?: Prisma.SortOrder;
    prizeKr?: Prisma.SortOrder;
    awardedAt?: Prisma.SortOrder;
    _count?: Prisma.ContestWinnerCountOrderByAggregateInput;
    _avg?: Prisma.ContestWinnerAvgOrderByAggregateInput;
    _max?: Prisma.ContestWinnerMaxOrderByAggregateInput;
    _min?: Prisma.ContestWinnerMinOrderByAggregateInput;
    _sum?: Prisma.ContestWinnerSumOrderByAggregateInput;
};
export type ContestWinnerScalarWhereWithAggregatesInput = {
    AND?: Prisma.ContestWinnerScalarWhereWithAggregatesInput | Prisma.ContestWinnerScalarWhereWithAggregatesInput[];
    OR?: Prisma.ContestWinnerScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ContestWinnerScalarWhereWithAggregatesInput | Prisma.ContestWinnerScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"ContestWinner"> | string;
    contestId?: Prisma.StringWithAggregatesFilter<"ContestWinner"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"ContestWinner"> | string;
    rank?: Prisma.IntWithAggregatesFilter<"ContestWinner"> | number;
    prizeKr?: Prisma.DecimalWithAggregatesFilter<"ContestWinner"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeWithAggregatesFilter<"ContestWinner"> | Date | string;
};
export type ContestWinnerCreateInput = {
    id?: string;
    rank: number;
    prizeKr: runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Date | string;
    contest: Prisma.ContestCreateNestedOneWithoutWinnersInput;
    user: Prisma.UserCreateNestedOneWithoutContestWinsInput;
};
export type ContestWinnerUncheckedCreateInput = {
    id?: string;
    contestId: string;
    userId: string;
    rank: number;
    prizeKr: runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Date | string;
};
export type ContestWinnerUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    prizeKr?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contest?: Prisma.ContestUpdateOneRequiredWithoutWinnersNestedInput;
    user?: Prisma.UserUpdateOneRequiredWithoutContestWinsNestedInput;
};
export type ContestWinnerUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    prizeKr?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestWinnerCreateManyInput = {
    id?: string;
    contestId: string;
    userId: string;
    rank: number;
    prizeKr: runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Date | string;
};
export type ContestWinnerUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    prizeKr?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestWinnerUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    prizeKr?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestWinnerListRelationFilter = {
    every?: Prisma.ContestWinnerWhereInput;
    some?: Prisma.ContestWinnerWhereInput;
    none?: Prisma.ContestWinnerWhereInput;
};
export type ContestWinnerOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type ContestWinnerCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    rank?: Prisma.SortOrder;
    prizeKr?: Prisma.SortOrder;
    awardedAt?: Prisma.SortOrder;
};
export type ContestWinnerAvgOrderByAggregateInput = {
    rank?: Prisma.SortOrder;
    prizeKr?: Prisma.SortOrder;
};
export type ContestWinnerMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    rank?: Prisma.SortOrder;
    prizeKr?: Prisma.SortOrder;
    awardedAt?: Prisma.SortOrder;
};
export type ContestWinnerMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    rank?: Prisma.SortOrder;
    prizeKr?: Prisma.SortOrder;
    awardedAt?: Prisma.SortOrder;
};
export type ContestWinnerSumOrderByAggregateInput = {
    rank?: Prisma.SortOrder;
    prizeKr?: Prisma.SortOrder;
};
export type ContestWinnerCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.ContestWinnerCreateWithoutUserInput, Prisma.ContestWinnerUncheckedCreateWithoutUserInput> | Prisma.ContestWinnerCreateWithoutUserInput[] | Prisma.ContestWinnerUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ContestWinnerCreateOrConnectWithoutUserInput | Prisma.ContestWinnerCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.ContestWinnerCreateManyUserInputEnvelope;
    connect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
};
export type ContestWinnerUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.ContestWinnerCreateWithoutUserInput, Prisma.ContestWinnerUncheckedCreateWithoutUserInput> | Prisma.ContestWinnerCreateWithoutUserInput[] | Prisma.ContestWinnerUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ContestWinnerCreateOrConnectWithoutUserInput | Prisma.ContestWinnerCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.ContestWinnerCreateManyUserInputEnvelope;
    connect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
};
export type ContestWinnerUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.ContestWinnerCreateWithoutUserInput, Prisma.ContestWinnerUncheckedCreateWithoutUserInput> | Prisma.ContestWinnerCreateWithoutUserInput[] | Prisma.ContestWinnerUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ContestWinnerCreateOrConnectWithoutUserInput | Prisma.ContestWinnerCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.ContestWinnerUpsertWithWhereUniqueWithoutUserInput | Prisma.ContestWinnerUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.ContestWinnerCreateManyUserInputEnvelope;
    set?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    disconnect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    delete?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    connect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    update?: Prisma.ContestWinnerUpdateWithWhereUniqueWithoutUserInput | Prisma.ContestWinnerUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.ContestWinnerUpdateManyWithWhereWithoutUserInput | Prisma.ContestWinnerUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.ContestWinnerScalarWhereInput | Prisma.ContestWinnerScalarWhereInput[];
};
export type ContestWinnerUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.ContestWinnerCreateWithoutUserInput, Prisma.ContestWinnerUncheckedCreateWithoutUserInput> | Prisma.ContestWinnerCreateWithoutUserInput[] | Prisma.ContestWinnerUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ContestWinnerCreateOrConnectWithoutUserInput | Prisma.ContestWinnerCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.ContestWinnerUpsertWithWhereUniqueWithoutUserInput | Prisma.ContestWinnerUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.ContestWinnerCreateManyUserInputEnvelope;
    set?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    disconnect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    delete?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    connect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    update?: Prisma.ContestWinnerUpdateWithWhereUniqueWithoutUserInput | Prisma.ContestWinnerUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.ContestWinnerUpdateManyWithWhereWithoutUserInput | Prisma.ContestWinnerUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.ContestWinnerScalarWhereInput | Prisma.ContestWinnerScalarWhereInput[];
};
export type ContestWinnerCreateNestedManyWithoutContestInput = {
    create?: Prisma.XOR<Prisma.ContestWinnerCreateWithoutContestInput, Prisma.ContestWinnerUncheckedCreateWithoutContestInput> | Prisma.ContestWinnerCreateWithoutContestInput[] | Prisma.ContestWinnerUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestWinnerCreateOrConnectWithoutContestInput | Prisma.ContestWinnerCreateOrConnectWithoutContestInput[];
    createMany?: Prisma.ContestWinnerCreateManyContestInputEnvelope;
    connect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
};
export type ContestWinnerUncheckedCreateNestedManyWithoutContestInput = {
    create?: Prisma.XOR<Prisma.ContestWinnerCreateWithoutContestInput, Prisma.ContestWinnerUncheckedCreateWithoutContestInput> | Prisma.ContestWinnerCreateWithoutContestInput[] | Prisma.ContestWinnerUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestWinnerCreateOrConnectWithoutContestInput | Prisma.ContestWinnerCreateOrConnectWithoutContestInput[];
    createMany?: Prisma.ContestWinnerCreateManyContestInputEnvelope;
    connect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
};
export type ContestWinnerUpdateManyWithoutContestNestedInput = {
    create?: Prisma.XOR<Prisma.ContestWinnerCreateWithoutContestInput, Prisma.ContestWinnerUncheckedCreateWithoutContestInput> | Prisma.ContestWinnerCreateWithoutContestInput[] | Prisma.ContestWinnerUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestWinnerCreateOrConnectWithoutContestInput | Prisma.ContestWinnerCreateOrConnectWithoutContestInput[];
    upsert?: Prisma.ContestWinnerUpsertWithWhereUniqueWithoutContestInput | Prisma.ContestWinnerUpsertWithWhereUniqueWithoutContestInput[];
    createMany?: Prisma.ContestWinnerCreateManyContestInputEnvelope;
    set?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    disconnect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    delete?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    connect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    update?: Prisma.ContestWinnerUpdateWithWhereUniqueWithoutContestInput | Prisma.ContestWinnerUpdateWithWhereUniqueWithoutContestInput[];
    updateMany?: Prisma.ContestWinnerUpdateManyWithWhereWithoutContestInput | Prisma.ContestWinnerUpdateManyWithWhereWithoutContestInput[];
    deleteMany?: Prisma.ContestWinnerScalarWhereInput | Prisma.ContestWinnerScalarWhereInput[];
};
export type ContestWinnerUncheckedUpdateManyWithoutContestNestedInput = {
    create?: Prisma.XOR<Prisma.ContestWinnerCreateWithoutContestInput, Prisma.ContestWinnerUncheckedCreateWithoutContestInput> | Prisma.ContestWinnerCreateWithoutContestInput[] | Prisma.ContestWinnerUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestWinnerCreateOrConnectWithoutContestInput | Prisma.ContestWinnerCreateOrConnectWithoutContestInput[];
    upsert?: Prisma.ContestWinnerUpsertWithWhereUniqueWithoutContestInput | Prisma.ContestWinnerUpsertWithWhereUniqueWithoutContestInput[];
    createMany?: Prisma.ContestWinnerCreateManyContestInputEnvelope;
    set?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    disconnect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    delete?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    connect?: Prisma.ContestWinnerWhereUniqueInput | Prisma.ContestWinnerWhereUniqueInput[];
    update?: Prisma.ContestWinnerUpdateWithWhereUniqueWithoutContestInput | Prisma.ContestWinnerUpdateWithWhereUniqueWithoutContestInput[];
    updateMany?: Prisma.ContestWinnerUpdateManyWithWhereWithoutContestInput | Prisma.ContestWinnerUpdateManyWithWhereWithoutContestInput[];
    deleteMany?: Prisma.ContestWinnerScalarWhereInput | Prisma.ContestWinnerScalarWhereInput[];
};
export type ContestWinnerCreateWithoutUserInput = {
    id?: string;
    rank: number;
    prizeKr: runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Date | string;
    contest: Prisma.ContestCreateNestedOneWithoutWinnersInput;
};
export type ContestWinnerUncheckedCreateWithoutUserInput = {
    id?: string;
    contestId: string;
    rank: number;
    prizeKr: runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Date | string;
};
export type ContestWinnerCreateOrConnectWithoutUserInput = {
    where: Prisma.ContestWinnerWhereUniqueInput;
    create: Prisma.XOR<Prisma.ContestWinnerCreateWithoutUserInput, Prisma.ContestWinnerUncheckedCreateWithoutUserInput>;
};
export type ContestWinnerCreateManyUserInputEnvelope = {
    data: Prisma.ContestWinnerCreateManyUserInput | Prisma.ContestWinnerCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type ContestWinnerUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.ContestWinnerWhereUniqueInput;
    update: Prisma.XOR<Prisma.ContestWinnerUpdateWithoutUserInput, Prisma.ContestWinnerUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.ContestWinnerCreateWithoutUserInput, Prisma.ContestWinnerUncheckedCreateWithoutUserInput>;
};
export type ContestWinnerUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.ContestWinnerWhereUniqueInput;
    data: Prisma.XOR<Prisma.ContestWinnerUpdateWithoutUserInput, Prisma.ContestWinnerUncheckedUpdateWithoutUserInput>;
};
export type ContestWinnerUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.ContestWinnerScalarWhereInput;
    data: Prisma.XOR<Prisma.ContestWinnerUpdateManyMutationInput, Prisma.ContestWinnerUncheckedUpdateManyWithoutUserInput>;
};
export type ContestWinnerScalarWhereInput = {
    AND?: Prisma.ContestWinnerScalarWhereInput | Prisma.ContestWinnerScalarWhereInput[];
    OR?: Prisma.ContestWinnerScalarWhereInput[];
    NOT?: Prisma.ContestWinnerScalarWhereInput | Prisma.ContestWinnerScalarWhereInput[];
    id?: Prisma.StringFilter<"ContestWinner"> | string;
    contestId?: Prisma.StringFilter<"ContestWinner"> | string;
    userId?: Prisma.StringFilter<"ContestWinner"> | string;
    rank?: Prisma.IntFilter<"ContestWinner"> | number;
    prizeKr?: Prisma.DecimalFilter<"ContestWinner"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFilter<"ContestWinner"> | Date | string;
};
export type ContestWinnerCreateWithoutContestInput = {
    id?: string;
    rank: number;
    prizeKr: runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutContestWinsInput;
};
export type ContestWinnerUncheckedCreateWithoutContestInput = {
    id?: string;
    userId: string;
    rank: number;
    prizeKr: runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Date | string;
};
export type ContestWinnerCreateOrConnectWithoutContestInput = {
    where: Prisma.ContestWinnerWhereUniqueInput;
    create: Prisma.XOR<Prisma.ContestWinnerCreateWithoutContestInput, Prisma.ContestWinnerUncheckedCreateWithoutContestInput>;
};
export type ContestWinnerCreateManyContestInputEnvelope = {
    data: Prisma.ContestWinnerCreateManyContestInput | Prisma.ContestWinnerCreateManyContestInput[];
    skipDuplicates?: boolean;
};
export type ContestWinnerUpsertWithWhereUniqueWithoutContestInput = {
    where: Prisma.ContestWinnerWhereUniqueInput;
    update: Prisma.XOR<Prisma.ContestWinnerUpdateWithoutContestInput, Prisma.ContestWinnerUncheckedUpdateWithoutContestInput>;
    create: Prisma.XOR<Prisma.ContestWinnerCreateWithoutContestInput, Prisma.ContestWinnerUncheckedCreateWithoutContestInput>;
};
export type ContestWinnerUpdateWithWhereUniqueWithoutContestInput = {
    where: Prisma.ContestWinnerWhereUniqueInput;
    data: Prisma.XOR<Prisma.ContestWinnerUpdateWithoutContestInput, Prisma.ContestWinnerUncheckedUpdateWithoutContestInput>;
};
export type ContestWinnerUpdateManyWithWhereWithoutContestInput = {
    where: Prisma.ContestWinnerScalarWhereInput;
    data: Prisma.XOR<Prisma.ContestWinnerUpdateManyMutationInput, Prisma.ContestWinnerUncheckedUpdateManyWithoutContestInput>;
};
export type ContestWinnerCreateManyUserInput = {
    id?: string;
    contestId: string;
    rank: number;
    prizeKr: runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Date | string;
};
export type ContestWinnerUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    prizeKr?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contest?: Prisma.ContestUpdateOneRequiredWithoutWinnersNestedInput;
};
export type ContestWinnerUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    prizeKr?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestWinnerUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    prizeKr?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestWinnerCreateManyContestInput = {
    id?: string;
    userId: string;
    rank: number;
    prizeKr: runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Date | string;
};
export type ContestWinnerUpdateWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    prizeKr?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutContestWinsNestedInput;
};
export type ContestWinnerUncheckedUpdateWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    prizeKr?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestWinnerUncheckedUpdateManyWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    prizeKr?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    awardedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestWinnerSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    userId?: boolean;
    rank?: boolean;
    prizeKr?: boolean;
    awardedAt?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestWinner"]>;
export type ContestWinnerSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    userId?: boolean;
    rank?: boolean;
    prizeKr?: boolean;
    awardedAt?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestWinner"]>;
export type ContestWinnerSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    userId?: boolean;
    rank?: boolean;
    prizeKr?: boolean;
    awardedAt?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestWinner"]>;
export type ContestWinnerSelectScalar = {
    id?: boolean;
    contestId?: boolean;
    userId?: boolean;
    rank?: boolean;
    prizeKr?: boolean;
    awardedAt?: boolean;
};
export type ContestWinnerOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "contestId" | "userId" | "rank" | "prizeKr" | "awardedAt", ExtArgs["result"]["contestWinner"]>;
export type ContestWinnerInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type ContestWinnerIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type ContestWinnerIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $ContestWinnerPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ContestWinner";
    objects: {
        contest: Prisma.$ContestPayload<ExtArgs>;
        user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        contestId: string;
        userId: string;
        rank: number;
        prizeKr: runtime.Decimal;
        awardedAt: Date;
    }, ExtArgs["result"]["contestWinner"]>;
    composites: {};
};
export type ContestWinnerGetPayload<S extends boolean | null | undefined | ContestWinnerDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload, S>;
export type ContestWinnerCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ContestWinnerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ContestWinnerCountAggregateInputType | true;
};
export interface ContestWinnerDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['ContestWinner'];
        meta: {
            name: 'ContestWinner';
        };
    };
    /**
     * Find zero or one ContestWinner that matches the filter.
     * @param {ContestWinnerFindUniqueArgs} args - Arguments to find a ContestWinner
     * @example
     * // Get one ContestWinner
     * const contestWinner = await prisma.contestWinner.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContestWinnerFindUniqueArgs>(args: Prisma.SelectSubset<T, ContestWinnerFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ContestWinnerClient<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one ContestWinner that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContestWinnerFindUniqueOrThrowArgs} args - Arguments to find a ContestWinner
     * @example
     * // Get one ContestWinner
     * const contestWinner = await prisma.contestWinner.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContestWinnerFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ContestWinnerFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ContestWinnerClient<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first ContestWinner that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestWinnerFindFirstArgs} args - Arguments to find a ContestWinner
     * @example
     * // Get one ContestWinner
     * const contestWinner = await prisma.contestWinner.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContestWinnerFindFirstArgs>(args?: Prisma.SelectSubset<T, ContestWinnerFindFirstArgs<ExtArgs>>): Prisma.Prisma__ContestWinnerClient<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first ContestWinner that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestWinnerFindFirstOrThrowArgs} args - Arguments to find a ContestWinner
     * @example
     * // Get one ContestWinner
     * const contestWinner = await prisma.contestWinner.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContestWinnerFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ContestWinnerFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ContestWinnerClient<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more ContestWinners that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestWinnerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContestWinners
     * const contestWinners = await prisma.contestWinner.findMany()
     *
     * // Get first 10 ContestWinners
     * const contestWinners = await prisma.contestWinner.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const contestWinnerWithIdOnly = await prisma.contestWinner.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ContestWinnerFindManyArgs>(args?: Prisma.SelectSubset<T, ContestWinnerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a ContestWinner.
     * @param {ContestWinnerCreateArgs} args - Arguments to create a ContestWinner.
     * @example
     * // Create one ContestWinner
     * const ContestWinner = await prisma.contestWinner.create({
     *   data: {
     *     // ... data to create a ContestWinner
     *   }
     * })
     *
     */
    create<T extends ContestWinnerCreateArgs>(args: Prisma.SelectSubset<T, ContestWinnerCreateArgs<ExtArgs>>): Prisma.Prisma__ContestWinnerClient<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many ContestWinners.
     * @param {ContestWinnerCreateManyArgs} args - Arguments to create many ContestWinners.
     * @example
     * // Create many ContestWinners
     * const contestWinner = await prisma.contestWinner.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ContestWinnerCreateManyArgs>(args?: Prisma.SelectSubset<T, ContestWinnerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many ContestWinners and returns the data saved in the database.
     * @param {ContestWinnerCreateManyAndReturnArgs} args - Arguments to create many ContestWinners.
     * @example
     * // Create many ContestWinners
     * const contestWinner = await prisma.contestWinner.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ContestWinners and only return the `id`
     * const contestWinnerWithIdOnly = await prisma.contestWinner.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ContestWinnerCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ContestWinnerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a ContestWinner.
     * @param {ContestWinnerDeleteArgs} args - Arguments to delete one ContestWinner.
     * @example
     * // Delete one ContestWinner
     * const ContestWinner = await prisma.contestWinner.delete({
     *   where: {
     *     // ... filter to delete one ContestWinner
     *   }
     * })
     *
     */
    delete<T extends ContestWinnerDeleteArgs>(args: Prisma.SelectSubset<T, ContestWinnerDeleteArgs<ExtArgs>>): Prisma.Prisma__ContestWinnerClient<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one ContestWinner.
     * @param {ContestWinnerUpdateArgs} args - Arguments to update one ContestWinner.
     * @example
     * // Update one ContestWinner
     * const contestWinner = await prisma.contestWinner.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ContestWinnerUpdateArgs>(args: Prisma.SelectSubset<T, ContestWinnerUpdateArgs<ExtArgs>>): Prisma.Prisma__ContestWinnerClient<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more ContestWinners.
     * @param {ContestWinnerDeleteManyArgs} args - Arguments to filter ContestWinners to delete.
     * @example
     * // Delete a few ContestWinners
     * const { count } = await prisma.contestWinner.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ContestWinnerDeleteManyArgs>(args?: Prisma.SelectSubset<T, ContestWinnerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more ContestWinners.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestWinnerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContestWinners
     * const contestWinner = await prisma.contestWinner.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ContestWinnerUpdateManyArgs>(args: Prisma.SelectSubset<T, ContestWinnerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more ContestWinners and returns the data updated in the database.
     * @param {ContestWinnerUpdateManyAndReturnArgs} args - Arguments to update many ContestWinners.
     * @example
     * // Update many ContestWinners
     * const contestWinner = await prisma.contestWinner.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ContestWinners and only return the `id`
     * const contestWinnerWithIdOnly = await prisma.contestWinner.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    updateManyAndReturn<T extends ContestWinnerUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ContestWinnerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one ContestWinner.
     * @param {ContestWinnerUpsertArgs} args - Arguments to update or create a ContestWinner.
     * @example
     * // Update or create a ContestWinner
     * const contestWinner = await prisma.contestWinner.upsert({
     *   create: {
     *     // ... data to create a ContestWinner
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContestWinner we want to update
     *   }
     * })
     */
    upsert<T extends ContestWinnerUpsertArgs>(args: Prisma.SelectSubset<T, ContestWinnerUpsertArgs<ExtArgs>>): Prisma.Prisma__ContestWinnerClient<runtime.Types.Result.GetResult<Prisma.$ContestWinnerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of ContestWinners.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestWinnerCountArgs} args - Arguments to filter ContestWinners to count.
     * @example
     * // Count the number of ContestWinners
     * const count = await prisma.contestWinner.count({
     *   where: {
     *     // ... the filter for the ContestWinners we want to count
     *   }
     * })
    **/
    count<T extends ContestWinnerCountArgs>(args?: Prisma.Subset<T, ContestWinnerCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ContestWinnerCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a ContestWinner.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestWinnerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ContestWinnerAggregateArgs>(args: Prisma.Subset<T, ContestWinnerAggregateArgs>): Prisma.PrismaPromise<GetContestWinnerAggregateType<T>>;
    /**
     * Group by ContestWinner.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestWinnerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
    **/
    groupBy<T extends ContestWinnerGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ContestWinnerGroupByArgs['orderBy'];
    } : {
        orderBy?: ContestWinnerGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ContestWinnerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContestWinnerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the ContestWinner model
     */
    readonly fields: ContestWinnerFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for ContestWinner.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__ContestWinnerClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    contest<T extends Prisma.ContestDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ContestDefaultArgs<ExtArgs>>): Prisma.Prisma__ContestClient<runtime.Types.Result.GetResult<Prisma.$ContestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
/**
 * Fields of the ContestWinner model
 */
export interface ContestWinnerFieldRefs {
    readonly id: Prisma.FieldRef<"ContestWinner", 'String'>;
    readonly contestId: Prisma.FieldRef<"ContestWinner", 'String'>;
    readonly userId: Prisma.FieldRef<"ContestWinner", 'String'>;
    readonly rank: Prisma.FieldRef<"ContestWinner", 'Int'>;
    readonly prizeKr: Prisma.FieldRef<"ContestWinner", 'Decimal'>;
    readonly awardedAt: Prisma.FieldRef<"ContestWinner", 'DateTime'>;
}
/**
 * ContestWinner findUnique
 */
export type ContestWinnerFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerInclude<ExtArgs> | null;
    /**
     * Filter, which ContestWinner to fetch.
     */
    where: Prisma.ContestWinnerWhereUniqueInput;
};
/**
 * ContestWinner findUniqueOrThrow
 */
export type ContestWinnerFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerInclude<ExtArgs> | null;
    /**
     * Filter, which ContestWinner to fetch.
     */
    where: Prisma.ContestWinnerWhereUniqueInput;
};
/**
 * ContestWinner findFirst
 */
export type ContestWinnerFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerInclude<ExtArgs> | null;
    /**
     * Filter, which ContestWinner to fetch.
     */
    where?: Prisma.ContestWinnerWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestWinners to fetch.
     */
    orderBy?: Prisma.ContestWinnerOrderByWithRelationInput | Prisma.ContestWinnerOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ContestWinners.
     */
    cursor?: Prisma.ContestWinnerWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestWinners from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestWinners.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ContestWinners.
     */
    distinct?: Prisma.ContestWinnerScalarFieldEnum | Prisma.ContestWinnerScalarFieldEnum[];
};
/**
 * ContestWinner findFirstOrThrow
 */
export type ContestWinnerFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerInclude<ExtArgs> | null;
    /**
     * Filter, which ContestWinner to fetch.
     */
    where?: Prisma.ContestWinnerWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestWinners to fetch.
     */
    orderBy?: Prisma.ContestWinnerOrderByWithRelationInput | Prisma.ContestWinnerOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ContestWinners.
     */
    cursor?: Prisma.ContestWinnerWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestWinners from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestWinners.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ContestWinners.
     */
    distinct?: Prisma.ContestWinnerScalarFieldEnum | Prisma.ContestWinnerScalarFieldEnum[];
};
/**
 * ContestWinner findMany
 */
export type ContestWinnerFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerInclude<ExtArgs> | null;
    /**
     * Filter, which ContestWinners to fetch.
     */
    where?: Prisma.ContestWinnerWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestWinners to fetch.
     */
    orderBy?: Prisma.ContestWinnerOrderByWithRelationInput | Prisma.ContestWinnerOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ContestWinners.
     */
    cursor?: Prisma.ContestWinnerWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestWinners from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestWinners.
     */
    skip?: number;
    distinct?: Prisma.ContestWinnerScalarFieldEnum | Prisma.ContestWinnerScalarFieldEnum[];
};
/**
 * ContestWinner create
 */
export type ContestWinnerCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerInclude<ExtArgs> | null;
    /**
     * The data needed to create a ContestWinner.
     */
    data: Prisma.XOR<Prisma.ContestWinnerCreateInput, Prisma.ContestWinnerUncheckedCreateInput>;
};
/**
 * ContestWinner createMany
 */
export type ContestWinnerCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContestWinners.
     */
    data: Prisma.ContestWinnerCreateManyInput | Prisma.ContestWinnerCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * ContestWinner createManyAndReturn
 */
export type ContestWinnerCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * The data used to create many ContestWinners.
     */
    data: Prisma.ContestWinnerCreateManyInput | Prisma.ContestWinnerCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * ContestWinner update
 */
export type ContestWinnerUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerInclude<ExtArgs> | null;
    /**
     * The data needed to update a ContestWinner.
     */
    data: Prisma.XOR<Prisma.ContestWinnerUpdateInput, Prisma.ContestWinnerUncheckedUpdateInput>;
    /**
     * Choose, which ContestWinner to update.
     */
    where: Prisma.ContestWinnerWhereUniqueInput;
};
/**
 * ContestWinner updateMany
 */
export type ContestWinnerUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update ContestWinners.
     */
    data: Prisma.XOR<Prisma.ContestWinnerUpdateManyMutationInput, Prisma.ContestWinnerUncheckedUpdateManyInput>;
    /**
     * Filter which ContestWinners to update
     */
    where?: Prisma.ContestWinnerWhereInput;
    /**
     * Limit how many ContestWinners to update.
     */
    limit?: number;
};
/**
 * ContestWinner updateManyAndReturn
 */
export type ContestWinnerUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * The data used to update ContestWinners.
     */
    data: Prisma.XOR<Prisma.ContestWinnerUpdateManyMutationInput, Prisma.ContestWinnerUncheckedUpdateManyInput>;
    /**
     * Filter which ContestWinners to update
     */
    where?: Prisma.ContestWinnerWhereInput;
    /**
     * Limit how many ContestWinners to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * ContestWinner upsert
 */
export type ContestWinnerUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerInclude<ExtArgs> | null;
    /**
     * The filter to search for the ContestWinner to update in case it exists.
     */
    where: Prisma.ContestWinnerWhereUniqueInput;
    /**
     * In case the ContestWinner found by the `where` argument doesn't exist, create a new ContestWinner with this data.
     */
    create: Prisma.XOR<Prisma.ContestWinnerCreateInput, Prisma.ContestWinnerUncheckedCreateInput>;
    /**
     * In case the ContestWinner was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.ContestWinnerUpdateInput, Prisma.ContestWinnerUncheckedUpdateInput>;
};
/**
 * ContestWinner delete
 */
export type ContestWinnerDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerInclude<ExtArgs> | null;
    /**
     * Filter which ContestWinner to delete.
     */
    where: Prisma.ContestWinnerWhereUniqueInput;
};
/**
 * ContestWinner deleteMany
 */
export type ContestWinnerDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which ContestWinners to delete
     */
    where?: Prisma.ContestWinnerWhereInput;
    /**
     * Limit how many ContestWinners to delete.
     */
    limit?: number;
};
/**
 * ContestWinner without action
 */
export type ContestWinnerDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestWinner
     */
    select?: Prisma.ContestWinnerSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestWinner
     */
    omit?: Prisma.ContestWinnerOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestWinnerInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=ContestWinner.d.ts.map