import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model ContestJudge
 *
 */
export type ContestJudgeModel = runtime.Types.Result.DefaultSelection<Prisma.$ContestJudgePayload>;
export type AggregateContestJudge = {
    _count: ContestJudgeCountAggregateOutputType | null;
    _min: ContestJudgeMinAggregateOutputType | null;
    _max: ContestJudgeMaxAggregateOutputType | null;
};
export type ContestJudgeMinAggregateOutputType = {
    id: string | null;
    contestId: string | null;
    userId: string | null;
    status: string | null;
    addedAt: Date | null;
};
export type ContestJudgeMaxAggregateOutputType = {
    id: string | null;
    contestId: string | null;
    userId: string | null;
    status: string | null;
    addedAt: Date | null;
};
export type ContestJudgeCountAggregateOutputType = {
    id: number;
    contestId: number;
    userId: number;
    status: number;
    addedAt: number;
    _all: number;
};
export type ContestJudgeMinAggregateInputType = {
    id?: true;
    contestId?: true;
    userId?: true;
    status?: true;
    addedAt?: true;
};
export type ContestJudgeMaxAggregateInputType = {
    id?: true;
    contestId?: true;
    userId?: true;
    status?: true;
    addedAt?: true;
};
export type ContestJudgeCountAggregateInputType = {
    id?: true;
    contestId?: true;
    userId?: true;
    status?: true;
    addedAt?: true;
    _all?: true;
};
export type ContestJudgeAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which ContestJudge to aggregate.
     */
    where?: Prisma.ContestJudgeWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestJudges to fetch.
     */
    orderBy?: Prisma.ContestJudgeOrderByWithRelationInput | Prisma.ContestJudgeOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.ContestJudgeWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestJudges from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestJudges.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ContestJudges
    **/
    _count?: true | ContestJudgeCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: ContestJudgeMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: ContestJudgeMaxAggregateInputType;
};
export type GetContestJudgeAggregateType<T extends ContestJudgeAggregateArgs> = {
    [P in keyof T & keyof AggregateContestJudge]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateContestJudge[P]> : Prisma.GetScalarType<T[P], AggregateContestJudge[P]>;
};
export type ContestJudgeGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ContestJudgeWhereInput;
    orderBy?: Prisma.ContestJudgeOrderByWithAggregationInput | Prisma.ContestJudgeOrderByWithAggregationInput[];
    by: Prisma.ContestJudgeScalarFieldEnum[] | Prisma.ContestJudgeScalarFieldEnum;
    having?: Prisma.ContestJudgeScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ContestJudgeCountAggregateInputType | true;
    _min?: ContestJudgeMinAggregateInputType;
    _max?: ContestJudgeMaxAggregateInputType;
};
export type ContestJudgeGroupByOutputType = {
    id: string;
    contestId: string;
    userId: string;
    status: string;
    addedAt: Date;
    _count: ContestJudgeCountAggregateOutputType | null;
    _min: ContestJudgeMinAggregateOutputType | null;
    _max: ContestJudgeMaxAggregateOutputType | null;
};
type GetContestJudgeGroupByPayload<T extends ContestJudgeGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ContestJudgeGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ContestJudgeGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ContestJudgeGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ContestJudgeGroupByOutputType[P]>;
}>>;
export type ContestJudgeWhereInput = {
    AND?: Prisma.ContestJudgeWhereInput | Prisma.ContestJudgeWhereInput[];
    OR?: Prisma.ContestJudgeWhereInput[];
    NOT?: Prisma.ContestJudgeWhereInput | Prisma.ContestJudgeWhereInput[];
    id?: Prisma.StringFilter<"ContestJudge"> | string;
    contestId?: Prisma.StringFilter<"ContestJudge"> | string;
    userId?: Prisma.StringFilter<"ContestJudge"> | string;
    status?: Prisma.StringFilter<"ContestJudge"> | string;
    addedAt?: Prisma.DateTimeFilter<"ContestJudge"> | Date | string;
    contest?: Prisma.XOR<Prisma.ContestScalarRelationFilter, Prisma.ContestWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type ContestJudgeOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    addedAt?: Prisma.SortOrder;
    contest?: Prisma.ContestOrderByWithRelationInput;
    user?: Prisma.UserOrderByWithRelationInput;
};
export type ContestJudgeWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    contestId_userId?: Prisma.ContestJudgeContestIdUserIdCompoundUniqueInput;
    AND?: Prisma.ContestJudgeWhereInput | Prisma.ContestJudgeWhereInput[];
    OR?: Prisma.ContestJudgeWhereInput[];
    NOT?: Prisma.ContestJudgeWhereInput | Prisma.ContestJudgeWhereInput[];
    contestId?: Prisma.StringFilter<"ContestJudge"> | string;
    userId?: Prisma.StringFilter<"ContestJudge"> | string;
    status?: Prisma.StringFilter<"ContestJudge"> | string;
    addedAt?: Prisma.DateTimeFilter<"ContestJudge"> | Date | string;
    contest?: Prisma.XOR<Prisma.ContestScalarRelationFilter, Prisma.ContestWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "contestId_userId">;
