import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model MilestoneCompletion
 *
 */
export type MilestoneCompletionModel = runtime.Types.Result.DefaultSelection<Prisma.$MilestoneCompletionPayload>;
export type AggregateMilestoneCompletion = {
    _count: MilestoneCompletionCountAggregateOutputType | null;
    _min: MilestoneCompletionMinAggregateOutputType | null;
    _max: MilestoneCompletionMaxAggregateOutputType | null;
};
export type MilestoneCompletionMinAggregateOutputType = {
    id: string | null;
    milestoneId: string | null;
    userId: string | null;
    completedAt: Date | null;
};
export type MilestoneCompletionMaxAggregateOutputType = {
    id: string | null;
    milestoneId: string | null;
    userId: string | null;
    completedAt: Date | null;
};
export type MilestoneCompletionCountAggregateOutputType = {
    id: number;
    milestoneId: number;
    userId: number;
    completedAt: number;
    _all: number;
};
export type MilestoneCompletionMinAggregateInputType = {
    id?: true;
    milestoneId?: true;
    userId?: true;
    completedAt?: true;
};
export type MilestoneCompletionMaxAggregateInputType = {
    id?: true;
    milestoneId?: true;
    userId?: true;
    completedAt?: true;
};
export type MilestoneCompletionCountAggregateInputType = {
    id?: true;
    milestoneId?: true;
    userId?: true;
    completedAt?: true;
    _all?: true;
};
export type MilestoneCompletionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which MilestoneCompletion to aggregate.
     */
    where?: Prisma.MilestoneCompletionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MilestoneCompletions to fetch.
     */
    orderBy?: Prisma.MilestoneCompletionOrderByWithRelationInput | Prisma.MilestoneCompletionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.MilestoneCompletionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MilestoneCompletions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MilestoneCompletions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned MilestoneCompletions
    **/
    _count?: true | MilestoneCompletionCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: MilestoneCompletionMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: MilestoneCompletionMaxAggregateInputType;
};
export type GetMilestoneCompletionAggregateType<T extends MilestoneCompletionAggregateArgs> = {
    [P in keyof T & keyof AggregateMilestoneCompletion]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateMilestoneCompletion[P]> : Prisma.GetScalarType<T[P], AggregateMilestoneCompletion[P]>;
};
export type MilestoneCompletionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MilestoneCompletionWhereInput;
    orderBy?: Prisma.MilestoneCompletionOrderByWithAggregationInput | Prisma.MilestoneCompletionOrderByWithAggregationInput[];
    by: Prisma.MilestoneCompletionScalarFieldEnum[] | Prisma.MilestoneCompletionScalarFieldEnum;
    having?: Prisma.MilestoneCompletionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: MilestoneCompletionCountAggregateInputType | true;
    _min?: MilestoneCompletionMinAggregateInputType;
    _max?: MilestoneCompletionMaxAggregateInputType;
};
export type MilestoneCompletionGroupByOutputType = {
    id: string;
    milestoneId: string;
    userId: string;
    completedAt: Date;
    _count: MilestoneCompletionCountAggregateOutputType | null;
    _min: MilestoneCompletionMinAggregateOutputType | null;
    _max: MilestoneCompletionMaxAggregateOutputType | null;
};
type GetMilestoneCompletionGroupByPayload<T extends MilestoneCompletionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<MilestoneCompletionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof MilestoneCompletionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], MilestoneCompletionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], MilestoneCompletionGroupByOutputType[P]>;
}>>;
export type MilestoneCompletionWhereInput = {
    AND?: Prisma.MilestoneCompletionWhereInput | Prisma.MilestoneCompletionWhereInput[];
    OR?: Prisma.MilestoneCompletionWhereInput[];
    NOT?: Prisma.MilestoneCompletionWhereInput | Prisma.MilestoneCompletionWhereInput[];
    id?: Prisma.StringFilter<"MilestoneCompletion"> | string;
    milestoneId?: Prisma.StringFilter<"MilestoneCompletion"> | string;
    userId?: Prisma.StringFilter<"MilestoneCompletion"> | string;
    completedAt?: Prisma.DateTimeFilter<"MilestoneCompletion"> | Date | string;
    milestone?: Prisma.XOR<Prisma.MilestoneScalarRelationFilter, Prisma.MilestoneWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type MilestoneCompletionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    milestoneId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
    milestone?: Prisma.MilestoneOrderByWithRelationInput;
    user?: Prisma.UserOrderByWithRelationInput;
};
export type MilestoneCompletionWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    milestoneId?: string;
    AND?: Prisma.MilestoneCompletionWhereInput | Prisma.MilestoneCompletionWhereInput[];
    OR?: Prisma.MilestoneCompletionWhereInput[];
    NOT?: Prisma.MilestoneCompletionWhereInput | Prisma.MilestoneCompletionWhereInput[];
    userId?: Prisma.StringFilter<"MilestoneCompletion"> | string;
    completedAt?: Prisma.DateTimeFilter<"MilestoneCompletion"> | Date | string;
    milestone?: Prisma.XOR<Prisma.MilestoneScalarRelationFilter, Prisma.MilestoneWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "milestoneId">;
