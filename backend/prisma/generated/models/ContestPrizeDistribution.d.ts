import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model ContestPrizeDistribution
 *
 */
export type ContestPrizeDistributionModel = runtime.Types.Result.DefaultSelection<Prisma.$ContestPrizeDistributionPayload>;
export type AggregateContestPrizeDistribution = {
    _count: ContestPrizeDistributionCountAggregateOutputType | null;
    _avg: ContestPrizeDistributionAvgAggregateOutputType | null;
    _sum: ContestPrizeDistributionSumAggregateOutputType | null;
    _min: ContestPrizeDistributionMinAggregateOutputType | null;
    _max: ContestPrizeDistributionMaxAggregateOutputType | null;
};
export type ContestPrizeDistributionAvgAggregateOutputType = {
    rank: number | null;
    percentage: runtime.Decimal | null;
};
export type ContestPrizeDistributionSumAggregateOutputType = {
    rank: number | null;
    percentage: runtime.Decimal | null;
};
export type ContestPrizeDistributionMinAggregateOutputType = {
    id: string | null;
    contestId: string | null;
    rank: number | null;
    percentage: runtime.Decimal | null;
};
export type ContestPrizeDistributionMaxAggregateOutputType = {
    id: string | null;
    contestId: string | null;
    rank: number | null;
    percentage: runtime.Decimal | null;
};
export type ContestPrizeDistributionCountAggregateOutputType = {
    id: number;
    contestId: number;
    rank: number;
    percentage: number;
    _all: number;
};
export type ContestPrizeDistributionAvgAggregateInputType = {
    rank?: true;
    percentage?: true;
};
export type ContestPrizeDistributionSumAggregateInputType = {
    rank?: true;
    percentage?: true;
};
export type ContestPrizeDistributionMinAggregateInputType = {
    id?: true;
    contestId?: true;
    rank?: true;
    percentage?: true;
};
export type ContestPrizeDistributionMaxAggregateInputType = {
    id?: true;
    contestId?: true;
    rank?: true;
    percentage?: true;
};
export type ContestPrizeDistributionCountAggregateInputType = {
    id?: true;
    contestId?: true;
    rank?: true;
    percentage?: true;
    _all?: true;
};
export type ContestPrizeDistributionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which ContestPrizeDistribution to aggregate.
     */
    where?: Prisma.ContestPrizeDistributionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestPrizeDistributions to fetch.
     */
    orderBy?: Prisma.ContestPrizeDistributionOrderByWithRelationInput | Prisma.ContestPrizeDistributionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.ContestPrizeDistributionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestPrizeDistributions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestPrizeDistributions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ContestPrizeDistributions
    **/
    _count?: true | ContestPrizeDistributionCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: ContestPrizeDistributionAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: ContestPrizeDistributionSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: ContestPrizeDistributionMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: ContestPrizeDistributionMaxAggregateInputType;
};
export type GetContestPrizeDistributionAggregateType<T extends ContestPrizeDistributionAggregateArgs> = {
    [P in keyof T & keyof AggregateContestPrizeDistribution]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateContestPrizeDistribution[P]> : Prisma.GetScalarType<T[P], AggregateContestPrizeDistribution[P]>;
};
export type ContestPrizeDistributionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ContestPrizeDistributionWhereInput;
    orderBy?: Prisma.ContestPrizeDistributionOrderByWithAggregationInput | Prisma.ContestPrizeDistributionOrderByWithAggregationInput[];
    by: Prisma.ContestPrizeDistributionScalarFieldEnum[] | Prisma.ContestPrizeDistributionScalarFieldEnum;
    having?: Prisma.ContestPrizeDistributionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ContestPrizeDistributionCountAggregateInputType | true;
    _avg?: ContestPrizeDistributionAvgAggregateInputType;
    _sum?: ContestPrizeDistributionSumAggregateInputType;
    _min?: ContestPrizeDistributionMinAggregateInputType;
    _max?: ContestPrizeDistributionMaxAggregateInputType;
};
export type ContestPrizeDistributionGroupByOutputType = {
    id: string;
    contestId: string;
    rank: number;
    percentage: runtime.Decimal;
    _count: ContestPrizeDistributionCountAggregateOutputType | null;
    _avg: ContestPrizeDistributionAvgAggregateOutputType | null;
    _sum: ContestPrizeDistributionSumAggregateOutputType | null;
    _min: ContestPrizeDistributionMinAggregateOutputType | null;
    _max: ContestPrizeDistributionMaxAggregateOutputType | null;
};
type GetContestPrizeDistributionGroupByPayload<T extends ContestPrizeDistributionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ContestPrizeDistributionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ContestPrizeDistributionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ContestPrizeDistributionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ContestPrizeDistributionGroupByOutputType[P]>;
}>>;
export type ContestPrizeDistributionWhereInput = {
    AND?: Prisma.ContestPrizeDistributionWhereInput | Prisma.ContestPrizeDistributionWhereInput[];
    OR?: Prisma.ContestPrizeDistributionWhereInput[];
    NOT?: Prisma.ContestPrizeDistributionWhereInput | Prisma.ContestPrizeDistributionWhereInput[];
    id?: Prisma.StringFilter<"ContestPrizeDistribution"> | string;
    contestId?: Prisma.StringFilter<"ContestPrizeDistribution"> | string;
    rank?: Prisma.IntFilter<"ContestPrizeDistribution"> | number;
    percentage?: Prisma.DecimalFilter<"ContestPrizeDistribution"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    contest?: Prisma.XOR<Prisma.ContestScalarRelationFilter, Prisma.ContestWhereInput>;
};
export type ContestPrizeDistributionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    rank?: Prisma.SortOrder;
    percentage?: Prisma.SortOrder;
    contest?: Prisma.ContestOrderByWithRelationInput;
};
export type ContestPrizeDistributionWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.ContestPrizeDistributionWhereInput | Prisma.ContestPrizeDistributionWhereInput[];
    OR?: Prisma.ContestPrizeDistributionWhereInput[];
    NOT?: Prisma.ContestPrizeDistributionWhereInput | Prisma.ContestPrizeDistributionWhereInput[];
    contestId?: Prisma.StringFilter<"ContestPrizeDistribution"> | string;
    rank?: Prisma.IntFilter<"ContestPrizeDistribution"> | number;
    percentage?: Prisma.DecimalFilter<"ContestPrizeDistribution"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
    contest?: Prisma.XOR<Prisma.ContestScalarRelationFilter, Prisma.ContestWhereInput>;
}, "id">;
export type ContestPrizeDistributionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    rank?: Prisma.SortOrder;
    percentage?: Prisma.SortOrder;
    _count?: Prisma.ContestPrizeDistributionCountOrderByAggregateInput;
    _avg?: Prisma.ContestPrizeDistributionAvgOrderByAggregateInput;
    _max?: Prisma.ContestPrizeDistributionMaxOrderByAggregateInput;
    _min?: Prisma.ContestPrizeDistributionMinOrderByAggregateInput;
    _sum?: Prisma.ContestPrizeDistributionSumOrderByAggregateInput;
};
export type ContestPrizeDistributionScalarWhereWithAggregatesInput = {
    AND?: Prisma.ContestPrizeDistributionScalarWhereWithAggregatesInput | Prisma.ContestPrizeDistributionScalarWhereWithAggregatesInput[];
    OR?: Prisma.ContestPrizeDistributionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ContestPrizeDistributionScalarWhereWithAggregatesInput | Prisma.ContestPrizeDistributionScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"ContestPrizeDistribution"> | string;
    contestId?: Prisma.StringWithAggregatesFilter<"ContestPrizeDistribution"> | string;
    rank?: Prisma.IntWithAggregatesFilter<"ContestPrizeDistribution"> | number;
    percentage?: Prisma.DecimalWithAggregatesFilter<"ContestPrizeDistribution"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionCreateInput = {
    id?: string;
    rank: number;
    percentage: runtime.Decimal | runtime.DecimalJsLike | number | string;
    contest: Prisma.ContestCreateNestedOneWithoutDistributionsInput;
};
export type ContestPrizeDistributionUncheckedCreateInput = {
    id?: string;
    contestId: string;
    rank: number;
    percentage: runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    percentage?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
    contest?: Prisma.ContestUpdateOneRequiredWithoutDistributionsNestedInput;
};
export type ContestPrizeDistributionUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    percentage?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionCreateManyInput = {
    id?: string;
    contestId: string;
    rank: number;
    percentage: runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    percentage?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    percentage?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionListRelationFilter = {
    every?: Prisma.ContestPrizeDistributionWhereInput;
    some?: Prisma.ContestPrizeDistributionWhereInput;
    none?: Prisma.ContestPrizeDistributionWhereInput;
};
export type ContestPrizeDistributionOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type ContestPrizeDistributionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    rank?: Prisma.SortOrder;
    percentage?: Prisma.SortOrder;
};
export type ContestPrizeDistributionAvgOrderByAggregateInput = {
    rank?: Prisma.SortOrder;
    percentage?: Prisma.SortOrder;
};
export type ContestPrizeDistributionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    rank?: Prisma.SortOrder;
    percentage?: Prisma.SortOrder;
};
export type ContestPrizeDistributionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    rank?: Prisma.SortOrder;
    percentage?: Prisma.SortOrder;
};
export type ContestPrizeDistributionSumOrderByAggregateInput = {
    rank?: Prisma.SortOrder;
    percentage?: Prisma.SortOrder;
};
export type ContestPrizeDistributionCreateNestedManyWithoutContestInput = {
    create?: Prisma.XOR<Prisma.ContestPrizeDistributionCreateWithoutContestInput, Prisma.ContestPrizeDistributionUncheckedCreateWithoutContestInput> | Prisma.ContestPrizeDistributionCreateWithoutContestInput[] | Prisma.ContestPrizeDistributionUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestPrizeDistributionCreateOrConnectWithoutContestInput | Prisma.ContestPrizeDistributionCreateOrConnectWithoutContestInput[];
    createMany?: Prisma.ContestPrizeDistributionCreateManyContestInputEnvelope;
    connect?: Prisma.ContestPrizeDistributionWhereUniqueInput | Prisma.ContestPrizeDistributionWhereUniqueInput[];
};
export type ContestPrizeDistributionUncheckedCreateNestedManyWithoutContestInput = {
    create?: Prisma.XOR<Prisma.ContestPrizeDistributionCreateWithoutContestInput, Prisma.ContestPrizeDistributionUncheckedCreateWithoutContestInput> | Prisma.ContestPrizeDistributionCreateWithoutContestInput[] | Prisma.ContestPrizeDistributionUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestPrizeDistributionCreateOrConnectWithoutContestInput | Prisma.ContestPrizeDistributionCreateOrConnectWithoutContestInput[];
    createMany?: Prisma.ContestPrizeDistributionCreateManyContestInputEnvelope;
    connect?: Prisma.ContestPrizeDistributionWhereUniqueInput | Prisma.ContestPrizeDistributionWhereUniqueInput[];
};
export type ContestPrizeDistributionUpdateManyWithoutContestNestedInput = {
    create?: Prisma.XOR<Prisma.ContestPrizeDistributionCreateWithoutContestInput, Prisma.ContestPrizeDistributionUncheckedCreateWithoutContestInput> | Prisma.ContestPrizeDistributionCreateWithoutContestInput[] | Prisma.ContestPrizeDistributionUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestPrizeDistributionCreateOrConnectWithoutContestInput | Prisma.ContestPrizeDistributionCreateOrConnectWithoutContestInput[];
    upsert?: Prisma.ContestPrizeDistributionUpsertWithWhereUniqueWithoutContestInput | Prisma.ContestPrizeDistributionUpsertWithWhereUniqueWithoutContestInput[];
    createMany?: Prisma.ContestPrizeDistributionCreateManyContestInputEnvelope;
    set?: Prisma.ContestPrizeDistributionWhereUniqueInput | Prisma.ContestPrizeDistributionWhereUniqueInput[];
    disconnect?: Prisma.ContestPrizeDistributionWhereUniqueInput | Prisma.ContestPrizeDistributionWhereUniqueInput[];
    delete?: Prisma.ContestPrizeDistributionWhereUniqueInput | Prisma.ContestPrizeDistributionWhereUniqueInput[];
    connect?: Prisma.ContestPrizeDistributionWhereUniqueInput | Prisma.ContestPrizeDistributionWhereUniqueInput[];
    update?: Prisma.ContestPrizeDistributionUpdateWithWhereUniqueWithoutContestInput | Prisma.ContestPrizeDistributionUpdateWithWhereUniqueWithoutContestInput[];
    updateMany?: Prisma.ContestPrizeDistributionUpdateManyWithWhereWithoutContestInput | Prisma.ContestPrizeDistributionUpdateManyWithWhereWithoutContestInput[];
    deleteMany?: Prisma.ContestPrizeDistributionScalarWhereInput | Prisma.ContestPrizeDistributionScalarWhereInput[];
};
export type ContestPrizeDistributionUncheckedUpdateManyWithoutContestNestedInput = {
    create?: Prisma.XOR<Prisma.ContestPrizeDistributionCreateWithoutContestInput, Prisma.ContestPrizeDistributionUncheckedCreateWithoutContestInput> | Prisma.ContestPrizeDistributionCreateWithoutContestInput[] | Prisma.ContestPrizeDistributionUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestPrizeDistributionCreateOrConnectWithoutContestInput | Prisma.ContestPrizeDistributionCreateOrConnectWithoutContestInput[];
    upsert?: Prisma.ContestPrizeDistributionUpsertWithWhereUniqueWithoutContestInput | Prisma.ContestPrizeDistributionUpsertWithWhereUniqueWithoutContestInput[];
    createMany?: Prisma.ContestPrizeDistributionCreateManyContestInputEnvelope;
    set?: Prisma.ContestPrizeDistributionWhereUniqueInput | Prisma.ContestPrizeDistributionWhereUniqueInput[];
    disconnect?: Prisma.ContestPrizeDistributionWhereUniqueInput | Prisma.ContestPrizeDistributionWhereUniqueInput[];
    delete?: Prisma.ContestPrizeDistributionWhereUniqueInput | Prisma.ContestPrizeDistributionWhereUniqueInput[];
    connect?: Prisma.ContestPrizeDistributionWhereUniqueInput | Prisma.ContestPrizeDistributionWhereUniqueInput[];
    update?: Prisma.ContestPrizeDistributionUpdateWithWhereUniqueWithoutContestInput | Prisma.ContestPrizeDistributionUpdateWithWhereUniqueWithoutContestInput[];
    updateMany?: Prisma.ContestPrizeDistributionUpdateManyWithWhereWithoutContestInput | Prisma.ContestPrizeDistributionUpdateManyWithWhereWithoutContestInput[];
    deleteMany?: Prisma.ContestPrizeDistributionScalarWhereInput | Prisma.ContestPrizeDistributionScalarWhereInput[];
};
export type ContestPrizeDistributionCreateWithoutContestInput = {
    id?: string;
    rank: number;
    percentage: runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionUncheckedCreateWithoutContestInput = {
    id?: string;
    rank: number;
    percentage: runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionCreateOrConnectWithoutContestInput = {
    where: Prisma.ContestPrizeDistributionWhereUniqueInput;
    create: Prisma.XOR<Prisma.ContestPrizeDistributionCreateWithoutContestInput, Prisma.ContestPrizeDistributionUncheckedCreateWithoutContestInput>;
};
export type ContestPrizeDistributionCreateManyContestInputEnvelope = {
    data: Prisma.ContestPrizeDistributionCreateManyContestInput | Prisma.ContestPrizeDistributionCreateManyContestInput[];
    skipDuplicates?: boolean;
};
export type ContestPrizeDistributionUpsertWithWhereUniqueWithoutContestInput = {
    where: Prisma.ContestPrizeDistributionWhereUniqueInput;
    update: Prisma.XOR<Prisma.ContestPrizeDistributionUpdateWithoutContestInput, Prisma.ContestPrizeDistributionUncheckedUpdateWithoutContestInput>;
    create: Prisma.XOR<Prisma.ContestPrizeDistributionCreateWithoutContestInput, Prisma.ContestPrizeDistributionUncheckedCreateWithoutContestInput>;
};
export type ContestPrizeDistributionUpdateWithWhereUniqueWithoutContestInput = {
    where: Prisma.ContestPrizeDistributionWhereUniqueInput;
    data: Prisma.XOR<Prisma.ContestPrizeDistributionUpdateWithoutContestInput, Prisma.ContestPrizeDistributionUncheckedUpdateWithoutContestInput>;
};
export type ContestPrizeDistributionUpdateManyWithWhereWithoutContestInput = {
    where: Prisma.ContestPrizeDistributionScalarWhereInput;
    data: Prisma.XOR<Prisma.ContestPrizeDistributionUpdateManyMutationInput, Prisma.ContestPrizeDistributionUncheckedUpdateManyWithoutContestInput>;
};
export type ContestPrizeDistributionScalarWhereInput = {
    AND?: Prisma.ContestPrizeDistributionScalarWhereInput | Prisma.ContestPrizeDistributionScalarWhereInput[];
    OR?: Prisma.ContestPrizeDistributionScalarWhereInput[];
    NOT?: Prisma.ContestPrizeDistributionScalarWhereInput | Prisma.ContestPrizeDistributionScalarWhereInput[];
    id?: Prisma.StringFilter<"ContestPrizeDistribution"> | string;
    contestId?: Prisma.StringFilter<"ContestPrizeDistribution"> | string;
    rank?: Prisma.IntFilter<"ContestPrizeDistribution"> | number;
    percentage?: Prisma.DecimalFilter<"ContestPrizeDistribution"> | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionCreateManyContestInput = {
    id?: string;
    rank: number;
    percentage: runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionUpdateWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    percentage?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionUncheckedUpdateWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    percentage?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionUncheckedUpdateManyWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    rank?: Prisma.IntFieldUpdateOperationsInput | number;
    percentage?: Prisma.DecimalFieldUpdateOperationsInput | runtime.Decimal | runtime.DecimalJsLike | number | string;
};
export type ContestPrizeDistributionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    rank?: boolean;
    percentage?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestPrizeDistribution"]>;
export type ContestPrizeDistributionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    rank?: boolean;
    percentage?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestPrizeDistribution"]>;
export type ContestPrizeDistributionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    rank?: boolean;
    percentage?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestPrizeDistribution"]>;
export type ContestPrizeDistributionSelectScalar = {
    id?: boolean;
    contestId?: boolean;
    rank?: boolean;
    percentage?: boolean;
};
export type ContestPrizeDistributionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "contestId" | "rank" | "percentage", ExtArgs["result"]["contestPrizeDistribution"]>;
export type ContestPrizeDistributionInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
};
export type ContestPrizeDistributionIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
};
export type ContestPrizeDistributionIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
};
export type $ContestPrizeDistributionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ContestPrizeDistribution";
    objects: {
        contest: Prisma.$ContestPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        contestId: string;
        rank: number;
        percentage: runtime.Decimal;
    }, ExtArgs["result"]["contestPrizeDistribution"]>;
    composites: {};
};
export type ContestPrizeDistributionGetPayload<S extends boolean | null | undefined | ContestPrizeDistributionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload, S>;
export type ContestPrizeDistributionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ContestPrizeDistributionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ContestPrizeDistributionCountAggregateInputType | true;
};
export interface ContestPrizeDistributionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['ContestPrizeDistribution'];
        meta: {
            name: 'ContestPrizeDistribution';
        };
    };
    /**
     * Find zero or one ContestPrizeDistribution that matches the filter.
     * @param {ContestPrizeDistributionFindUniqueArgs} args - Arguments to find a ContestPrizeDistribution
     * @example
     * // Get one ContestPrizeDistribution
     * const contestPrizeDistribution = await prisma.contestPrizeDistribution.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContestPrizeDistributionFindUniqueArgs>(args: Prisma.SelectSubset<T, ContestPrizeDistributionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ContestPrizeDistributionClient<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one ContestPrizeDistribution that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContestPrizeDistributionFindUniqueOrThrowArgs} args - Arguments to find a ContestPrizeDistribution
     * @example
     * // Get one ContestPrizeDistribution
     * const contestPrizeDistribution = await prisma.contestPrizeDistribution.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContestPrizeDistributionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ContestPrizeDistributionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ContestPrizeDistributionClient<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first ContestPrizeDistribution that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestPrizeDistributionFindFirstArgs} args - Arguments to find a ContestPrizeDistribution
     * @example
     * // Get one ContestPrizeDistribution
     * const contestPrizeDistribution = await prisma.contestPrizeDistribution.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContestPrizeDistributionFindFirstArgs>(args?: Prisma.SelectSubset<T, ContestPrizeDistributionFindFirstArgs<ExtArgs>>): Prisma.Prisma__ContestPrizeDistributionClient<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first ContestPrizeDistribution that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestPrizeDistributionFindFirstOrThrowArgs} args - Arguments to find a ContestPrizeDistribution
     * @example
     * // Get one ContestPrizeDistribution
     * const contestPrizeDistribution = await prisma.contestPrizeDistribution.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContestPrizeDistributionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ContestPrizeDistributionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ContestPrizeDistributionClient<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more ContestPrizeDistributions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestPrizeDistributionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContestPrizeDistributions
     * const contestPrizeDistributions = await prisma.contestPrizeDistribution.findMany()
     *
     * // Get first 10 ContestPrizeDistributions
     * const contestPrizeDistributions = await prisma.contestPrizeDistribution.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const contestPrizeDistributionWithIdOnly = await prisma.contestPrizeDistribution.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ContestPrizeDistributionFindManyArgs>(args?: Prisma.SelectSubset<T, ContestPrizeDistributionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a ContestPrizeDistribution.
     * @param {ContestPrizeDistributionCreateArgs} args - Arguments to create a ContestPrizeDistribution.
     * @example
     * // Create one ContestPrizeDistribution
     * const ContestPrizeDistribution = await prisma.contestPrizeDistribution.create({
     *   data: {
     *     // ... data to create a ContestPrizeDistribution
     *   }
     * })
     *
     */
    create<T extends ContestPrizeDistributionCreateArgs>(args: Prisma.SelectSubset<T, ContestPrizeDistributionCreateArgs<ExtArgs>>): Prisma.Prisma__ContestPrizeDistributionClient<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many ContestPrizeDistributions.
     * @param {ContestPrizeDistributionCreateManyArgs} args - Arguments to create many ContestPrizeDistributions.
     * @example
     * // Create many ContestPrizeDistributions
     * const contestPrizeDistribution = await prisma.contestPrizeDistribution.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ContestPrizeDistributionCreateManyArgs>(args?: Prisma.SelectSubset<T, ContestPrizeDistributionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many ContestPrizeDistributions and returns the data saved in the database.
     * @param {ContestPrizeDistributionCreateManyAndReturnArgs} args - Arguments to create many ContestPrizeDistributions.
     * @example
     * // Create many ContestPrizeDistributions
     * const contestPrizeDistribution = await prisma.contestPrizeDistribution.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ContestPrizeDistributions and only return the `id`
     * const contestPrizeDistributionWithIdOnly = await prisma.contestPrizeDistribution.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ContestPrizeDistributionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ContestPrizeDistributionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a ContestPrizeDistribution.
     * @param {ContestPrizeDistributionDeleteArgs} args - Arguments to delete one ContestPrizeDistribution.
     * @example
     * // Delete one ContestPrizeDistribution
     * const ContestPrizeDistribution = await prisma.contestPrizeDistribution.delete({
     *   where: {
     *     // ... filter to delete one ContestPrizeDistribution
     *   }
     * })
     *
     */
    delete<T extends ContestPrizeDistributionDeleteArgs>(args: Prisma.SelectSubset<T, ContestPrizeDistributionDeleteArgs<ExtArgs>>): Prisma.Prisma__ContestPrizeDistributionClient<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one ContestPrizeDistribution.
     * @param {ContestPrizeDistributionUpdateArgs} args - Arguments to update one ContestPrizeDistribution.
     * @example
     * // Update one ContestPrizeDistribution
     * const contestPrizeDistribution = await prisma.contestPrizeDistribution.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ContestPrizeDistributionUpdateArgs>(args: Prisma.SelectSubset<T, ContestPrizeDistributionUpdateArgs<ExtArgs>>): Prisma.Prisma__ContestPrizeDistributionClient<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more ContestPrizeDistributions.
     * @param {ContestPrizeDistributionDeleteManyArgs} args - Arguments to filter ContestPrizeDistributions to delete.
     * @example
     * // Delete a few ContestPrizeDistributions
     * const { count } = await prisma.contestPrizeDistribution.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ContestPrizeDistributionDeleteManyArgs>(args?: Prisma.SelectSubset<T, ContestPrizeDistributionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more ContestPrizeDistributions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestPrizeDistributionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContestPrizeDistributions
     * const contestPrizeDistribution = await prisma.contestPrizeDistribution.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ContestPrizeDistributionUpdateManyArgs>(args: Prisma.SelectSubset<T, ContestPrizeDistributionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more ContestPrizeDistributions and returns the data updated in the database.
     * @param {ContestPrizeDistributionUpdateManyAndReturnArgs} args - Arguments to update many ContestPrizeDistributions.
     * @example
     * // Update many ContestPrizeDistributions
     * const contestPrizeDistribution = await prisma.contestPrizeDistribution.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ContestPrizeDistributions and only return the `id`
     * const contestPrizeDistributionWithIdOnly = await prisma.contestPrizeDistribution.updateManyAndReturn({
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
    updateManyAndReturn<T extends ContestPrizeDistributionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ContestPrizeDistributionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one ContestPrizeDistribution.
     * @param {ContestPrizeDistributionUpsertArgs} args - Arguments to update or create a ContestPrizeDistribution.
     * @example
     * // Update or create a ContestPrizeDistribution
     * const contestPrizeDistribution = await prisma.contestPrizeDistribution.upsert({
     *   create: {
     *     // ... data to create a ContestPrizeDistribution
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContestPrizeDistribution we want to update
     *   }
     * })
     */
    upsert<T extends ContestPrizeDistributionUpsertArgs>(args: Prisma.SelectSubset<T, ContestPrizeDistributionUpsertArgs<ExtArgs>>): Prisma.Prisma__ContestPrizeDistributionClient<runtime.Types.Result.GetResult<Prisma.$ContestPrizeDistributionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of ContestPrizeDistributions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestPrizeDistributionCountArgs} args - Arguments to filter ContestPrizeDistributions to count.
     * @example
     * // Count the number of ContestPrizeDistributions
     * const count = await prisma.contestPrizeDistribution.count({
     *   where: {
     *     // ... the filter for the ContestPrizeDistributions we want to count
     *   }
     * })
    **/
    count<T extends ContestPrizeDistributionCountArgs>(args?: Prisma.Subset<T, ContestPrizeDistributionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ContestPrizeDistributionCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a ContestPrizeDistribution.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestPrizeDistributionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ContestPrizeDistributionAggregateArgs>(args: Prisma.Subset<T, ContestPrizeDistributionAggregateArgs>): Prisma.PrismaPromise<GetContestPrizeDistributionAggregateType<T>>;
    /**
     * Group by ContestPrizeDistribution.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestPrizeDistributionGroupByArgs} args - Group by arguments.
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
    groupBy<T extends ContestPrizeDistributionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ContestPrizeDistributionGroupByArgs['orderBy'];
    } : {
        orderBy?: ContestPrizeDistributionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ContestPrizeDistributionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContestPrizeDistributionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the ContestPrizeDistribution model
     */
    readonly fields: ContestPrizeDistributionFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for ContestPrizeDistribution.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__ContestPrizeDistributionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    contest<T extends Prisma.ContestDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ContestDefaultArgs<ExtArgs>>): Prisma.Prisma__ContestClient<runtime.Types.Result.GetResult<Prisma.$ContestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
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
 * Fields of the ContestPrizeDistribution model
 */
export interface ContestPrizeDistributionFieldRefs {
    readonly id: Prisma.FieldRef<"ContestPrizeDistribution", 'String'>;
    readonly contestId: Prisma.FieldRef<"ContestPrizeDistribution", 'String'>;
    readonly rank: Prisma.FieldRef<"ContestPrizeDistribution", 'Int'>;
    readonly percentage: Prisma.FieldRef<"ContestPrizeDistribution", 'Decimal'>;
}
/**
 * ContestPrizeDistribution findUnique
 */
export type ContestPrizeDistributionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionInclude<ExtArgs> | null;
    /**
     * Filter, which ContestPrizeDistribution to fetch.
     */
    where: Prisma.ContestPrizeDistributionWhereUniqueInput;
};
/**
 * ContestPrizeDistribution findUniqueOrThrow
 */
export type ContestPrizeDistributionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionInclude<ExtArgs> | null;
    /**
     * Filter, which ContestPrizeDistribution to fetch.
     */
    where: Prisma.ContestPrizeDistributionWhereUniqueInput;
};
/**
 * ContestPrizeDistribution findFirst
 */
export type ContestPrizeDistributionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionInclude<ExtArgs> | null;
    /**
     * Filter, which ContestPrizeDistribution to fetch.
     */
    where?: Prisma.ContestPrizeDistributionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestPrizeDistributions to fetch.
     */
    orderBy?: Prisma.ContestPrizeDistributionOrderByWithRelationInput | Prisma.ContestPrizeDistributionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ContestPrizeDistributions.
     */
    cursor?: Prisma.ContestPrizeDistributionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestPrizeDistributions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestPrizeDistributions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ContestPrizeDistributions.
     */
    distinct?: Prisma.ContestPrizeDistributionScalarFieldEnum | Prisma.ContestPrizeDistributionScalarFieldEnum[];
};
/**
 * ContestPrizeDistribution findFirstOrThrow
 */
export type ContestPrizeDistributionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionInclude<ExtArgs> | null;
    /**
     * Filter, which ContestPrizeDistribution to fetch.
     */
    where?: Prisma.ContestPrizeDistributionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestPrizeDistributions to fetch.
     */
    orderBy?: Prisma.ContestPrizeDistributionOrderByWithRelationInput | Prisma.ContestPrizeDistributionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ContestPrizeDistributions.
     */
    cursor?: Prisma.ContestPrizeDistributionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestPrizeDistributions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestPrizeDistributions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ContestPrizeDistributions.
     */
    distinct?: Prisma.ContestPrizeDistributionScalarFieldEnum | Prisma.ContestPrizeDistributionScalarFieldEnum[];
};
/**
 * ContestPrizeDistribution findMany
 */