export type ContestJudgeOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    addedAt?: Prisma.SortOrder;
    _count?: Prisma.ContestJudgeCountOrderByAggregateInput;
    _max?: Prisma.ContestJudgeMaxOrderByAggregateInput;
    _min?: Prisma.ContestJudgeMinOrderByAggregateInput;
};
export type ContestJudgeScalarWhereWithAggregatesInput = {
    AND?: Prisma.ContestJudgeScalarWhereWithAggregatesInput | Prisma.ContestJudgeScalarWhereWithAggregatesInput[];
    OR?: Prisma.ContestJudgeScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ContestJudgeScalarWhereWithAggregatesInput | Prisma.ContestJudgeScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"ContestJudge"> | string;
    contestId?: Prisma.StringWithAggregatesFilter<"ContestJudge"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"ContestJudge"> | string;
    status?: Prisma.StringWithAggregatesFilter<"ContestJudge"> | string;
    addedAt?: Prisma.DateTimeWithAggregatesFilter<"ContestJudge"> | Date | string;
};
export type ContestJudgeCreateInput = {
    id?: string;
    status?: string;
    addedAt?: Date | string;
    contest: Prisma.ContestCreateNestedOneWithoutJudgesInput;
    user: Prisma.UserCreateNestedOneWithoutContestJudgesInput;
};
export type ContestJudgeUncheckedCreateInput = {
    id?: string;
    contestId: string;
    userId: string;
    status?: string;
    addedAt?: Date | string;
};
export type ContestJudgeUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    addedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contest?: Prisma.ContestUpdateOneRequiredWithoutJudgesNestedInput;
    user?: Prisma.UserUpdateOneRequiredWithoutContestJudgesNestedInput;
};
export type ContestJudgeUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    addedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestJudgeCreateManyInput = {
    id?: string;
    contestId: string;
    userId: string;
    status?: string;
    addedAt?: Date | string;
};
export type ContestJudgeUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    addedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestJudgeUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    addedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestJudgeListRelationFilter = {
    every?: Prisma.ContestJudgeWhereInput;
    some?: Prisma.ContestJudgeWhereInput;
    none?: Prisma.ContestJudgeWhereInput;
};
export type ContestJudgeOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type ContestJudgeContestIdUserIdCompoundUniqueInput = {
    contestId: string;
    userId: string;
};
export type ContestJudgeCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    addedAt?: Prisma.SortOrder;
};
export type ContestJudgeMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    addedAt?: Prisma.SortOrder;
};
export type ContestJudgeMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    addedAt?: Prisma.SortOrder;
};
export type ContestJudgeCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.ContestJudgeCreateWithoutUserInput, Prisma.ContestJudgeUncheckedCreateWithoutUserInput> | Prisma.ContestJudgeCreateWithoutUserInput[] | Prisma.ContestJudgeUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ContestJudgeCreateOrConnectWithoutUserInput | Prisma.ContestJudgeCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.ContestJudgeCreateManyUserInputEnvelope;
    connect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
};
export type ContestJudgeUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.ContestJudgeCreateWithoutUserInput, Prisma.ContestJudgeUncheckedCreateWithoutUserInput> | Prisma.ContestJudgeCreateWithoutUserInput[] | Prisma.ContestJudgeUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ContestJudgeCreateOrConnectWithoutUserInput | Prisma.ContestJudgeCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.ContestJudgeCreateManyUserInputEnvelope;
    connect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
};
export type ContestJudgeUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.ContestJudgeCreateWithoutUserInput, Prisma.ContestJudgeUncheckedCreateWithoutUserInput> | Prisma.ContestJudgeCreateWithoutUserInput[] | Prisma.ContestJudgeUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ContestJudgeCreateOrConnectWithoutUserInput | Prisma.ContestJudgeCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.ContestJudgeUpsertWithWhereUniqueWithoutUserInput | Prisma.ContestJudgeUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.ContestJudgeCreateManyUserInputEnvelope;
    set?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    disconnect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    delete?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    connect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    update?: Prisma.ContestJudgeUpdateWithWhereUniqueWithoutUserInput | Prisma.ContestJudgeUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.ContestJudgeUpdateManyWithWhereWithoutUserInput | Prisma.ContestJudgeUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.ContestJudgeScalarWhereInput | Prisma.ContestJudgeScalarWhereInput[];
};
export type ContestJudgeUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.ContestJudgeCreateWithoutUserInput, Prisma.ContestJudgeUncheckedCreateWithoutUserInput> | Prisma.ContestJudgeCreateWithoutUserInput[] | Prisma.ContestJudgeUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ContestJudgeCreateOrConnectWithoutUserInput | Prisma.ContestJudgeCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.ContestJudgeUpsertWithWhereUniqueWithoutUserInput | Prisma.ContestJudgeUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.ContestJudgeCreateManyUserInputEnvelope;
    set?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    disconnect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    delete?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    connect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    update?: Prisma.ContestJudgeUpdateWithWhereUniqueWithoutUserInput | Prisma.ContestJudgeUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.ContestJudgeUpdateManyWithWhereWithoutUserInput | Prisma.ContestJudgeUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.ContestJudgeScalarWhereInput | Prisma.ContestJudgeScalarWhereInput[];
};
export type ContestJudgeCreateNestedManyWithoutContestInput = {
    create?: Prisma.XOR<Prisma.ContestJudgeCreateWithoutContestInput, Prisma.ContestJudgeUncheckedCreateWithoutContestInput> | Prisma.ContestJudgeCreateWithoutContestInput[] | Prisma.ContestJudgeUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestJudgeCreateOrConnectWithoutContestInput | Prisma.ContestJudgeCreateOrConnectWithoutContestInput[];
    createMany?: Prisma.ContestJudgeCreateManyContestInputEnvelope;
    connect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
};
export type ContestJudgeUncheckedCreateNestedManyWithoutContestInput = {
    create?: Prisma.XOR<Prisma.ContestJudgeCreateWithoutContestInput, Prisma.ContestJudgeUncheckedCreateWithoutContestInput> | Prisma.ContestJudgeCreateWithoutContestInput[] | Prisma.ContestJudgeUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestJudgeCreateOrConnectWithoutContestInput | Prisma.ContestJudgeCreateOrConnectWithoutContestInput[];
    createMany?: Prisma.ContestJudgeCreateManyContestInputEnvelope;
    connect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
};
export type ContestJudgeUpdateManyWithoutContestNestedInput = {
    create?: Prisma.XOR<Prisma.ContestJudgeCreateWithoutContestInput, Prisma.ContestJudgeUncheckedCreateWithoutContestInput> | Prisma.ContestJudgeCreateWithoutContestInput[] | Prisma.ContestJudgeUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestJudgeCreateOrConnectWithoutContestInput | Prisma.ContestJudgeCreateOrConnectWithoutContestInput[];
    upsert?: Prisma.ContestJudgeUpsertWithWhereUniqueWithoutContestInput | Prisma.ContestJudgeUpsertWithWhereUniqueWithoutContestInput[];
    createMany?: Prisma.ContestJudgeCreateManyContestInputEnvelope;
    set?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    disconnect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    delete?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    connect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    update?: Prisma.ContestJudgeUpdateWithWhereUniqueWithoutContestInput | Prisma.ContestJudgeUpdateWithWhereUniqueWithoutContestInput[];
    updateMany?: Prisma.ContestJudgeUpdateManyWithWhereWithoutContestInput | Prisma.ContestJudgeUpdateManyWithWhereWithoutContestInput[];
    deleteMany?: Prisma.ContestJudgeScalarWhereInput | Prisma.ContestJudgeScalarWhereInput[];
};
export type ContestJudgeUncheckedUpdateManyWithoutContestNestedInput = {
    create?: Prisma.XOR<Prisma.ContestJudgeCreateWithoutContestInput, Prisma.ContestJudgeUncheckedCreateWithoutContestInput> | Prisma.ContestJudgeCreateWithoutContestInput[] | Prisma.ContestJudgeUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestJudgeCreateOrConnectWithoutContestInput | Prisma.ContestJudgeCreateOrConnectWithoutContestInput[];
    upsert?: Prisma.ContestJudgeUpsertWithWhereUniqueWithoutContestInput | Prisma.ContestJudgeUpsertWithWhereUniqueWithoutContestInput[];
    createMany?: Prisma.ContestJudgeCreateManyContestInputEnvelope;
    set?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    disconnect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    delete?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    connect?: Prisma.ContestJudgeWhereUniqueInput | Prisma.ContestJudgeWhereUniqueInput[];
    update?: Prisma.ContestJudgeUpdateWithWhereUniqueWithoutContestInput | Prisma.ContestJudgeUpdateWithWhereUniqueWithoutContestInput[];
    updateMany?: Prisma.ContestJudgeUpdateManyWithWhereWithoutContestInput | Prisma.ContestJudgeUpdateManyWithWhereWithoutContestInput[];
    deleteMany?: Prisma.ContestJudgeScalarWhereInput | Prisma.ContestJudgeScalarWhereInput[];
};
export type ContestJudgeCreateWithoutUserInput = {
    id?: string;
    status?: string;
    addedAt?: Date | string;
    contest: Prisma.ContestCreateNestedOneWithoutJudgesInput;
};
export type ContestJudgeUncheckedCreateWithoutUserInput = {
    id?: string;
    contestId: string;
    status?: string;
    addedAt?: Date | string;
};
export type ContestJudgeCreateOrConnectWithoutUserInput = {
    where: Prisma.ContestJudgeWhereUniqueInput;
    create: Prisma.XOR<Prisma.ContestJudgeCreateWithoutUserInput, Prisma.ContestJudgeUncheckedCreateWithoutUserInput>;
};
export type ContestJudgeCreateManyUserInputEnvelope = {
    data: Prisma.ContestJudgeCreateManyUserInput | Prisma.ContestJudgeCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type ContestJudgeUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.ContestJudgeWhereUniqueInput;
    update: Prisma.XOR<Prisma.ContestJudgeUpdateWithoutUserInput, Prisma.ContestJudgeUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.ContestJudgeCreateWithoutUserInput, Prisma.ContestJudgeUncheckedCreateWithoutUserInput>;
};
export type ContestJudgeUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.ContestJudgeWhereUniqueInput;
    data: Prisma.XOR<Prisma.ContestJudgeUpdateWithoutUserInput, Prisma.ContestJudgeUncheckedUpdateWithoutUserInput>;
};
export type ContestJudgeUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.ContestJudgeScalarWhereInput;
    data: Prisma.XOR<Prisma.ContestJudgeUpdateManyMutationInput, Prisma.ContestJudgeUncheckedUpdateManyWithoutUserInput>;
};
export type ContestJudgeScalarWhereInput = {
    AND?: Prisma.ContestJudgeScalarWhereInput | Prisma.ContestJudgeScalarWhereInput[];
    OR?: Prisma.ContestJudgeScalarWhereInput[];
    NOT?: Prisma.ContestJudgeScalarWhereInput | Prisma.ContestJudgeScalarWhereInput[];
    id?: Prisma.StringFilter<"ContestJudge"> | string;
    contestId?: Prisma.StringFilter<"ContestJudge"> | string;
    userId?: Prisma.StringFilter<"ContestJudge"> | string;
    status?: Prisma.StringFilter<"ContestJudge"> | string;
    addedAt?: Prisma.DateTimeFilter<"ContestJudge"> | Date | string;
};
export type ContestJudgeCreateWithoutContestInput = {
    id?: string;
    status?: string;
    addedAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutContestJudgesInput;
};
export type ContestJudgeUncheckedCreateWithoutContestInput = {
    id?: string;
    userId: string;
    status?: string;
    addedAt?: Date | string;
};
export type ContestJudgeCreateOrConnectWithoutContestInput = {
    where: Prisma.ContestJudgeWhereUniqueInput;
    create: Prisma.XOR<Prisma.ContestJudgeCreateWithoutContestInput, Prisma.ContestJudgeUncheckedCreateWithoutContestInput>;
};
export type ContestJudgeCreateManyContestInputEnvelope = {
    data: Prisma.ContestJudgeCreateManyContestInput | Prisma.ContestJudgeCreateManyContestInput[];
    skipDuplicates?: boolean;
};
export type ContestJudgeUpsertWithWhereUniqueWithoutContestInput = {
    where: Prisma.ContestJudgeWhereUniqueInput;
    update: Prisma.XOR<Prisma.ContestJudgeUpdateWithoutContestInput, Prisma.ContestJudgeUncheckedUpdateWithoutContestInput>;
    create: Prisma.XOR<Prisma.ContestJudgeCreateWithoutContestInput, Prisma.ContestJudgeUncheckedCreateWithoutContestInput>;
};
export type ContestJudgeUpdateWithWhereUniqueWithoutContestInput = {
    where: Prisma.ContestJudgeWhereUniqueInput;
    data: Prisma.XOR<Prisma.ContestJudgeUpdateWithoutContestInput, Prisma.ContestJudgeUncheckedUpdateWithoutContestInput>;
};
export type ContestJudgeUpdateManyWithWhereWithoutContestInput = {
    where: Prisma.ContestJudgeScalarWhereInput;
    data: Prisma.XOR<Prisma.ContestJudgeUpdateManyMutationInput, Prisma.ContestJudgeUncheckedUpdateManyWithoutContestInput>;
};
export type ContestJudgeCreateManyUserInput = {
    id?: string;
    contestId: string;
    status?: string;
    addedAt?: Date | string;
};
export type ContestJudgeUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    addedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    contest?: Prisma.ContestUpdateOneRequiredWithoutJudgesNestedInput;
};
export type ContestJudgeUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    addedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestJudgeUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    addedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestJudgeCreateManyContestInput = {
    id?: string;
    userId: string;
    status?: string;
    addedAt?: Date | string;
};
export type ContestJudgeUpdateWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    addedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutContestJudgesNestedInput;
};
export type ContestJudgeUncheckedUpdateWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    addedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestJudgeUncheckedUpdateManyWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    addedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ContestJudgeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    userId?: boolean;
    status?: boolean;
    addedAt?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestJudge"]>;