export type MilestoneCompletionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    milestoneId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
    _count?: Prisma.MilestoneCompletionCountOrderByAggregateInput;
    _max?: Prisma.MilestoneCompletionMaxOrderByAggregateInput;
    _min?: Prisma.MilestoneCompletionMinOrderByAggregateInput;
};
export type MilestoneCompletionScalarWhereWithAggregatesInput = {
    AND?: Prisma.MilestoneCompletionScalarWhereWithAggregatesInput | Prisma.MilestoneCompletionScalarWhereWithAggregatesInput[];
    OR?: Prisma.MilestoneCompletionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.MilestoneCompletionScalarWhereWithAggregatesInput | Prisma.MilestoneCompletionScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"MilestoneCompletion"> | string;
    milestoneId?: Prisma.StringWithAggregatesFilter<"MilestoneCompletion"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"MilestoneCompletion"> | string;
    completedAt?: Prisma.DateTimeWithAggregatesFilter<"MilestoneCompletion"> | Date | string;
};
export type MilestoneCompletionCreateInput = {
    id?: string;
    completedAt?: Date | string;
    milestone: Prisma.MilestoneCreateNestedOneWithoutCompletionsInput;
    user: Prisma.UserCreateNestedOneWithoutMilestoneCompletionsInput;
};
export type MilestoneCompletionUncheckedCreateInput = {
    id?: string;
    milestoneId: string;
    userId: string;
    completedAt?: Date | string;
};
export type MilestoneCompletionUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    completedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    milestone?: Prisma.MilestoneUpdateOneRequiredWithoutCompletionsNestedInput;
    user?: Prisma.UserUpdateOneRequiredWithoutMilestoneCompletionsNestedInput;
};
export type MilestoneCompletionUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    milestoneId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    completedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MilestoneCompletionCreateManyInput = {
    id?: string;
    milestoneId: string;
    userId: string;
    completedAt?: Date | string;
};
export type MilestoneCompletionUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    completedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MilestoneCompletionUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    milestoneId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    completedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MilestoneCompletionListRelationFilter = {
    every?: Prisma.MilestoneCompletionWhereInput;
    some?: Prisma.MilestoneCompletionWhereInput;
    none?: Prisma.MilestoneCompletionWhereInput;
};
export type MilestoneCompletionOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type MilestoneCompletionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    milestoneId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
};
export type MilestoneCompletionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    milestoneId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
};
export type MilestoneCompletionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    milestoneId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    completedAt?: Prisma.SortOrder;
};
export type MilestoneCompletionCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutUserInput, Prisma.MilestoneCompletionUncheckedCreateWithoutUserInput> | Prisma.MilestoneCompletionCreateWithoutUserInput[] | Prisma.MilestoneCompletionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MilestoneCompletionCreateOrConnectWithoutUserInput | Prisma.MilestoneCompletionCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.MilestoneCompletionCreateManyUserInputEnvelope;
    connect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
};
export type MilestoneCompletionUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutUserInput, Prisma.MilestoneCompletionUncheckedCreateWithoutUserInput> | Prisma.MilestoneCompletionCreateWithoutUserInput[] | Prisma.MilestoneCompletionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MilestoneCompletionCreateOrConnectWithoutUserInput | Prisma.MilestoneCompletionCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.MilestoneCompletionCreateManyUserInputEnvelope;
    connect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
};
export type MilestoneCompletionUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutUserInput, Prisma.MilestoneCompletionUncheckedCreateWithoutUserInput> | Prisma.MilestoneCompletionCreateWithoutUserInput[] | Prisma.MilestoneCompletionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MilestoneCompletionCreateOrConnectWithoutUserInput | Prisma.MilestoneCompletionCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.MilestoneCompletionUpsertWithWhereUniqueWithoutUserInput | Prisma.MilestoneCompletionUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.MilestoneCompletionCreateManyUserInputEnvelope;
    set?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    disconnect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    delete?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    connect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    update?: Prisma.MilestoneCompletionUpdateWithWhereUniqueWithoutUserInput | Prisma.MilestoneCompletionUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.MilestoneCompletionUpdateManyWithWhereWithoutUserInput | Prisma.MilestoneCompletionUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.MilestoneCompletionScalarWhereInput | Prisma.MilestoneCompletionScalarWhereInput[];
};
export type MilestoneCompletionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutUserInput, Prisma.MilestoneCompletionUncheckedCreateWithoutUserInput> | Prisma.MilestoneCompletionCreateWithoutUserInput[] | Prisma.MilestoneCompletionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MilestoneCompletionCreateOrConnectWithoutUserInput | Prisma.MilestoneCompletionCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.MilestoneCompletionUpsertWithWhereUniqueWithoutUserInput | Prisma.MilestoneCompletionUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.MilestoneCompletionCreateManyUserInputEnvelope;
    set?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    disconnect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    delete?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    connect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    update?: Prisma.MilestoneCompletionUpdateWithWhereUniqueWithoutUserInput | Prisma.MilestoneCompletionUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.MilestoneCompletionUpdateManyWithWhereWithoutUserInput | Prisma.MilestoneCompletionUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.MilestoneCompletionScalarWhereInput | Prisma.MilestoneCompletionScalarWhereInput[];
};
export type MilestoneCompletionCreateNestedManyWithoutMilestoneInput = {
    create?: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutMilestoneInput, Prisma.MilestoneCompletionUncheckedCreateWithoutMilestoneInput> | Prisma.MilestoneCompletionCreateWithoutMilestoneInput[] | Prisma.MilestoneCompletionUncheckedCreateWithoutMilestoneInput[];
    connectOrCreate?: Prisma.MilestoneCompletionCreateOrConnectWithoutMilestoneInput | Prisma.MilestoneCompletionCreateOrConnectWithoutMilestoneInput[];
    createMany?: Prisma.MilestoneCompletionCreateManyMilestoneInputEnvelope;
    connect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
};
export type MilestoneCompletionUncheckedCreateNestedManyWithoutMilestoneInput = {
    create?: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutMilestoneInput, Prisma.MilestoneCompletionUncheckedCreateWithoutMilestoneInput> | Prisma.MilestoneCompletionCreateWithoutMilestoneInput[] | Prisma.MilestoneCompletionUncheckedCreateWithoutMilestoneInput[];
    connectOrCreate?: Prisma.MilestoneCompletionCreateOrConnectWithoutMilestoneInput | Prisma.MilestoneCompletionCreateOrConnectWithoutMilestoneInput[];
    createMany?: Prisma.MilestoneCompletionCreateManyMilestoneInputEnvelope;
    connect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
};
export type MilestoneCompletionUpdateManyWithoutMilestoneNestedInput = {
    create?: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutMilestoneInput, Prisma.MilestoneCompletionUncheckedCreateWithoutMilestoneInput> | Prisma.MilestoneCompletionCreateWithoutMilestoneInput[] | Prisma.MilestoneCompletionUncheckedCreateWithoutMilestoneInput[];
    connectOrCreate?: Prisma.MilestoneCompletionCreateOrConnectWithoutMilestoneInput | Prisma.MilestoneCompletionCreateOrConnectWithoutMilestoneInput[];
    upsert?: Prisma.MilestoneCompletionUpsertWithWhereUniqueWithoutMilestoneInput | Prisma.MilestoneCompletionUpsertWithWhereUniqueWithoutMilestoneInput[];
    createMany?: Prisma.MilestoneCompletionCreateManyMilestoneInputEnvelope;
    set?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    disconnect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    delete?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    connect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    update?: Prisma.MilestoneCompletionUpdateWithWhereUniqueWithoutMilestoneInput | Prisma.MilestoneCompletionUpdateWithWhereUniqueWithoutMilestoneInput[];
    updateMany?: Prisma.MilestoneCompletionUpdateManyWithWhereWithoutMilestoneInput | Prisma.MilestoneCompletionUpdateManyWithWhereWithoutMilestoneInput[];
    deleteMany?: Prisma.MilestoneCompletionScalarWhereInput | Prisma.MilestoneCompletionScalarWhereInput[];
};
export type MilestoneCompletionUncheckedUpdateManyWithoutMilestoneNestedInput = {
    create?: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutMilestoneInput, Prisma.MilestoneCompletionUncheckedCreateWithoutMilestoneInput> | Prisma.MilestoneCompletionCreateWithoutMilestoneInput[] | Prisma.MilestoneCompletionUncheckedCreateWithoutMilestoneInput[];
    connectOrCreate?: Prisma.MilestoneCompletionCreateOrConnectWithoutMilestoneInput | Prisma.MilestoneCompletionCreateOrConnectWithoutMilestoneInput[];
    upsert?: Prisma.MilestoneCompletionUpsertWithWhereUniqueWithoutMilestoneInput | Prisma.MilestoneCompletionUpsertWithWhereUniqueWithoutMilestoneInput[];
    createMany?: Prisma.MilestoneCompletionCreateManyMilestoneInputEnvelope;
    set?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    disconnect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    delete?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    connect?: Prisma.MilestoneCompletionWhereUniqueInput | Prisma.MilestoneCompletionWhereUniqueInput[];
    update?: Prisma.MilestoneCompletionUpdateWithWhereUniqueWithoutMilestoneInput | Prisma.MilestoneCompletionUpdateWithWhereUniqueWithoutMilestoneInput[];
    updateMany?: Prisma.MilestoneCompletionUpdateManyWithWhereWithoutMilestoneInput | Prisma.MilestoneCompletionUpdateManyWithWhereWithoutMilestoneInput[];
    deleteMany?: Prisma.MilestoneCompletionScalarWhereInput | Prisma.MilestoneCompletionScalarWhereInput[];
};
export type MilestoneCompletionCreateWithoutUserInput = {
    id?: string;
    completedAt?: Date | string;
    milestone: Prisma.MilestoneCreateNestedOneWithoutCompletionsInput;
};
export type MilestoneCompletionUncheckedCreateWithoutUserInput = {
    id?: string;
    milestoneId: string;
    completedAt?: Date | string;
};
export type MilestoneCompletionCreateOrConnectWithoutUserInput = {
    where: Prisma.MilestoneCompletionWhereUniqueInput;
    create: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutUserInput, Prisma.MilestoneCompletionUncheckedCreateWithoutUserInput>;
};
export type MilestoneCompletionCreateManyUserInputEnvelope = {
    data: Prisma.MilestoneCompletionCreateManyUserInput | Prisma.MilestoneCompletionCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type MilestoneCompletionUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.MilestoneCompletionWhereUniqueInput;
    update: Prisma.XOR<Prisma.MilestoneCompletionUpdateWithoutUserInput, Prisma.MilestoneCompletionUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutUserInput, Prisma.MilestoneCompletionUncheckedCreateWithoutUserInput>;
};
export type MilestoneCompletionUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.MilestoneCompletionWhereUniqueInput;
    data: Prisma.XOR<Prisma.MilestoneCompletionUpdateWithoutUserInput, Prisma.MilestoneCompletionUncheckedUpdateWithoutUserInput>;
};
export type MilestoneCompletionUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.MilestoneCompletionScalarWhereInput;
    data: Prisma.XOR<Prisma.MilestoneCompletionUpdateManyMutationInput, Prisma.MilestoneCompletionUncheckedUpdateManyWithoutUserInput>;
};
export type MilestoneCompletionScalarWhereInput = {
    AND?: Prisma.MilestoneCompletionScalarWhereInput | Prisma.MilestoneCompletionScalarWhereInput[];
    OR?: Prisma.MilestoneCompletionScalarWhereInput[];
    NOT?: Prisma.MilestoneCompletionScalarWhereInput | Prisma.MilestoneCompletionScalarWhereInput[];
    id?: Prisma.StringFilter<"MilestoneCompletion"> | string;
    milestoneId?: Prisma.StringFilter<"MilestoneCompletion"> | string;
    userId?: Prisma.StringFilter<"MilestoneCompletion"> | string;
    completedAt?: Prisma.DateTimeFilter<"MilestoneCompletion"> | Date | string;
};
export type MilestoneCompletionCreateWithoutMilestoneInput = {
    id?: string;
    completedAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutMilestoneCompletionsInput;
};
export type MilestoneCompletionUncheckedCreateWithoutMilestoneInput = {
    id?: string;
    userId: string;
    completedAt?: Date | string;
};
export type MilestoneCompletionCreateOrConnectWithoutMilestoneInput = {
    where: Prisma.MilestoneCompletionWhereUniqueInput;
    create: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutMilestoneInput, Prisma.MilestoneCompletionUncheckedCreateWithoutMilestoneInput>;
};
export type MilestoneCompletionCreateManyMilestoneInputEnvelope = {
    data: Prisma.MilestoneCompletionCreateManyMilestoneInput | Prisma.MilestoneCompletionCreateManyMilestoneInput[];
    skipDuplicates?: boolean;
};
export type MilestoneCompletionUpsertWithWhereUniqueWithoutMilestoneInput = {
    where: Prisma.MilestoneCompletionWhereUniqueInput;
    update: Prisma.XOR<Prisma.MilestoneCompletionUpdateWithoutMilestoneInput, Prisma.MilestoneCompletionUncheckedUpdateWithoutMilestoneInput>;
    create: Prisma.XOR<Prisma.MilestoneCompletionCreateWithoutMilestoneInput, Prisma.MilestoneCompletionUncheckedCreateWithoutMilestoneInput>;
};
export type MilestoneCompletionUpdateWithWhereUniqueWithoutMilestoneInput = {
    where: Prisma.MilestoneCompletionWhereUniqueInput;
    data: Prisma.XOR<Prisma.MilestoneCompletionUpdateWithoutMilestoneInput, Prisma.MilestoneCompletionUncheckedUpdateWithoutMilestoneInput>;
};
export type MilestoneCompletionUpdateManyWithWhereWithoutMilestoneInput = {
    where: Prisma.MilestoneCompletionScalarWhereInput;
    data: Prisma.XOR<Prisma.MilestoneCompletionUpdateManyMutationInput, Prisma.MilestoneCompletionUncheckedUpdateManyWithoutMilestoneInput>;
};
export type MilestoneCompletionCreateManyUserInput = {
    id?: string;
    milestoneId: string;
    completedAt?: Date | string;
};
export type MilestoneCompletionUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    completedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    milestone?: Prisma.MilestoneUpdateOneRequiredWithoutCompletionsNestedInput;
};
export type MilestoneCompletionUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    milestoneId?: Prisma.StringFieldUpdateOperationsInput | string;
    completedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MilestoneCompletionUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    milestoneId?: Prisma.StringFieldUpdateOperationsInput | string;
    completedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MilestoneCompletionCreateManyMilestoneInput = {
    id?: string;
    userId: string;
    completedAt?: Date | string;
};
export type MilestoneCompletionUpdateWithoutMilestoneInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    completedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutMilestoneCompletionsNestedInput;
};
export type MilestoneCompletionUncheckedUpdateWithoutMilestoneInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    completedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MilestoneCompletionUncheckedUpdateManyWithoutMilestoneInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    completedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MilestoneCompletionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    milestoneId?: boolean;
    userId?: boolean;
    completedAt?: boolean;
    milestone?: boolean | Prisma.MilestoneDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["milestoneCompletion"]>;
