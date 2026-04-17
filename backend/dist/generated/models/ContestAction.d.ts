import type * as runtime from "@prisma/client/runtime/client";
import type * as $Enums from "../enums";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model ContestAction
 *
 */
export type ContestActionModel = runtime.Types.Result.DefaultSelection<Prisma.$ContestActionPayload>;
export type AggregateContestAction = {
    _count: ContestActionCountAggregateOutputType | null;
    _avg: ContestActionAvgAggregateOutputType | null;
    _sum: ContestActionSumAggregateOutputType | null;
    _min: ContestActionMinAggregateOutputType | null;
    _max: ContestActionMaxAggregateOutputType | null;
};
export type ContestActionAvgAggregateOutputType = {
    sortOrder: number | null;
};
export type ContestActionSumAggregateOutputType = {
    sortOrder: number | null;
};
export type ContestActionMinAggregateOutputType = {
    id: string | null;
    contestId: string | null;
    actionType: $Enums.RequirementType | null;
    targetUrl: string | null;
    label: string | null;
    isVerifiable: boolean | null;
    requiresUpload: boolean | null;
    sortOrder: number | null;
};
export type ContestActionMaxAggregateOutputType = {
    id: string | null;
    contestId: string | null;
    actionType: $Enums.RequirementType | null;
    targetUrl: string | null;
    label: string | null;
    isVerifiable: boolean | null;
    requiresUpload: boolean | null;
    sortOrder: number | null;
};
export type ContestActionCountAggregateOutputType = {
    id: number;
    contestId: number;
    actionType: number;
    targetUrl: number;
    label: number;
    isVerifiable: number;
    requiresUpload: number;
    sortOrder: number;
    _all: number;
};
export type ContestActionAvgAggregateInputType = {
    sortOrder?: true;
};
export type ContestActionSumAggregateInputType = {
    sortOrder?: true;
};
export type ContestActionMinAggregateInputType = {
    id?: true;
    contestId?: true;
    actionType?: true;
    targetUrl?: true;
    label?: true;
    isVerifiable?: true;
    requiresUpload?: true;
    sortOrder?: true;
};
export type ContestActionMaxAggregateInputType = {
    id?: true;
    contestId?: true;
    actionType?: true;
    targetUrl?: true;
    label?: true;
    isVerifiable?: true;
    requiresUpload?: true;
    sortOrder?: true;
};
export type ContestActionCountAggregateInputType = {
    id?: true;
    contestId?: true;
    actionType?: true;
    targetUrl?: true;
    label?: true;
    isVerifiable?: true;
    requiresUpload?: true;
    sortOrder?: true;
    _all?: true;
};
export type ContestActionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which ContestAction to aggregate.
     */
    where?: Prisma.ContestActionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestActions to fetch.
     */
    orderBy?: Prisma.ContestActionOrderByWithRelationInput | Prisma.ContestActionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.ContestActionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestActions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestActions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ContestActions
    **/
    _count?: true | ContestActionCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: ContestActionAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: ContestActionSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: ContestActionMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: ContestActionMaxAggregateInputType;
};
export type GetContestActionAggregateType<T extends ContestActionAggregateArgs> = {
    [P in keyof T & keyof AggregateContestAction]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateContestAction[P]> : Prisma.GetScalarType<T[P], AggregateContestAction[P]>;
};
export type ContestActionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ContestActionWhereInput;
    orderBy?: Prisma.ContestActionOrderByWithAggregationInput | Prisma.ContestActionOrderByWithAggregationInput[];
    by: Prisma.ContestActionScalarFieldEnum[] | Prisma.ContestActionScalarFieldEnum;
    having?: Prisma.ContestActionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ContestActionCountAggregateInputType | true;
    _avg?: ContestActionAvgAggregateInputType;
    _sum?: ContestActionSumAggregateInputType;
    _min?: ContestActionMinAggregateInputType;
    _max?: ContestActionMaxAggregateInputType;
};
export type ContestActionGroupByOutputType = {
    id: string;
    contestId: string;
    actionType: $Enums.RequirementType;
    targetUrl: string | null;
    label: string;
    isVerifiable: boolean;
    requiresUpload: boolean;
    sortOrder: number;
    _count: ContestActionCountAggregateOutputType | null;
    _avg: ContestActionAvgAggregateOutputType | null;
    _sum: ContestActionSumAggregateOutputType | null;
    _min: ContestActionMinAggregateOutputType | null;
    _max: ContestActionMaxAggregateOutputType | null;
};
type GetContestActionGroupByPayload<T extends ContestActionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ContestActionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ContestActionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ContestActionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ContestActionGroupByOutputType[P]>;
}>>;
export type ContestActionWhereInput = {
    AND?: Prisma.ContestActionWhereInput | Prisma.ContestActionWhereInput[];
    OR?: Prisma.ContestActionWhereInput[];
    NOT?: Prisma.ContestActionWhereInput | Prisma.ContestActionWhereInput[];
    id?: Prisma.StringFilter<"ContestAction"> | string;
    contestId?: Prisma.StringFilter<"ContestAction"> | string;
    actionType?: Prisma.EnumRequirementTypeFilter<"ContestAction"> | $Enums.RequirementType;
    targetUrl?: Prisma.StringNullableFilter<"ContestAction"> | string | null;
    label?: Prisma.StringFilter<"ContestAction"> | string;
    isVerifiable?: Prisma.BoolFilter<"ContestAction"> | boolean;
    requiresUpload?: Prisma.BoolFilter<"ContestAction"> | boolean;
    sortOrder?: Prisma.IntFilter<"ContestAction"> | number;
    contest?: Prisma.XOR<Prisma.ContestScalarRelationFilter, Prisma.ContestWhereInput>;
    completions?: Prisma.ContestActionCompletionListRelationFilter;
};
export type ContestActionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    actionType?: Prisma.SortOrder;
    targetUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    label?: Prisma.SortOrder;
    isVerifiable?: Prisma.SortOrder;
    requiresUpload?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    contest?: Prisma.ContestOrderByWithRelationInput;
    completions?: Prisma.ContestActionCompletionOrderByRelationAggregateInput;
};
export type ContestActionWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.ContestActionWhereInput | Prisma.ContestActionWhereInput[];
    OR?: Prisma.ContestActionWhereInput[];
    NOT?: Prisma.ContestActionWhereInput | Prisma.ContestActionWhereInput[];
    contestId?: Prisma.StringFilter<"ContestAction"> | string;
    actionType?: Prisma.EnumRequirementTypeFilter<"ContestAction"> | $Enums.RequirementType;
    targetUrl?: Prisma.StringNullableFilter<"ContestAction"> | string | null;
    label?: Prisma.StringFilter<"ContestAction"> | string;
    isVerifiable?: Prisma.BoolFilter<"ContestAction"> | boolean;
    requiresUpload?: Prisma.BoolFilter<"ContestAction"> | boolean;
    sortOrder?: Prisma.IntFilter<"ContestAction"> | number;
    contest?: Prisma.XOR<Prisma.ContestScalarRelationFilter, Prisma.ContestWhereInput>;
    completions?: Prisma.ContestActionCompletionListRelationFilter;
}, "id">;
export type ContestActionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    actionType?: Prisma.SortOrder;
    targetUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    label?: Prisma.SortOrder;
    isVerifiable?: Prisma.SortOrder;
    requiresUpload?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    _count?: Prisma.ContestActionCountOrderByAggregateInput;
    _avg?: Prisma.ContestActionAvgOrderByAggregateInput;
    _max?: Prisma.ContestActionMaxOrderByAggregateInput;
    _min?: Prisma.ContestActionMinOrderByAggregateInput;
    _sum?: Prisma.ContestActionSumOrderByAggregateInput;
};
export type ContestActionScalarWhereWithAggregatesInput = {
    AND?: Prisma.ContestActionScalarWhereWithAggregatesInput | Prisma.ContestActionScalarWhereWithAggregatesInput[];
    OR?: Prisma.ContestActionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ContestActionScalarWhereWithAggregatesInput | Prisma.ContestActionScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"ContestAction"> | string;
    contestId?: Prisma.StringWithAggregatesFilter<"ContestAction"> | string;
    actionType?: Prisma.EnumRequirementTypeWithAggregatesFilter<"ContestAction"> | $Enums.RequirementType;
    targetUrl?: Prisma.StringNullableWithAggregatesFilter<"ContestAction"> | string | null;
    label?: Prisma.StringWithAggregatesFilter<"ContestAction"> | string;
    isVerifiable?: Prisma.BoolWithAggregatesFilter<"ContestAction"> | boolean;
    requiresUpload?: Prisma.BoolWithAggregatesFilter<"ContestAction"> | boolean;
    sortOrder?: Prisma.IntWithAggregatesFilter<"ContestAction"> | number;
};
export type ContestActionCreateInput = {
    id?: string;
    actionType: $Enums.RequirementType;
    targetUrl?: string | null;
    label: string;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: number;
    contest: Prisma.ContestCreateNestedOneWithoutActionsInput;
    completions?: Prisma.ContestActionCompletionCreateNestedManyWithoutActionInput;
};
export type ContestActionUncheckedCreateInput = {
    id?: string;
    contestId: string;
    actionType: $Enums.RequirementType;
    targetUrl?: string | null;
    label: string;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: number;
    completions?: Prisma.ContestActionCompletionUncheckedCreateNestedManyWithoutActionInput;
};
export type ContestActionUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    actionType?: Prisma.EnumRequirementTypeFieldUpdateOperationsInput | $Enums.RequirementType;
    targetUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    isVerifiable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    requiresUpload?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    contest?: Prisma.ContestUpdateOneRequiredWithoutActionsNestedInput;
    completions?: Prisma.ContestActionCompletionUpdateManyWithoutActionNestedInput;
};
export type ContestActionUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    actionType?: Prisma.EnumRequirementTypeFieldUpdateOperationsInput | $Enums.RequirementType;
    targetUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    isVerifiable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    requiresUpload?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    completions?: Prisma.ContestActionCompletionUncheckedUpdateManyWithoutActionNestedInput;
};
export type ContestActionCreateManyInput = {
    id?: string;
    contestId: string;
    actionType: $Enums.RequirementType;
    targetUrl?: string | null;
    label: string;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: number;
};
export type ContestActionUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    actionType?: Prisma.EnumRequirementTypeFieldUpdateOperationsInput | $Enums.RequirementType;
    targetUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    isVerifiable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    requiresUpload?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type ContestActionUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    actionType?: Prisma.EnumRequirementTypeFieldUpdateOperationsInput | $Enums.RequirementType;
    targetUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    isVerifiable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    requiresUpload?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type ContestActionListRelationFilter = {
    every?: Prisma.ContestActionWhereInput;
    some?: Prisma.ContestActionWhereInput;
    none?: Prisma.ContestActionWhereInput;
};
export type ContestActionOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type ContestActionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    actionType?: Prisma.SortOrder;
    targetUrl?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    isVerifiable?: Prisma.SortOrder;
    requiresUpload?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
};
export type ContestActionAvgOrderByAggregateInput = {
    sortOrder?: Prisma.SortOrder;
};
export type ContestActionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    actionType?: Prisma.SortOrder;
    targetUrl?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    isVerifiable?: Prisma.SortOrder;
    requiresUpload?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
};
export type ContestActionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    contestId?: Prisma.SortOrder;
    actionType?: Prisma.SortOrder;
    targetUrl?: Prisma.SortOrder;
    label?: Prisma.SortOrder;
    isVerifiable?: Prisma.SortOrder;
    requiresUpload?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
};
export type ContestActionSumOrderByAggregateInput = {
    sortOrder?: Prisma.SortOrder;
};
export type ContestActionScalarRelationFilter = {
    is?: Prisma.ContestActionWhereInput;
    isNot?: Prisma.ContestActionWhereInput;
};
export type ContestActionCreateNestedManyWithoutContestInput = {
    create?: Prisma.XOR<Prisma.ContestActionCreateWithoutContestInput, Prisma.ContestActionUncheckedCreateWithoutContestInput> | Prisma.ContestActionCreateWithoutContestInput[] | Prisma.ContestActionUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestActionCreateOrConnectWithoutContestInput | Prisma.ContestActionCreateOrConnectWithoutContestInput[];
    createMany?: Prisma.ContestActionCreateManyContestInputEnvelope;
    connect?: Prisma.ContestActionWhereUniqueInput | Prisma.ContestActionWhereUniqueInput[];
};
export type ContestActionUncheckedCreateNestedManyWithoutContestInput = {
    create?: Prisma.XOR<Prisma.ContestActionCreateWithoutContestInput, Prisma.ContestActionUncheckedCreateWithoutContestInput> | Prisma.ContestActionCreateWithoutContestInput[] | Prisma.ContestActionUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestActionCreateOrConnectWithoutContestInput | Prisma.ContestActionCreateOrConnectWithoutContestInput[];
    createMany?: Prisma.ContestActionCreateManyContestInputEnvelope;
    connect?: Prisma.ContestActionWhereUniqueInput | Prisma.ContestActionWhereUniqueInput[];
};
export type ContestActionUpdateManyWithoutContestNestedInput = {
    create?: Prisma.XOR<Prisma.ContestActionCreateWithoutContestInput, Prisma.ContestActionUncheckedCreateWithoutContestInput> | Prisma.ContestActionCreateWithoutContestInput[] | Prisma.ContestActionUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestActionCreateOrConnectWithoutContestInput | Prisma.ContestActionCreateOrConnectWithoutContestInput[];
    upsert?: Prisma.ContestActionUpsertWithWhereUniqueWithoutContestInput | Prisma.ContestActionUpsertWithWhereUniqueWithoutContestInput[];
    createMany?: Prisma.ContestActionCreateManyContestInputEnvelope;
    set?: Prisma.ContestActionWhereUniqueInput | Prisma.ContestActionWhereUniqueInput[];
    disconnect?: Prisma.ContestActionWhereUniqueInput | Prisma.ContestActionWhereUniqueInput[];
    delete?: Prisma.ContestActionWhereUniqueInput | Prisma.ContestActionWhereUniqueInput[];
    connect?: Prisma.ContestActionWhereUniqueInput | Prisma.ContestActionWhereUniqueInput[];
    update?: Prisma.ContestActionUpdateWithWhereUniqueWithoutContestInput | Prisma.ContestActionUpdateWithWhereUniqueWithoutContestInput[];
    updateMany?: Prisma.ContestActionUpdateManyWithWhereWithoutContestInput | Prisma.ContestActionUpdateManyWithWhereWithoutContestInput[];
    deleteMany?: Prisma.ContestActionScalarWhereInput | Prisma.ContestActionScalarWhereInput[];
};
export type ContestActionUncheckedUpdateManyWithoutContestNestedInput = {
    create?: Prisma.XOR<Prisma.ContestActionCreateWithoutContestInput, Prisma.ContestActionUncheckedCreateWithoutContestInput> | Prisma.ContestActionCreateWithoutContestInput[] | Prisma.ContestActionUncheckedCreateWithoutContestInput[];
    connectOrCreate?: Prisma.ContestActionCreateOrConnectWithoutContestInput | Prisma.ContestActionCreateOrConnectWithoutContestInput[];
    upsert?: Prisma.ContestActionUpsertWithWhereUniqueWithoutContestInput | Prisma.ContestActionUpsertWithWhereUniqueWithoutContestInput[];
    createMany?: Prisma.ContestActionCreateManyContestInputEnvelope;
    set?: Prisma.ContestActionWhereUniqueInput | Prisma.ContestActionWhereUniqueInput[];
    disconnect?: Prisma.ContestActionWhereUniqueInput | Prisma.ContestActionWhereUniqueInput[];
    delete?: Prisma.ContestActionWhereUniqueInput | Prisma.ContestActionWhereUniqueInput[];
    connect?: Prisma.ContestActionWhereUniqueInput | Prisma.ContestActionWhereUniqueInput[];
    update?: Prisma.ContestActionUpdateWithWhereUniqueWithoutContestInput | Prisma.ContestActionUpdateWithWhereUniqueWithoutContestInput[];
    updateMany?: Prisma.ContestActionUpdateManyWithWhereWithoutContestInput | Prisma.ContestActionUpdateManyWithWhereWithoutContestInput[];
    deleteMany?: Prisma.ContestActionScalarWhereInput | Prisma.ContestActionScalarWhereInput[];
};
export type EnumRequirementTypeFieldUpdateOperationsInput = {
    set?: $Enums.RequirementType;
};
export type ContestActionCreateNestedOneWithoutCompletionsInput = {
    create?: Prisma.XOR<Prisma.ContestActionCreateWithoutCompletionsInput, Prisma.ContestActionUncheckedCreateWithoutCompletionsInput>;
    connectOrCreate?: Prisma.ContestActionCreateOrConnectWithoutCompletionsInput;
    connect?: Prisma.ContestActionWhereUniqueInput;
};
export type ContestActionUpdateOneRequiredWithoutCompletionsNestedInput = {
    create?: Prisma.XOR<Prisma.ContestActionCreateWithoutCompletionsInput, Prisma.ContestActionUncheckedCreateWithoutCompletionsInput>;
    connectOrCreate?: Prisma.ContestActionCreateOrConnectWithoutCompletionsInput;
    upsert?: Prisma.ContestActionUpsertWithoutCompletionsInput;
    connect?: Prisma.ContestActionWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.ContestActionUpdateToOneWithWhereWithoutCompletionsInput, Prisma.ContestActionUpdateWithoutCompletionsInput>, Prisma.ContestActionUncheckedUpdateWithoutCompletionsInput>;
};
export type ContestActionCreateWithoutContestInput = {
    id?: string;
    actionType: $Enums.RequirementType;
    targetUrl?: string | null;
    label: string;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: number;
    completions?: Prisma.ContestActionCompletionCreateNestedManyWithoutActionInput;
};
export type ContestActionUncheckedCreateWithoutContestInput = {
    id?: string;
    actionType: $Enums.RequirementType;
    targetUrl?: string | null;
    label: string;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: number;
    completions?: Prisma.ContestActionCompletionUncheckedCreateNestedManyWithoutActionInput;
};
export type ContestActionCreateOrConnectWithoutContestInput = {
    where: Prisma.ContestActionWhereUniqueInput;
    create: Prisma.XOR<Prisma.ContestActionCreateWithoutContestInput, Prisma.ContestActionUncheckedCreateWithoutContestInput>;
};
export type ContestActionCreateManyContestInputEnvelope = {
    data: Prisma.ContestActionCreateManyContestInput | Prisma.ContestActionCreateManyContestInput[];
    skipDuplicates?: boolean;
};
export type ContestActionUpsertWithWhereUniqueWithoutContestInput = {
    where: Prisma.ContestActionWhereUniqueInput;
    update: Prisma.XOR<Prisma.ContestActionUpdateWithoutContestInput, Prisma.ContestActionUncheckedUpdateWithoutContestInput>;
    create: Prisma.XOR<Prisma.ContestActionCreateWithoutContestInput, Prisma.ContestActionUncheckedCreateWithoutContestInput>;
};
export type ContestActionUpdateWithWhereUniqueWithoutContestInput = {
    where: Prisma.ContestActionWhereUniqueInput;
    data: Prisma.XOR<Prisma.ContestActionUpdateWithoutContestInput, Prisma.ContestActionUncheckedUpdateWithoutContestInput>;
};
export type ContestActionUpdateManyWithWhereWithoutContestInput = {
    where: Prisma.ContestActionScalarWhereInput;
    data: Prisma.XOR<Prisma.ContestActionUpdateManyMutationInput, Prisma.ContestActionUncheckedUpdateManyWithoutContestInput>;
};
export type ContestActionScalarWhereInput = {
    AND?: Prisma.ContestActionScalarWhereInput | Prisma.ContestActionScalarWhereInput[];
    OR?: Prisma.ContestActionScalarWhereInput[];
    NOT?: Prisma.ContestActionScalarWhereInput | Prisma.ContestActionScalarWhereInput[];
    id?: Prisma.StringFilter<"ContestAction"> | string;
    contestId?: Prisma.StringFilter<"ContestAction"> | string;
    actionType?: Prisma.EnumRequirementTypeFilter<"ContestAction"> | $Enums.RequirementType;
    targetUrl?: Prisma.StringNullableFilter<"ContestAction"> | string | null;
    label?: Prisma.StringFilter<"ContestAction"> | string;
    isVerifiable?: Prisma.BoolFilter<"ContestAction"> | boolean;
    requiresUpload?: Prisma.BoolFilter<"ContestAction"> | boolean;
    sortOrder?: Prisma.IntFilter<"ContestAction"> | number;
};
export type ContestActionCreateWithoutCompletionsInput = {
    id?: string;
    actionType: $Enums.RequirementType;
    targetUrl?: string | null;
    label: string;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: number;
    contest: Prisma.ContestCreateNestedOneWithoutActionsInput;
};
export type ContestActionUncheckedCreateWithoutCompletionsInput = {
    id?: string;
    contestId: string;
    actionType: $Enums.RequirementType;
    targetUrl?: string | null;
    label: string;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: number;
};
export type ContestActionCreateOrConnectWithoutCompletionsInput = {
    where: Prisma.ContestActionWhereUniqueInput;
    create: Prisma.XOR<Prisma.ContestActionCreateWithoutCompletionsInput, Prisma.ContestActionUncheckedCreateWithoutCompletionsInput>;
};
export type ContestActionUpsertWithoutCompletionsInput = {
    update: Prisma.XOR<Prisma.ContestActionUpdateWithoutCompletionsInput, Prisma.ContestActionUncheckedUpdateWithoutCompletionsInput>;
    create: Prisma.XOR<Prisma.ContestActionCreateWithoutCompletionsInput, Prisma.ContestActionUncheckedCreateWithoutCompletionsInput>;
    where?: Prisma.ContestActionWhereInput;
};
export type ContestActionUpdateToOneWithWhereWithoutCompletionsInput = {
    where?: Prisma.ContestActionWhereInput;
    data: Prisma.XOR<Prisma.ContestActionUpdateWithoutCompletionsInput, Prisma.ContestActionUncheckedUpdateWithoutCompletionsInput>;
};
export type ContestActionUpdateWithoutCompletionsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    actionType?: Prisma.EnumRequirementTypeFieldUpdateOperationsInput | $Enums.RequirementType;
    targetUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    isVerifiable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    requiresUpload?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    contest?: Prisma.ContestUpdateOneRequiredWithoutActionsNestedInput;
};
export type ContestActionUncheckedUpdateWithoutCompletionsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    contestId?: Prisma.StringFieldUpdateOperationsInput | string;
    actionType?: Prisma.EnumRequirementTypeFieldUpdateOperationsInput | $Enums.RequirementType;
    targetUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    isVerifiable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    requiresUpload?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
};
export type ContestActionCreateManyContestInput = {
    id?: string;
    actionType: $Enums.RequirementType;
    targetUrl?: string | null;
    label: string;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: number;
};
export type ContestActionUpdateWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    actionType?: Prisma.EnumRequirementTypeFieldUpdateOperationsInput | $Enums.RequirementType;
    targetUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    isVerifiable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    requiresUpload?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    completions?: Prisma.ContestActionCompletionUpdateManyWithoutActionNestedInput;
};
export type ContestActionUncheckedUpdateWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    actionType?: Prisma.EnumRequirementTypeFieldUpdateOperationsInput | $Enums.RequirementType;
    targetUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    isVerifiable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    requiresUpload?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    completions?: Prisma.ContestActionCompletionUncheckedUpdateManyWithoutActionNestedInput;
};
export type ContestActionUncheckedUpdateManyWithoutContestInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    actionType?: Prisma.EnumRequirementTypeFieldUpdateOperationsInput | $Enums.RequirementType;
    targetUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    label?: Prisma.StringFieldUpdateOperationsInput | string;
    isVerifiable?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    requiresUpload?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
};
/**
 * Count Type ContestActionCountOutputType
 */