export type ContestPrizeDistributionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionInclude<ExtArgs> | null;
    /**
     * Filter, which ContestPrizeDistributions to fetch.
     */
    where?: Prisma.ContestPrizeDistributionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestPrizeDistributions to fetch.
     */
    orderBy?: Prisma.ContestPrizeDistributionOrderByWithRelationInput | Prisma.ContestPrizeDistributionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ContestPrizeDistributions.
     */
    cursor?: Prisma.ContestPrizeDistributionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestPrizeDistributions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestPrizeDistributions.
     */
    skip?: number;
    distinct?: Prisma.ContestPrizeDistributionScalarFieldEnum | Prisma.ContestPrizeDistributionScalarFieldEnum[];
};
/**
 * ContestPrizeDistribution create
 */
export type ContestPrizeDistributionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionInclude<ExtArgs> | null;
    /**
     * The data needed to create a ContestPrizeDistribution.
     */
    data: Prisma.XOR<Prisma.ContestPrizeDistributionCreateInput, Prisma.ContestPrizeDistributionUncheckedCreateInput>;
};
/**
 * ContestPrizeDistribution createMany
 */
export type ContestPrizeDistributionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContestPrizeDistributions.
     */
    data: Prisma.ContestPrizeDistributionCreateManyInput | Prisma.ContestPrizeDistributionCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * ContestPrizeDistribution createManyAndReturn
 */