export type MilestoneCompletionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    milestoneId?: boolean;
    userId?: boolean;
    completedAt?: boolean;
    milestone?: boolean | Prisma.MilestoneDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["milestoneCompletion"]>;
export type MilestoneCompletionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    milestoneId?: boolean;
    userId?: boolean;
    completedAt?: boolean;
    milestone?: boolean | Prisma.MilestoneDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["milestoneCompletion"]>;
export type MilestoneCompletionSelectScalar = {
    id?: boolean;
    milestoneId?: boolean;
    userId?: boolean;
    completedAt?: boolean;
};
export type MilestoneCompletionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "milestoneId" | "userId" | "completedAt", ExtArgs["result"]["milestoneCompletion"]>;
export type MilestoneCompletionInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    milestone?: boolean | Prisma.MilestoneDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type MilestoneCompletionIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    milestone?: boolean | Prisma.MilestoneDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type MilestoneCompletionIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    milestone?: boolean | Prisma.MilestoneDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $MilestoneCompletionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "MilestoneCompletion";
    objects: {
        milestone: Prisma.$MilestonePayload<ExtArgs>;
        user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        milestoneId: string;
        userId: string;
        completedAt: Date;
    }, ExtArgs["result"]["milestoneCompletion"]>;
    composites: {};
};
export type MilestoneCompletionGetPayload<S extends boolean | null | undefined | MilestoneCompletionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload, S>;
export type MilestoneCompletionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<MilestoneCompletionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: MilestoneCompletionCountAggregateInputType | true;
};
export interface MilestoneCompletionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['MilestoneCompletion'];
        meta: {
            name: 'MilestoneCompletion';
        };
    };
    /**
     * Find zero or one MilestoneCompletion that matches the filter.
     * @param {MilestoneCompletionFindUniqueArgs} args - Arguments to find a MilestoneCompletion
     * @example
     * // Get one MilestoneCompletion
     * const milestoneCompletion = await prisma.milestoneCompletion.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MilestoneCompletionFindUniqueArgs>(args: Prisma.SelectSubset<T, MilestoneCompletionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__MilestoneCompletionClient<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one MilestoneCompletion that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {MilestoneCompletionFindUniqueOrThrowArgs} args - Arguments to find a MilestoneCompletion
     * @example
     * // Get one MilestoneCompletion
     * const milestoneCompletion = await prisma.milestoneCompletion.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MilestoneCompletionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, MilestoneCompletionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__MilestoneCompletionClient<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first MilestoneCompletion that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MilestoneCompletionFindFirstArgs} args - Arguments to find a MilestoneCompletion
     * @example
     * // Get one MilestoneCompletion
     * const milestoneCompletion = await prisma.milestoneCompletion.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MilestoneCompletionFindFirstArgs>(args?: Prisma.SelectSubset<T, MilestoneCompletionFindFirstArgs<ExtArgs>>): Prisma.Prisma__MilestoneCompletionClient<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first MilestoneCompletion that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MilestoneCompletionFindFirstOrThrowArgs} args - Arguments to find a MilestoneCompletion
     * @example
     * // Get one MilestoneCompletion
     * const milestoneCompletion = await prisma.milestoneCompletion.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MilestoneCompletionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, MilestoneCompletionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__MilestoneCompletionClient<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more MilestoneCompletions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MilestoneCompletionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MilestoneCompletions
     * const milestoneCompletions = await prisma.milestoneCompletion.findMany()
     *
     * // Get first 10 MilestoneCompletions
     * const milestoneCompletions = await prisma.milestoneCompletion.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const milestoneCompletionWithIdOnly = await prisma.milestoneCompletion.findMany({ select: { id: true } })
     *
     */
    findMany<T extends MilestoneCompletionFindManyArgs>(args?: Prisma.SelectSubset<T, MilestoneCompletionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a MilestoneCompletion.
     * @param {MilestoneCompletionCreateArgs} args - Arguments to create a MilestoneCompletion.
     * @example
     * // Create one MilestoneCompletion
     * const MilestoneCompletion = await prisma.milestoneCompletion.create({
     *   data: {
     *     // ... data to create a MilestoneCompletion
     *   }
     * })
     *
     */
    create<T extends MilestoneCompletionCreateArgs>(args: Prisma.SelectSubset<T, MilestoneCompletionCreateArgs<ExtArgs>>): Prisma.Prisma__MilestoneCompletionClient<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many MilestoneCompletions.
     * @param {MilestoneCompletionCreateManyArgs} args - Arguments to create many MilestoneCompletions.
     * @example
     * // Create many MilestoneCompletions
     * const milestoneCompletion = await prisma.milestoneCompletion.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends MilestoneCompletionCreateManyArgs>(args?: Prisma.SelectSubset<T, MilestoneCompletionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many MilestoneCompletions and returns the data saved in the database.
     * @param {MilestoneCompletionCreateManyAndReturnArgs} args - Arguments to create many MilestoneCompletions.
     * @example
     * // Create many MilestoneCompletions
     * const milestoneCompletion = await prisma.milestoneCompletion.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many MilestoneCompletions and only return the `id`
     * const milestoneCompletionWithIdOnly = await prisma.milestoneCompletion.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends MilestoneCompletionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, MilestoneCompletionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a MilestoneCompletion.
     * @param {MilestoneCompletionDeleteArgs} args - Arguments to delete one MilestoneCompletion.
     * @example
     * // Delete one MilestoneCompletion
     * const MilestoneCompletion = await prisma.milestoneCompletion.delete({
     *   where: {
     *     // ... filter to delete one MilestoneCompletion
     *   }
     * })
     *
     */
    delete<T extends MilestoneCompletionDeleteArgs>(args: Prisma.SelectSubset<T, MilestoneCompletionDeleteArgs<ExtArgs>>): Prisma.Prisma__MilestoneCompletionClient<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one MilestoneCompletion.
     * @param {MilestoneCompletionUpdateArgs} args - Arguments to update one MilestoneCompletion.
     * @example
     * // Update one MilestoneCompletion
     * const milestoneCompletion = await prisma.milestoneCompletion.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends MilestoneCompletionUpdateArgs>(args: Prisma.SelectSubset<T, MilestoneCompletionUpdateArgs<ExtArgs>>): Prisma.Prisma__MilestoneCompletionClient<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more MilestoneCompletions.
     * @param {MilestoneCompletionDeleteManyArgs} args - Arguments to filter MilestoneCompletions to delete.
     * @example
     * // Delete a few MilestoneCompletions
     * const { count } = await prisma.milestoneCompletion.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends MilestoneCompletionDeleteManyArgs>(args?: Prisma.SelectSubset<T, MilestoneCompletionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more MilestoneCompletions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MilestoneCompletionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MilestoneCompletions
     * const milestoneCompletion = await prisma.milestoneCompletion.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends MilestoneCompletionUpdateManyArgs>(args: Prisma.SelectSubset<T, MilestoneCompletionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more MilestoneCompletions and returns the data updated in the database.
     * @param {MilestoneCompletionUpdateManyAndReturnArgs} args - Arguments to update many MilestoneCompletions.
     * @example
     * // Update many MilestoneCompletions
     * const milestoneCompletion = await prisma.milestoneCompletion.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more MilestoneCompletions and only return the `id`
     * const milestoneCompletionWithIdOnly = await prisma.milestoneCompletion.updateManyAndReturn({
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
    updateManyAndReturn<T extends MilestoneCompletionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, MilestoneCompletionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one MilestoneCompletion.
     * @param {MilestoneCompletionUpsertArgs} args - Arguments to update or create a MilestoneCompletion.
     * @example
     * // Update or create a MilestoneCompletion
     * const milestoneCompletion = await prisma.milestoneCompletion.upsert({
     *   create: {
     *     // ... data to create a MilestoneCompletion
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MilestoneCompletion we want to update
     *   }
     * })
     */
    upsert<T extends MilestoneCompletionUpsertArgs>(args: Prisma.SelectSubset<T, MilestoneCompletionUpsertArgs<ExtArgs>>): Prisma.Prisma__MilestoneCompletionClient<runtime.Types.Result.GetResult<Prisma.$MilestoneCompletionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of MilestoneCompletions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MilestoneCompletionCountArgs} args - Arguments to filter MilestoneCompletions to count.
     * @example
     * // Count the number of MilestoneCompletions
     * const count = await prisma.milestoneCompletion.count({
     *   where: {
     *     // ... the filter for the MilestoneCompletions we want to count
     *   }
     * })
    **/
    count<T extends MilestoneCompletionCountArgs>(args?: Prisma.Subset<T, MilestoneCompletionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], MilestoneCompletionCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a MilestoneCompletion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MilestoneCompletionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends MilestoneCompletionAggregateArgs>(args: Prisma.Subset<T, MilestoneCompletionAggregateArgs>): Prisma.PrismaPromise<GetMilestoneCompletionAggregateType<T>>;
    /**
     * Group by MilestoneCompletion.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MilestoneCompletionGroupByArgs} args - Group by arguments.
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
    groupBy<T extends MilestoneCompletionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: MilestoneCompletionGroupByArgs['orderBy'];
    } : {
        orderBy?: MilestoneCompletionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, MilestoneCompletionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMilestoneCompletionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the MilestoneCompletion model
     */
    readonly fields: MilestoneCompletionFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for MilestoneCompletion.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__MilestoneCompletionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    milestone<T extends Prisma.MilestoneDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.MilestoneDefaultArgs<ExtArgs>>): Prisma.Prisma__MilestoneClient<runtime.Types.Result.GetResult<Prisma.$MilestonePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
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
 * Fields of the MilestoneCompletion model
 */
export interface MilestoneCompletionFieldRefs {
    readonly id: Prisma.FieldRef<"MilestoneCompletion", 'String'>;
    readonly milestoneId: Prisma.FieldRef<"MilestoneCompletion", 'String'>;
    readonly userId: Prisma.FieldRef<"MilestoneCompletion", 'String'>;
    readonly completedAt: Prisma.FieldRef<"MilestoneCompletion", 'DateTime'>;
}
/**
 * MilestoneCompletion findUnique
 */
export type MilestoneCompletionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionInclude<ExtArgs> | null;
    /**
     * Filter, which MilestoneCompletion to fetch.
     */
    where: Prisma.MilestoneCompletionWhereUniqueInput;
};
/**
 * MilestoneCompletion findUniqueOrThrow
 */
export type MilestoneCompletionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionInclude<ExtArgs> | null;
    /**
     * Filter, which MilestoneCompletion to fetch.
     */
    where: Prisma.MilestoneCompletionWhereUniqueInput;
};
/**
 * MilestoneCompletion findFirst
 */
export type MilestoneCompletionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionInclude<ExtArgs> | null;
    /**
     * Filter, which MilestoneCompletion to fetch.
     */
    where?: Prisma.MilestoneCompletionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MilestoneCompletions to fetch.
     */
    orderBy?: Prisma.MilestoneCompletionOrderByWithRelationInput | Prisma.MilestoneCompletionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for MilestoneCompletions.
     */
    cursor?: Prisma.MilestoneCompletionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MilestoneCompletions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MilestoneCompletions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of MilestoneCompletions.
     */
    distinct?: Prisma.MilestoneCompletionScalarFieldEnum | Prisma.MilestoneCompletionScalarFieldEnum[];
};
/**
 * MilestoneCompletion findFirstOrThrow
 */
export type MilestoneCompletionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionInclude<ExtArgs> | null;
    /**
     * Filter, which MilestoneCompletion to fetch.
     */
    where?: Prisma.MilestoneCompletionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MilestoneCompletions to fetch.
     */
    orderBy?: Prisma.MilestoneCompletionOrderByWithRelationInput | Prisma.MilestoneCompletionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for MilestoneCompletions.
     */
    cursor?: Prisma.MilestoneCompletionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MilestoneCompletions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MilestoneCompletions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of MilestoneCompletions.
     */
    distinct?: Prisma.MilestoneCompletionScalarFieldEnum | Prisma.MilestoneCompletionScalarFieldEnum[];
};
/**
 * MilestoneCompletion findMany
 */