export type ContestActionCountOutputType = {
    completions: number;
};
export type ContestActionCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    completions?: boolean | ContestActionCountOutputTypeCountCompletionsArgs;
};
/**
 * ContestActionCountOutputType without action
 */
export type ContestActionCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestActionCountOutputType
     */
    select?: Prisma.ContestActionCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * ContestActionCountOutputType without action
 */
export type ContestActionCountOutputTypeCountCompletionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ContestActionCompletionWhereInput;
};
export type ContestActionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    actionType?: boolean;
    targetUrl?: boolean;
    label?: boolean;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    completions?: boolean | Prisma.ContestAction$completionsArgs<ExtArgs>;
    _count?: boolean | Prisma.ContestActionCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestAction"]>;
export type ContestActionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    actionType?: boolean;
    targetUrl?: boolean;
    label?: boolean;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestAction"]>;
export type ContestActionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    contestId?: boolean;
    actionType?: boolean;
    targetUrl?: boolean;
    label?: boolean;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: boolean;
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["contestAction"]>;
export type ContestActionSelectScalar = {
    id?: boolean;
    contestId?: boolean;
    actionType?: boolean;
    targetUrl?: boolean;
    label?: boolean;
    isVerifiable?: boolean;
    requiresUpload?: boolean;
    sortOrder?: boolean;
};
export type ContestActionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "contestId" | "actionType" | "targetUrl" | "label" | "isVerifiable" | "requiresUpload" | "sortOrder", ExtArgs["result"]["contestAction"]>;
export type ContestActionInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
    completions?: boolean | Prisma.ContestAction$completionsArgs<ExtArgs>;
    _count?: boolean | Prisma.ContestActionCountOutputTypeDefaultArgs<ExtArgs>;
};
export type ContestActionIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
};
export type ContestActionIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    contest?: boolean | Prisma.ContestDefaultArgs<ExtArgs>;
};
export type $ContestActionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ContestAction";
    objects: {
        contest: Prisma.$ContestPayload<ExtArgs>;
        completions: Prisma.$ContestActionCompletionPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        contestId: string;
        actionType: $Enums.RequirementType;
        targetUrl: string | null;
        label: string;
        isVerifiable: boolean;
        requiresUpload: boolean;
        sortOrder: number;
    }, ExtArgs["result"]["contestAction"]>;
    composites: {};
};
export type ContestActionGetPayload<S extends boolean | null | undefined | ContestActionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ContestActionPayload, S>;
export type ContestActionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ContestActionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ContestActionCountAggregateInputType | true;
};
export interface ContestActionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['ContestAction'];
        meta: {
            name: 'ContestAction';
        };
    };
    /**
     * Find zero or one ContestAction that matches the filter.
     * @param {ContestActionFindUniqueArgs} args - Arguments to find a ContestAction
     * @example
     * // Get one ContestAction
     * const contestAction = await prisma.contestAction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ContestActionFindUniqueArgs>(args: Prisma.SelectSubset<T, ContestActionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ContestActionClient<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one ContestAction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ContestActionFindUniqueOrThrowArgs} args - Arguments to find a ContestAction
     * @example
     * // Get one ContestAction
     * const contestAction = await prisma.contestAction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ContestActionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ContestActionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ContestActionClient<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first ContestAction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestActionFindFirstArgs} args - Arguments to find a ContestAction
     * @example
     * // Get one ContestAction
     * const contestAction = await prisma.contestAction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ContestActionFindFirstArgs>(args?: Prisma.SelectSubset<T, ContestActionFindFirstArgs<ExtArgs>>): Prisma.Prisma__ContestActionClient<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first ContestAction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestActionFindFirstOrThrowArgs} args - Arguments to find a ContestAction
     * @example
     * // Get one ContestAction
     * const contestAction = await prisma.contestAction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ContestActionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ContestActionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ContestActionClient<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more ContestActions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestActionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ContestActions
     * const contestActions = await prisma.contestAction.findMany()
     *
     * // Get first 10 ContestActions
     * const contestActions = await prisma.contestAction.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const contestActionWithIdOnly = await prisma.contestAction.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ContestActionFindManyArgs>(args?: Prisma.SelectSubset<T, ContestActionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a ContestAction.
     * @param {ContestActionCreateArgs} args - Arguments to create a ContestAction.
     * @example
     * // Create one ContestAction
     * const ContestAction = await prisma.contestAction.create({
     *   data: {
     *     // ... data to create a ContestAction
     *   }
     * })
     *
     */
    create<T extends ContestActionCreateArgs>(args: Prisma.SelectSubset<T, ContestActionCreateArgs<ExtArgs>>): Prisma.Prisma__ContestActionClient<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many ContestActions.
     * @param {ContestActionCreateManyArgs} args - Arguments to create many ContestActions.
     * @example
     * // Create many ContestActions
     * const contestAction = await prisma.contestAction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ContestActionCreateManyArgs>(args?: Prisma.SelectSubset<T, ContestActionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many ContestActions and returns the data saved in the database.
     * @param {ContestActionCreateManyAndReturnArgs} args - Arguments to create many ContestActions.
     * @example
     * // Create many ContestActions
     * const contestAction = await prisma.contestAction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ContestActions and only return the `id`
     * const contestActionWithIdOnly = await prisma.contestAction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ContestActionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ContestActionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a ContestAction.
     * @param {ContestActionDeleteArgs} args - Arguments to delete one ContestAction.
     * @example
     * // Delete one ContestAction
     * const ContestAction = await prisma.contestAction.delete({
     *   where: {
     *     // ... filter to delete one ContestAction
     *   }
     * })
     *
     */
    delete<T extends ContestActionDeleteArgs>(args: Prisma.SelectSubset<T, ContestActionDeleteArgs<ExtArgs>>): Prisma.Prisma__ContestActionClient<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one ContestAction.
     * @param {ContestActionUpdateArgs} args - Arguments to update one ContestAction.
     * @example
     * // Update one ContestAction
     * const contestAction = await prisma.contestAction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ContestActionUpdateArgs>(args: Prisma.SelectSubset<T, ContestActionUpdateArgs<ExtArgs>>): Prisma.Prisma__ContestActionClient<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more ContestActions.
     * @param {ContestActionDeleteManyArgs} args - Arguments to filter ContestActions to delete.
     * @example
     * // Delete a few ContestActions
     * const { count } = await prisma.contestAction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ContestActionDeleteManyArgs>(args?: Prisma.SelectSubset<T, ContestActionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more ContestActions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestActionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ContestActions
     * const contestAction = await prisma.contestAction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ContestActionUpdateManyArgs>(args: Prisma.SelectSubset<T, ContestActionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more ContestActions and returns the data updated in the database.
     * @param {ContestActionUpdateManyAndReturnArgs} args - Arguments to update many ContestActions.
     * @example
     * // Update many ContestActions
     * const contestAction = await prisma.contestAction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ContestActions and only return the `id`
     * const contestActionWithIdOnly = await prisma.contestAction.updateManyAndReturn({
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
    updateManyAndReturn<T extends ContestActionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ContestActionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one ContestAction.
     * @param {ContestActionUpsertArgs} args - Arguments to update or create a ContestAction.
     * @example
     * // Update or create a ContestAction
     * const contestAction = await prisma.contestAction.upsert({
     *   create: {
     *     // ... data to create a ContestAction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ContestAction we want to update
     *   }
     * })
     */
    upsert<T extends ContestActionUpsertArgs>(args: Prisma.SelectSubset<T, ContestActionUpsertArgs<ExtArgs>>): Prisma.Prisma__ContestActionClient<runtime.Types.Result.GetResult<Prisma.$ContestActionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of ContestActions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestActionCountArgs} args - Arguments to filter ContestActions to count.
     * @example
     * // Count the number of ContestActions
     * const count = await prisma.contestAction.count({
     *   where: {
     *     // ... the filter for the ContestActions we want to count
     *   }
     * })
    **/
    count<T extends ContestActionCountArgs>(args?: Prisma.Subset<T, ContestActionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ContestActionCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a ContestAction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestActionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ContestActionAggregateArgs>(args: Prisma.Subset<T, ContestActionAggregateArgs>): Prisma.PrismaPromise<GetContestActionAggregateType<T>>;
    /**
     * Group by ContestAction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ContestActionGroupByArgs} args - Group by arguments.
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
    groupBy<T extends ContestActionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ContestActionGroupByArgs['orderBy'];
    } : {
        orderBy?: ContestActionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ContestActionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetContestActionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the ContestAction model
     */
    readonly fields: ContestActionFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for ContestAction.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__ContestActionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    contest<T extends Prisma.ContestDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ContestDefaultArgs<ExtArgs>>): Prisma.Prisma__ContestClient<runtime.Types.Result.GetResult<Prisma.$ContestPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    completions<T extends Prisma.ContestAction$completionsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ContestAction$completionsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ContestActionCompletionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
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
 * Fields of the ContestAction model
 */
export interface ContestActionFieldRefs {
    readonly id: Prisma.FieldRef<"ContestAction", 'String'>;
    readonly contestId: Prisma.FieldRef<"ContestAction", 'String'>;
    readonly actionType: Prisma.FieldRef<"ContestAction", 'RequirementType'>;
    readonly targetUrl: Prisma.FieldRef<"ContestAction", 'String'>;
    readonly label: Prisma.FieldRef<"ContestAction", 'String'>;
    readonly isVerifiable: Prisma.FieldRef<"ContestAction", 'Boolean'>;
    readonly requiresUpload: Prisma.FieldRef<"ContestAction", 'Boolean'>;
    readonly sortOrder: Prisma.FieldRef<"ContestAction", 'Int'>;
}
/**
 * ContestAction findUnique
 */
export type ContestActionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionInclude<ExtArgs> | null;
    /**
     * Filter, which ContestAction to fetch.
     */
    where: Prisma.ContestActionWhereUniqueInput;
};
/**
 * ContestAction findUniqueOrThrow
 */
export type ContestActionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionInclude<ExtArgs> | null;
    /**
     * Filter, which ContestAction to fetch.
     */
    where: Prisma.ContestActionWhereUniqueInput;
};
/**
 * ContestAction findFirst
 */
export type ContestActionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionInclude<ExtArgs> | null;
    /**
     * Filter, which ContestAction to fetch.
     */
    where?: Prisma.ContestActionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestActions to fetch.
     */
    orderBy?: Prisma.ContestActionOrderByWithRelationInput | Prisma.ContestActionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ContestActions.
     */
    cursor?: Prisma.ContestActionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestActions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestActions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ContestActions.
     */
    distinct?: Prisma.ContestActionScalarFieldEnum | Prisma.ContestActionScalarFieldEnum[];
};
/**
 * ContestAction findFirstOrThrow
 */
export type ContestActionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionInclude<ExtArgs> | null;
    /**
     * Filter, which ContestAction to fetch.
     */
    where?: Prisma.ContestActionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestActions to fetch.
     */
    orderBy?: Prisma.ContestActionOrderByWithRelationInput | Prisma.ContestActionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ContestActions.
     */
    cursor?: Prisma.ContestActionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestActions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestActions.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ContestActions.
     */
    distinct?: Prisma.ContestActionScalarFieldEnum | Prisma.ContestActionScalarFieldEnum[];
};
/**
 * ContestAction findMany
 */