export type ContestPrizeDistributionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * The data used to create many ContestPrizeDistributions.
     */
    data: Prisma.ContestPrizeDistributionCreateManyInput | Prisma.ContestPrizeDistributionCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * ContestPrizeDistribution update
 */
export type ContestPrizeDistributionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionInclude<ExtArgs> | null;
    /**
     * The data needed to update a ContestPrizeDistribution.
     */
    data: Prisma.XOR<Prisma.ContestPrizeDistributionUpdateInput, Prisma.ContestPrizeDistributionUncheckedUpdateInput>;
    /**
     * Choose, which ContestPrizeDistribution to update.
     */
    where: Prisma.ContestPrizeDistributionWhereUniqueInput;
};
/**
 * ContestPrizeDistribution updateMany
 */
export type ContestPrizeDistributionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update ContestPrizeDistributions.
     */
    data: Prisma.XOR<Prisma.ContestPrizeDistributionUpdateManyMutationInput, Prisma.ContestPrizeDistributionUncheckedUpdateManyInput>;
    /**
     * Filter which ContestPrizeDistributions to update
     */
    where?: Prisma.ContestPrizeDistributionWhereInput;
    /**
     * Limit how many ContestPrizeDistributions to update.
     */
    limit?: number;
};
/**
 * ContestPrizeDistribution updateManyAndReturn
 */