export type MilestoneCompletionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionInclude<ExtArgs> | null;
    /**
     * Filter, which MilestoneCompletions to fetch.
     */
    where?: Prisma.MilestoneCompletionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of MilestoneCompletions to fetch.
     */
    orderBy?: Prisma.MilestoneCompletionOrderByWithRelationInput | Prisma.MilestoneCompletionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing MilestoneCompletions.
     */
    cursor?: Prisma.MilestoneCompletionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` MilestoneCompletions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` MilestoneCompletions.
     */
    skip?: number;
    distinct?: Prisma.MilestoneCompletionScalarFieldEnum | Prisma.MilestoneCompletionScalarFieldEnum[];
};
/**
 * MilestoneCompletion create
 */
export type MilestoneCompletionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionInclude<ExtArgs> | null;
    /**
     * The data needed to create a MilestoneCompletion.
     */
    data: Prisma.XOR<Prisma.MilestoneCompletionCreateInput, Prisma.MilestoneCompletionUncheckedCreateInput>;
};
/**
 * MilestoneCompletion createMany
 */
export type MilestoneCompletionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many MilestoneCompletions.
     */
    data: Prisma.MilestoneCompletionCreateManyInput | Prisma.MilestoneCompletionCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * MilestoneCompletion createManyAndReturn
 */