export type ContestJudgeSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    userId?: boolean;
    status?: boolean;
    addedAt?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestJudge"]>;
export type ContestJudgeSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    userId?: boolean;
    status?: boolean;
    addedAt?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestJudge"]>;
export type ContestJudgeSelectScalar = {
    id?: boolean;
    contestId?: boolean;
    userId?: boolean;
    status?: boolean;
    addedAt?: boolean;
};
export type ContestJudgeOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "contestId" | "userId" | "status" | "addedAt", ExtArgs["result"]["contestJudge"]>;
export type ContestJudgeInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type ContestJudgeIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type ContestJudgeIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $ContestJudgePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ContestJudge";
    objects: {
        contest: Prisma.$ContestPayload<ExtArgs>;
        user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        contestId: string;
        userId: string;
        status: string;
        addedAt: Date;
    }, ExtArgs["result"]["contestJudge"]>;
    composites: {};
};
export type ContestJudgeGetPayload<S extends boolean | null | undefined | ContestJudgeDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload, S>;
export type ContestJudgeCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ContestJudgeFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ContestJudgeCountAggregateInputType | true;
};
export interface ContestJudgeDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['ContestJudge'];
        meta: {
            name: 'ContestJudge';
        };
    };
    /**
     * Find zero or one ContestJudge that matches the filter.
     * @param {ContestJudgeFindUniqueArgs} args - Arguments to find a ContestJudge
     * @example
     * // Get one ContestJudge
     * const contestJudge = await prisma.contestJudge.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContestJudgeFindUniqueArgs>(args: Prisma.SelectSubset<T, ContestJudgeFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ContestJudgeClient<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one ContestJudge that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContestJudgeFindUniqueOrThrowArgs} args - Arguments to find a ContestJudge
     * @example
     * // Get one ContestJudge
     * const contestJudge = await prisma.contestJudge.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContestJudgeFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ContestJudgeFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ContestJudgeClient<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first ContestJudge that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestJudgeFindFirstArgs} args - Arguments to find a ContestJudge
     * @example
     * // Get one ContestJudge
     * const contestJudge = await prisma.contestJudge.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContestJudgeFindFirstArgs>(args?: Prisma.SelectSubset<T, ContestJudgeFindFirstArgs<ExtArgs>>): Prisma.Prisma__ContestJudgeClient<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first ContestJudge that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestJudgeFindFirstOrThrowArgs} args - Arguments to find a ContestJudge
     * @example
     * // Get one ContestJudge
     * const contestJudge = await prisma.contestJudge.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContestJudgeFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ContestJudgeFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ContestJudgeClient<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more ContestJudges that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestJudgeFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContestJudges
     * const contestJudges = await prisma.contestJudge.findMany()
     *
     * // Get first 10 ContestJudges
     * const contestJudges = await prisma.contestJudge.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const contestJudgeWithIdOnly = await prisma.contestJudge.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ContestJudgeFindManyArgs>(args?: Prisma.SelectSubset<T, ContestJudgeFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a ContestJudge.
     * @param {ContestJudgeCreateArgs} args - Arguments to create a ContestJudge.
     * @example
     * // Create one ContestJudge
     * const ContestJudge = await prisma.contestJudge.create({
     *   data: {
     *     // ... data to create a ContestJudge
     *   }
     * })
     *
     */
    create<T extends ContestJudgeCreateArgs>(args: Prisma.SelectSubset<T, ContestJudgeCreateArgs<ExtArgs>>): Prisma.Prisma__ContestJudgeClient<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many ContestJudges.
     * @param {ContestJudgeCreateManyArgs} args - Arguments to create many ContestJudges.
     * @example
     * // Create many ContestJudges
     * const contestJudge = await prisma.contestJudge.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ContestJudgeCreateManyArgs>(args?: Prisma.SelectSubset<T, ContestJudgeCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many ContestJudges and returns the data saved in the database.
     * @param {ContestJudgeCreateManyAndReturnArgs} args - Arguments to create many ContestJudges.
     * @example
     * // Create many ContestJudges
     * const contestJudge = await prisma.contestJudge.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ContestJudges and only return the `id`
     * const contestJudgeWithIdOnly = await prisma.contestJudge.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ContestJudgeCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ContestJudgeCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a ContestJudge.
     * @param {ContestJudgeDeleteArgs} args - Arguments to delete one ContestJudge.
     * @example
     * // Delete one ContestJudge
     * const ContestJudge = await prisma.contestJudge.delete({
     *   where: {
     *     // ... filter to delete one ContestJudge
     *   }
     * })
     *
     */
    delete<T extends ContestJudgeDeleteArgs>(args: Prisma.SelectSubset<T, ContestJudgeDeleteArgs<ExtArgs>>): Prisma.Prisma__ContestJudgeClient<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one ContestJudge.
     * @param {ContestJudgeUpdateArgs} args - Arguments to update one ContestJudge.
     * @example
     * // Update one ContestJudge
     * const contestJudge = await prisma.contestJudge.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ContestJudgeUpdateArgs>(args: Prisma.SelectSubset<T, ContestJudgeUpdateArgs<ExtArgs>>): Prisma.Prisma__ContestJudgeClient<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more ContestJudges.
     * @param {ContestJudgeDeleteManyArgs} args - Arguments to filter ContestJudges to delete.
     * @example
     * // Delete a few ContestJudges
     * const { count } = await prisma.contestJudge.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ContestJudgeDeleteManyArgs>(args?: Prisma.SelectSubset<T, ContestJudgeDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more ContestJudges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestJudgeUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContestJudges
     * const contestJudge = await prisma.contestJudge.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ContestJudgeUpdateManyArgs>(args: Prisma.SelectSubset<T, ContestJudgeUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more ContestJudges and returns the data updated in the database.
     * @param {ContestJudgeUpdateManyAndReturnArgs} args - Arguments to update many ContestJudges.
     * @example
     * // Update many ContestJudges
     * const contestJudge = await prisma.contestJudge.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ContestJudges and only return the `id`
     * const contestJudgeWithIdOnly = await prisma.contestJudge.updateManyAndReturn({
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
    updateManyAndReturn<T extends ContestJudgeUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ContestJudgeUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one ContestJudge.
     * @param {ContestJudgeUpsertArgs} args - Arguments to update or create a ContestJudge.
     * @example
     * // Update or create a ContestJudge
     * const contestJudge = await prisma.contestJudge.upsert({
     *   create: {
     *     // ... data to create a ContestJudge
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContestJudge we want to update
     *   }
     * })
     */
    upsert<T extends ContestJudgeUpsertArgs>(args: Prisma.SelectSubset<T, ContestJudgeUpsertArgs<ExtArgs>>): Prisma.Prisma__ContestJudgeClient<runtime.Types.Result.GetResult<Prisma.$ContestJudgePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of ContestJudges.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestJudgeCountArgs} args - Arguments to filter ContestJudges to count.
     * @example
     * // Count the number of ContestJudges
     * const count = await prisma.contestJudge.count({
     *   where: {
     *     // ... the filter for the ContestJudges we want to count
     *   }
     * })
    **/
    count<T extends ContestJudgeCountArgs>(args?: Prisma.Subset<T, ContestJudgeCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ContestJudgeCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a ContestJudge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestJudgeAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ContestJudgeAggregateArgs>(args: Prisma.Subset<T, ContestJudgeAggregateArgs>): Prisma.PrismaPromise<GetContestJudgeAggregateType<T>>;
    /**
     * Group by ContestJudge.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestJudgeGroupByArgs} args - Group by arguments.
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
    groupBy<T extends ContestJudgeGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ContestJudgeGroupByArgs['orderBy'];
    } : {
        orderBy?: ContestJudgeGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ContestJudgeGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContestJudgeGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the ContestJudge model
     */
    readonly fields: ContestJudgeFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for ContestJudge.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__ContestJudgeClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
 * Fields of the ContestJudge model
 */
export interface ContestJudgeFieldRefs {
    readonly id: Prisma.FieldRef<"ContestJudge", 'String'>;
    readonly contestId: Prisma.FieldRef<"ContestJudge", 'String'>;
    readonly userId: Prisma.FieldRef<"ContestJudge", 'String'>;
    readonly status: Prisma.FieldRef<"ContestJudge", 'String'>;
    readonly addedAt: Prisma.FieldRef<"ContestJudge", 'DateTime'>;
}
/**
 * ContestJudge findUnique
 */
export type ContestJudgeFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeInclude<ExtArgs> | null;
    /**
     * Filter, which ContestJudge to fetch.
     */
    where: Prisma.ContestJudgeWhereUniqueInput;
};
/**
 * ContestJudge findUniqueOrThrow
 */
export type ContestJudgeFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeInclude<ExtArgs> | null;
    /**
     * Filter, which ContestJudge to fetch.
     */
    where: Prisma.ContestJudgeWhereUniqueInput;
};
/**
 * ContestJudge findFirst
 */
export type ContestJudgeFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeInclude<ExtArgs> | null;
    /**
     * Filter, which ContestJudge to fetch.
     */
    where?: Prisma.ContestJudgeWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestJudges to fetch.
     */
    orderBy?: Prisma.ContestJudgeOrderByWithRelationInput | Prisma.ContestJudgeOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ContestJudges.
     */
    cursor?: Prisma.ContestJudgeWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestJudges from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestJudges.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ContestJudges.
     */
    distinct?: Prisma.ContestJudgeScalarFieldEnum | Prisma.ContestJudgeScalarFieldEnum[];
};
/**
 * ContestJudge findFirstOrThrow
 */
export type ContestJudgeFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeInclude<ExtArgs> | null;
    /**
     * Filter, which ContestJudge to fetch.
     */
    where?: Prisma.ContestJudgeWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestJudges to fetch.
     */
    orderBy?: Prisma.ContestJudgeOrderByWithRelationInput | Prisma.ContestJudgeOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ContestJudges.
     */
    cursor?: Prisma.ContestJudgeWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestJudges from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestJudges.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ContestJudges.
     */
    distinct?: Prisma.ContestJudgeScalarFieldEnum | Prisma.ContestJudgeScalarFieldEnum[];
};
/**
 * ContestJudge findMany
 */
export type ContestJudgeFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeInclude<ExtArgs> | null;
    /**
     * Filter, which ContestJudges to fetch.
     */
    where?: Prisma.ContestJudgeWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestJudges to fetch.
     */
    orderBy?: Prisma.ContestJudgeOrderByWithRelationInput | Prisma.ContestJudgeOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ContestJudges.
     */
    cursor?: Prisma.ContestJudgeWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestJudges from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestJudges.
     */
    skip?: number;
    distinct?: Prisma.ContestJudgeScalarFieldEnum | Prisma.ContestJudgeScalarFieldEnum[];
};
/**
 * ContestJudge create
 */