export type ContestActionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionInclude<ExtArgs> | null;
    /**
     * Filter, which ContestActions to fetch.
     */
    where?: Prisma.ContestActionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ContestActions to fetch.
     */
    orderBy?: Prisma.ContestActionOrderByWithRelationInput | Prisma.ContestActionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ContestActions.
     */
    cursor?: Prisma.ContestActionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ContestActions from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ContestActions.
     */
    skip?: number;
    distinct?: Prisma.ContestActionScalarFieldEnum | Prisma.ContestActionScalarFieldEnum[];
};
/**
 * ContestAction create
 */
export type ContestActionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionInclude<ExtArgs> | null;
    /**
     * The data needed to create a ContestAction.
     */
    data: Prisma.XOR<Prisma.ContestActionCreateInput, Prisma.ContestActionUncheckedCreateInput>;
};
/**
 * ContestAction createMany
 */
export type ContestActionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many ContestActions.
     */
    data: Prisma.ContestActionCreateManyInput | Prisma.ContestActionCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * ContestAction createManyAndReturn
 */
export type ContestActionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * The data used to create many ContestActions.
     */
    data: Prisma.ContestActionCreateManyInput | Prisma.ContestActionCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * ContestAction update
 */
export type ContestActionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionInclude<ExtArgs> | null;
    /**
     * The data needed to update a ContestAction.
     */
    data: Prisma.XOR<Prisma.ContestActionUpdateInput, Prisma.ContestActionUncheckedUpdateInput>;
    /**
     * Choose, which ContestAction to update.
     */
    where: Prisma.ContestActionWhereUniqueInput;
};
/**
 * ContestAction updateMany
 */