export type MilestoneCompletionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * The data used to create many MilestoneCompletions.
     */
    data: Prisma.MilestoneCompletionCreateManyInput | Prisma.MilestoneCompletionCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * MilestoneCompletion update
 */
export type MilestoneCompletionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionInclude<ExtArgs> | null;
    /**
     * The data needed to update a MilestoneCompletion.
     */
    data: Prisma.XOR<Prisma.MilestoneCompletionUpdateInput, Prisma.MilestoneCompletionUncheckedUpdateInput>;
    /**
     * Choose, which MilestoneCompletion to update.
     */
    where: Prisma.MilestoneCompletionWhereUniqueInput;
};
/**
 * MilestoneCompletion updateMany
 */
export type MilestoneCompletionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update MilestoneCompletions.
     */
    data: Prisma.XOR<Prisma.MilestoneCompletionUpdateManyMutationInput, Prisma.MilestoneCompletionUncheckedUpdateManyInput>;
    /**
     * Filter which MilestoneCompletions to update
     */
    where?: Prisma.MilestoneCompletionWhereInput;
    /**
     * Limit how many MilestoneCompletions to update.
     */
    limit?: number;
};
/**
 * MilestoneCompletion updateManyAndReturn
 */
export type MilestoneCompletionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * The data used to update MilestoneCompletions.
     */
    data: Prisma.XOR<Prisma.MilestoneCompletionUpdateManyMutationInput, Prisma.MilestoneCompletionUncheckedUpdateManyInput>;
    /**
     * Filter which MilestoneCompletions to update
     */
    where?: Prisma.MilestoneCompletionWhereInput;
    /**
     * Limit how many MilestoneCompletions to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * MilestoneCompletion upsert
 */