export type ContestJudgeCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeInclude<ExtArgs> | null;
    /**
     * The data needed to create a ContestJudge.
     */
    data: Prisma.XOR<Prisma.ContestJudgeCreateInput, Prisma.ContestJudgeUncheckedCreateInput>;
};
/**
 * ContestJudge createMany
 */
export type ContestJudgeCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContestJudges.
     */
    data: Prisma.ContestJudgeCreateManyInput | Prisma.ContestJudgeCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * ContestJudge createManyAndReturn
 */
export type ContestJudgeCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * The data used to create many ContestJudges.
     */
    data: Prisma.ContestJudgeCreateManyInput | Prisma.ContestJudgeCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * ContestJudge update
 */
export type ContestJudgeUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeInclude<ExtArgs> | null;
    /**
     * The data needed to update a ContestJudge.
     */
    data: Prisma.XOR<Prisma.ContestJudgeUpdateInput, Prisma.ContestJudgeUncheckedUpdateInput>;
    /**
     * Choose, which ContestJudge to update.
     */
    where: Prisma.ContestJudgeWhereUniqueInput;
};
/**
 * ContestJudge updateMany
 */
export type ContestJudgeUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update ContestJudges.
     */
    data: Prisma.XOR<Prisma.ContestJudgeUpdateManyMutationInput, Prisma.ContestJudgeUncheckedUpdateManyInput>;
    /**
     * Filter which ContestJudges to update
     */
    where?: Prisma.ContestJudgeWhereInput;
    /**
     * Limit how many ContestJudges to update.
     */
    limit?: number;
};
/**
 * ContestJudge updateManyAndReturn
 */