export type ContestActionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update ContestActions.
     */
    data: Prisma.XOR<Prisma.ContestActionUpdateManyMutationInput, Prisma.ContestActionUncheckedUpdateManyInput>;
    /**
     * Filter which ContestActions to update
     */
    where?: Prisma.ContestActionWhereInput;
    /**
     * Limit how many ContestActions to update.
     */
    limit?: number;
};
/**
 * ContestAction updateManyAndReturn
 */
export type ContestActionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * The data used to update ContestActions.
     */
    data: Prisma.XOR<Prisma.ContestActionUpdateManyMutationInput, Prisma.ContestActionUncheckedUpdateManyInput>;
    /**
     * Filter which ContestActions to update
     */
    where?: Prisma.ContestActionWhereInput;
    /**
     * Limit how many ContestActions to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * ContestAction upsert
 */
export type ContestActionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionInclude<ExtArgs> | null;
    /**
     * The filter to search for the ContestAction to update in case it exists.
     */
    where: Prisma.ContestActionWhereUniqueInput;
    /**
     * In case the ContestAction found by the `where` argument doesn't exist, create a new ContestAction with this data.
     */
    create: Prisma.XOR<Prisma.ContestActionCreateInput, Prisma.ContestActionUncheckedCreateInput>;
    /**
     * In case the ContestAction was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.ContestActionUpdateInput, Prisma.ContestActionUncheckedUpdateInput>;
};
/**
 * ContestAction delete
 */