export type ContestPrizeDistributionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * The data used to update ContestPrizeDistributions.
     */
    data: Prisma.XOR<Prisma.ContestPrizeDistributionUpdateManyMutationInput, Prisma.ContestPrizeDistributionUncheckedUpdateManyInput>;
    /**
     * Filter which ContestPrizeDistributions to update
     */
    where?: Prisma.ContestPrizeDistributionWhereInput;
    /**
     * Limit how many ContestPrizeDistributions to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * ContestPrizeDistribution upsert
 */
export type ContestPrizeDistributionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionInclude<ExtArgs> | null;
    /**
     * The filter to search for the ContestPrizeDistribution to update in case it exists.
     */
    where: Prisma.ContestPrizeDistributionWhereUniqueInput;
    /**
     * In case the ContestPrizeDistribution found by the `where` argument doesn't exist, create a new ContestPrizeDistribution with this data.
     */
    create: Prisma.XOR<Prisma.ContestPrizeDistributionCreateInput, Prisma.ContestPrizeDistributionUncheckedCreateInput>;
    /**
     * In case the ContestPrizeDistribution was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.ContestPrizeDistributionUpdateInput, Prisma.ContestPrizeDistributionUncheckedUpdateInput>;
};
/**
 * ContestPrizeDistribution delete
 */
export type ContestPrizeDistributionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionInclude<ExtArgs> | null;
    /**
     * Filter which ContestPrizeDistribution to delete.
     */
    where: Prisma.ContestPrizeDistributionWhereUniqueInput;
};
/**
 * ContestPrizeDistribution deleteMany
 */
export type ContestPrizeDistributionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which ContestPrizeDistributions to delete
     */
    where?: Prisma.ContestPrizeDistributionWhereInput;
    /**
     * Limit how many ContestPrizeDistributions to delete.
     */
    limit?: number;
};
/**
 * ContestPrizeDistribution without action
 */
export type ContestPrizeDistributionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestPrizeDistribution
     */
    select?: Prisma.ContestPrizeDistributionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestPrizeDistribution
     */
    omit?: Prisma.ContestPrizeDistributionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestPrizeDistributionInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=ContestPrizeDistribution.d.ts.map