export type MilestoneCompletionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionInclude<ExtArgs> | null;
    /**
     * The filter to search for the MilestoneCompletion to update in case it exists.
     */
    where: Prisma.MilestoneCompletionWhereUniqueInput;
    /**
     * In case the MilestoneCompletion found by the `where` argument doesn't exist, create a new MilestoneCompletion with this data.
     */
    create: Prisma.XOR<Prisma.MilestoneCompletionCreateInput, Prisma.MilestoneCompletionUncheckedCreateInput>;
    /**
     * In case the MilestoneCompletion was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.MilestoneCompletionUpdateInput, Prisma.MilestoneCompletionUncheckedUpdateInput>;
};
/**
 * MilestoneCompletion delete
 */
export type MilestoneCompletionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionInclude<ExtArgs> | null;
    /**
     * Filter which MilestoneCompletion to delete.
     */
    where: Prisma.MilestoneCompletionWhereUniqueInput;
};
/**
 * MilestoneCompletion deleteMany
 */
export type MilestoneCompletionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which MilestoneCompletions to delete
     */
    where?: Prisma.MilestoneCompletionWhereInput;
    /**
     * Limit how many MilestoneCompletions to delete.
     */
    limit?: number;
};
/**
 * MilestoneCompletion without action
 */
export type MilestoneCompletionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MilestoneCompletion
     */
    select?: Prisma.MilestoneCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the MilestoneCompletion
     */
    omit?: Prisma.MilestoneCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.MilestoneCompletionInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=MilestoneCompletion.d.ts.map