export type ContestActionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionInclude<ExtArgs> | null;
    /**
     * Filter which ContestAction to delete.
     */
    where: Prisma.ContestActionWhereUniqueInput;
};
/**
 * ContestAction deleteMany
 */
export type ContestActionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which ContestActions to delete
     */
    where?: Prisma.ContestActionWhereInput;
    /**
     * Limit how many ContestActions to delete.
     */
    limit?: number;
};
/**
 * ContestAction.completions
 */
export type ContestAction$completionsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestActionCompletion
     */
    select?: Prisma.ContestActionCompletionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestActionCompletion
     */
    omit?: Prisma.ContestActionCompletionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionCompletionInclude<ExtArgs> | null;
    where?: Prisma.ContestActionCompletionWhereInput;
    orderBy?: Prisma.ContestActionCompletionOrderByWithRelationInput | Prisma.ContestActionCompletionOrderByWithRelationInput[];
    cursor?: Prisma.ContestActionCompletionWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ContestActionCompletionScalarFieldEnum | Prisma.ContestActionCompletionScalarFieldEnum[];
};
/**
 * ContestAction without action
 */
export type ContestActionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ContestAction
     */
    select?: Prisma.ContestActionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ContestAction
     */
    omit?: Prisma.ContestActionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ContestActionInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=ContestAction.d.ts.map