export type ContestJudgeUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * The data used to update ContestJudges.
     */
    data: Prisma.XOR<Prisma.ContestJudgeUpdateManyMutationInput, Prisma.ContestJudgeUncheckedUpdateManyInput>;
    /**
     * Filter which ContestJudges to update
     */
    where?: Prisma.ContestJudgeWhereInput;
    /**
     * Limit how many ContestJudges to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * ContestJudge upsert
 */
export type ContestJudgeUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeInclude<ExtArgs> | null;
    /**
     * The filter to search for the ContestJudge to update in case it exists.
     */
    where: Prisma.ContestJudgeWhereUniqueInput;
    /**
     * In case the ContestJudge found by the `where` argument doesn't exist, create a new ContestJudge with this data.
     */
    create: Prisma.XOR<Prisma.ContestJudgeCreateInput, Prisma.ContestJudgeUncheckedCreateInput>;
    /**
     * In case the ContestJudge was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.ContestJudgeUpdateInput, Prisma.ContestJudgeUncheckedUpdateInput>;
};
/**
 * ContestJudge delete
 */
export type ContestJudgeDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeInclude<ExtArgs> | null;
    /**
     * Filter which ContestJudge to delete.
     */
    where: Prisma.ContestJudgeWhereUniqueInput;
};
/**
 * ContestJudge deleteMany
 */
export type ContestJudgeDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which ContestJudges to delete
     */
    where?: Prisma.ContestJudgeWhereInput;
    /**
     * Limit how many ContestJudges to delete.
     */
    limit?: number;
};
/**
 * ContestJudge without action
 */
export type ContestJudgeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestJudge
     */
    select?: Prisma.ContestJudgeSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestJudge
     */
    omit?: Prisma.ContestJudgeOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestJudgeInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=ContestJudge.d.ts.map