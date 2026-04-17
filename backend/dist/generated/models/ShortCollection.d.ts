import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model ShortCollection
 *
 */
export type ShortCollectionModel = runtime.Types.Result.DefaultSelection<Prisma.$ShortCollectionPayload>;
export type AggregateShortCollection = {
    _count: ShortCollectionCountAggregateOutputType | null;
    _avg: ShortCollectionAvgAggregateOutputType | null;
    _sum: ShortCollectionSumAggregateOutputType | null;
    _min: ShortCollectionMinAggregateOutputType | null;
    _max: ShortCollectionMaxAggregateOutputType | null;
};
export type ShortCollectionAvgAggregateOutputType = {
    sortOrder: number | null;
};
export type ShortCollectionSumAggregateOutputType = {
    sortOrder: number | null;
};
export type ShortCollectionMinAggregateOutputType = {
    id: string | null;
    userId: string | null;
    name: string | null;
    coverUrl: string | null;
    sortOrder: number | null;
    createdAt: Date | null;
};
export type ShortCollectionMaxAggregateOutputType = {
    id: string | null;
    userId: string | null;
    name: string | null;
    coverUrl: string | null;
    sortOrder: number | null;
    createdAt: Date | null;
};
export type ShortCollectionCountAggregateOutputType = {
    id: number;
    userId: number;
    name: number;
    coverUrl: number;
    sortOrder: number;
    createdAt: number;
    _all: number;
};
export type ShortCollectionAvgAggregateInputType = {
    sortOrder?: true;
};
export type ShortCollectionSumAggregateInputType = {
    sortOrder?: true;
};
export type ShortCollectionMinAggregateInputType = {
    id?: true;
    userId?: true;
    name?: true;
    coverUrl?: true;
    sortOrder?: true;
    createdAt?: true;
};
export type ShortCollectionMaxAggregateInputType = {
    id?: true;
    userId?: true;
    name?: true;
    coverUrl?: true;
    sortOrder?: true;
    createdAt?: true;
};
export type ShortCollectionCountAggregateInputType = {
    id?: true;
    userId?: true;
    name?: true;
    coverUrl?: true;
    sortOrder?: true;
    createdAt?: true;
    _all?: true;
};
export type ShortCollectionAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which ShortCollection to aggregate.
     */
    where?: Prisma.ShortCollectionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ShortCollections to fetch.
     */
    orderBy?: Prisma.ShortCollectionOrderByWithRelationInput | Prisma.ShortCollectionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.ShortCollectionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ShortCollections from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ShortCollections.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ShortCollections
    **/
    _count?: true | ShortCollectionCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: ShortCollectionAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: ShortCollectionSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: ShortCollectionMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: ShortCollectionMaxAggregateInputType;
};
export type GetShortCollectionAggregateType<T extends ShortCollectionAggregateArgs> = {
    [P in keyof T & keyof AggregateShortCollection]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateShortCollection[P]> : Prisma.GetScalarType<T[P], AggregateShortCollection[P]>;
};
export type ShortCollectionGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ShortCollectionWhereInput;
    orderBy?: Prisma.ShortCollectionOrderByWithAggregationInput | Prisma.ShortCollectionOrderByWithAggregationInput[];
    by: Prisma.ShortCollectionScalarFieldEnum[] | Prisma.ShortCollectionScalarFieldEnum;
    having?: Prisma.ShortCollectionScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: ShortCollectionCountAggregateInputType | true;
    _avg?: ShortCollectionAvgAggregateInputType;
    _sum?: ShortCollectionSumAggregateInputType;
    _min?: ShortCollectionMinAggregateInputType;
    _max?: ShortCollectionMaxAggregateInputType;
};
export type ShortCollectionGroupByOutputType = {
    id: string;
    userId: string;
    name: string;
    coverUrl: string | null;
    sortOrder: number;
    createdAt: Date;
    _count: ShortCollectionCountAggregateOutputType | null;
    _avg: ShortCollectionAvgAggregateOutputType | null;
    _sum: ShortCollectionSumAggregateOutputType | null;
    _min: ShortCollectionMinAggregateOutputType | null;
    _max: ShortCollectionMaxAggregateOutputType | null;
};
type GetShortCollectionGroupByPayload<T extends ShortCollectionGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<ShortCollectionGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof ShortCollectionGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], ShortCollectionGroupByOutputType[P]> : Prisma.GetScalarType<T[P], ShortCollectionGroupByOutputType[P]>;
}>>;
export type ShortCollectionWhereInput = {
    AND?: Prisma.ShortCollectionWhereInput | Prisma.ShortCollectionWhereInput[];
    OR?: Prisma.ShortCollectionWhereInput[];
    NOT?: Prisma.ShortCollectionWhereInput | Prisma.ShortCollectionWhereInput[];
    id?: Prisma.StringFilter<"ShortCollection"> | string;
    userId?: Prisma.StringFilter<"ShortCollection"> | string;
    name?: Prisma.StringFilter<"ShortCollection"> | string;
    coverUrl?: Prisma.StringNullableFilter<"ShortCollection"> | string | null;
    sortOrder?: Prisma.IntFilter<"ShortCollection"> | number;
    createdAt?: Prisma.DateTimeFilter<"ShortCollection"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    shorts?: Prisma.ShortListRelationFilter;
};
export type ShortCollectionOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    coverUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    user?: Prisma.UserOrderByWithRelationInput;
    shorts?: Prisma.ShortOrderByRelationAggregateInput;
};
export type ShortCollectionWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.ShortCollectionWhereInput | Prisma.ShortCollectionWhereInput[];
    OR?: Prisma.ShortCollectionWhereInput[];
    NOT?: Prisma.ShortCollectionWhereInput | Prisma.ShortCollectionWhereInput[];
    userId?: Prisma.StringFilter<"ShortCollection"> | string;
    name?: Prisma.StringFilter<"ShortCollection"> | string;
    coverUrl?: Prisma.StringNullableFilter<"ShortCollection"> | string | null;
    sortOrder?: Prisma.IntFilter<"ShortCollection"> | number;
    createdAt?: Prisma.DateTimeFilter<"ShortCollection"> | Date | string;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    shorts?: Prisma.ShortListRelationFilter;
}, "id">;
export type ShortCollectionOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    coverUrl?: Prisma.SortOrderInput | Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.ShortCollectionCountOrderByAggregateInput;
    _avg?: Prisma.ShortCollectionAvgOrderByAggregateInput;
    _max?: Prisma.ShortCollectionMaxOrderByAggregateInput;
    _min?: Prisma.ShortCollectionMinOrderByAggregateInput;
    _sum?: Prisma.ShortCollectionSumOrderByAggregateInput;
};
export type ShortCollectionScalarWhereWithAggregatesInput = {
    AND?: Prisma.ShortCollectionScalarWhereWithAggregatesInput | Prisma.ShortCollectionScalarWhereWithAggregatesInput[];
    OR?: Prisma.ShortCollectionScalarWhereWithAggregatesInput[];
    NOT?: Prisma.ShortCollectionScalarWhereWithAggregatesInput | Prisma.ShortCollectionScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"ShortCollection"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"ShortCollection"> | string;
    name?: Prisma.StringWithAggregatesFilter<"ShortCollection"> | string;
    coverUrl?: Prisma.StringNullableWithAggregatesFilter<"ShortCollection"> | string | null;
    sortOrder?: Prisma.IntWithAggregatesFilter<"ShortCollection"> | number;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"ShortCollection"> | Date | string;
};
export type ShortCollectionCreateInput = {
    id?: string;
    name: string;
    coverUrl?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutShortCollectionsInput;
    shorts?: Prisma.ShortCreateNestedManyWithoutCollectionInput;
};
export type ShortCollectionUncheckedCreateInput = {
    id?: string;
    userId: string;
    name: string;
    coverUrl?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
    shorts?: Prisma.ShortUncheckedCreateNestedManyWithoutCollectionInput;
};
export type ShortCollectionUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    coverUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutShortCollectionsNestedInput;
    shorts?: Prisma.ShortUpdateManyWithoutCollectionNestedInput;
};
export type ShortCollectionUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    coverUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    shorts?: Prisma.ShortUncheckedUpdateManyWithoutCollectionNestedInput;
};
export type ShortCollectionCreateManyInput = {
    id?: string;
    userId: string;
    name: string;
    coverUrl?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
};
export type ShortCollectionUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    coverUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ShortCollectionUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    coverUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ShortCollectionListRelationFilter = {
    every?: Prisma.ShortCollectionWhereInput;
    some?: Prisma.ShortCollectionWhereInput;
    none?: Prisma.ShortCollectionWhereInput;
};
export type ShortCollectionOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type ShortCollectionNullableScalarRelationFilter = {
    is?: Prisma.ShortCollectionWhereInput | null;
    isNot?: Prisma.ShortCollectionWhereInput | null;
};
export type ShortCollectionCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    coverUrl?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type ShortCollectionAvgOrderByAggregateInput = {
    sortOrder?: Prisma.SortOrder;
};
export type ShortCollectionMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    coverUrl?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type ShortCollectionMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    coverUrl?: Prisma.SortOrder;
    sortOrder?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type ShortCollectionSumOrderByAggregateInput = {
    sortOrder?: Prisma.SortOrder;
};
export type ShortCollectionCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.ShortCollectionCreateWithoutUserInput, Prisma.ShortCollectionUncheckedCreateWithoutUserInput> | Prisma.ShortCollectionCreateWithoutUserInput[] | Prisma.ShortCollectionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ShortCollectionCreateOrConnectWithoutUserInput | Prisma.ShortCollectionCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.ShortCollectionCreateManyUserInputEnvelope;
    connect?: Prisma.ShortCollectionWhereUniqueInput | Prisma.ShortCollectionWhereUniqueInput[];
};
export type ShortCollectionUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.ShortCollectionCreateWithoutUserInput, Prisma.ShortCollectionUncheckedCreateWithoutUserInput> | Prisma.ShortCollectionCreateWithoutUserInput[] | Prisma.ShortCollectionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ShortCollectionCreateOrConnectWithoutUserInput | Prisma.ShortCollectionCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.ShortCollectionCreateManyUserInputEnvelope;
    connect?: Prisma.ShortCollectionWhereUniqueInput | Prisma.ShortCollectionWhereUniqueInput[];
};
export type ShortCollectionUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.ShortCollectionCreateWithoutUserInput, Prisma.ShortCollectionUncheckedCreateWithoutUserInput> | Prisma.ShortCollectionCreateWithoutUserInput[] | Prisma.ShortCollectionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ShortCollectionCreateOrConnectWithoutUserInput | Prisma.ShortCollectionCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.ShortCollectionUpsertWithWhereUniqueWithoutUserInput | Prisma.ShortCollectionUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.ShortCollectionCreateManyUserInputEnvelope;
    set?: Prisma.ShortCollectionWhereUniqueInput | Prisma.ShortCollectionWhereUniqueInput[];
    disconnect?: Prisma.ShortCollectionWhereUniqueInput | Prisma.ShortCollectionWhereUniqueInput[];
    delete?: Prisma.ShortCollectionWhereUniqueInput | Prisma.ShortCollectionWhereUniqueInput[];
    connect?: Prisma.ShortCollectionWhereUniqueInput | Prisma.ShortCollectionWhereUniqueInput[];
    update?: Prisma.ShortCollectionUpdateWithWhereUniqueWithoutUserInput | Prisma.ShortCollectionUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.ShortCollectionUpdateManyWithWhereWithoutUserInput | Prisma.ShortCollectionUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.ShortCollectionScalarWhereInput | Prisma.ShortCollectionScalarWhereInput[];
};
export type ShortCollectionUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.ShortCollectionCreateWithoutUserInput, Prisma.ShortCollectionUncheckedCreateWithoutUserInput> | Prisma.ShortCollectionCreateWithoutUserInput[] | Prisma.ShortCollectionUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.ShortCollectionCreateOrConnectWithoutUserInput | Prisma.ShortCollectionCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.ShortCollectionUpsertWithWhereUniqueWithoutUserInput | Prisma.ShortCollectionUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.ShortCollectionCreateManyUserInputEnvelope;
    set?: Prisma.ShortCollectionWhereUniqueInput | Prisma.ShortCollectionWhereUniqueInput[];
    disconnect?: Prisma.ShortCollectionWhereUniqueInput | Prisma.ShortCollectionWhereUniqueInput[];
    delete?: Prisma.ShortCollectionWhereUniqueInput | Prisma.ShortCollectionWhereUniqueInput[];
    connect?: Prisma.ShortCollectionWhereUniqueInput | Prisma.ShortCollectionWhereUniqueInput[];
    update?: Prisma.ShortCollectionUpdateWithWhereUniqueWithoutUserInput | Prisma.ShortCollectionUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.ShortCollectionUpdateManyWithWhereWithoutUserInput | Prisma.ShortCollectionUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.ShortCollectionScalarWhereInput | Prisma.ShortCollectionScalarWhereInput[];
};
export type ShortCollectionCreateNestedOneWithoutShortsInput = {
    create?: Prisma.XOR<Prisma.ShortCollectionCreateWithoutShortsInput, Prisma.ShortCollectionUncheckedCreateWithoutShortsInput>;
    connectOrCreate?: Prisma.ShortCollectionCreateOrConnectWithoutShortsInput;
    connect?: Prisma.ShortCollectionWhereUniqueInput;
};
export type ShortCollectionUpdateOneWithoutShortsNestedInput = {
    create?: Prisma.XOR<Prisma.ShortCollectionCreateWithoutShortsInput, Prisma.ShortCollectionUncheckedCreateWithoutShortsInput>;
    connectOrCreate?: Prisma.ShortCollectionCreateOrConnectWithoutShortsInput;
    upsert?: Prisma.ShortCollectionUpsertWithoutShortsInput;
    disconnect?: Prisma.ShortCollectionWhereInput | boolean;
    delete?: Prisma.ShortCollectionWhereInput | boolean;
    connect?: Prisma.ShortCollectionWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.ShortCollectionUpdateToOneWithWhereWithoutShortsInput, Prisma.ShortCollectionUpdateWithoutShortsInput>, Prisma.ShortCollectionUncheckedUpdateWithoutShortsInput>;
};
export type ShortCollectionCreateWithoutUserInput = {
    id?: string;
    name: string;
    coverUrl?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
    shorts?: Prisma.ShortCreateNestedManyWithoutCollectionInput;
};
export type ShortCollectionUncheckedCreateWithoutUserInput = {
    id?: string;
    name: string;
    coverUrl?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
    shorts?: Prisma.ShortUncheckedCreateNestedManyWithoutCollectionInput;
};
export type ShortCollectionCreateOrConnectWithoutUserInput = {
    where: Prisma.ShortCollectionWhereUniqueInput;
    create: Prisma.XOR<Prisma.ShortCollectionCreateWithoutUserInput, Prisma.ShortCollectionUncheckedCreateWithoutUserInput>;
};
export type ShortCollectionCreateManyUserInputEnvelope = {
    data: Prisma.ShortCollectionCreateManyUserInput | Prisma.ShortCollectionCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type ShortCollectionUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.ShortCollectionWhereUniqueInput;
    update: Prisma.XOR<Prisma.ShortCollectionUpdateWithoutUserInput, Prisma.ShortCollectionUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.ShortCollectionCreateWithoutUserInput, Prisma.ShortCollectionUncheckedCreateWithoutUserInput>;
};
export type ShortCollectionUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.ShortCollectionWhereUniqueInput;
    data: Prisma.XOR<Prisma.ShortCollectionUpdateWithoutUserInput, Prisma.ShortCollectionUncheckedUpdateWithoutUserInput>;
};
export type ShortCollectionUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.ShortCollectionScalarWhereInput;
    data: Prisma.XOR<Prisma.ShortCollectionUpdateManyMutationInput, Prisma.ShortCollectionUncheckedUpdateManyWithoutUserInput>;
};
export type ShortCollectionScalarWhereInput = {
    AND?: Prisma.ShortCollectionScalarWhereInput | Prisma.ShortCollectionScalarWhereInput[];
    OR?: Prisma.ShortCollectionScalarWhereInput[];
    NOT?: Prisma.ShortCollectionScalarWhereInput | Prisma.ShortCollectionScalarWhereInput[];
    id?: Prisma.StringFilter<"ShortCollection"> | string;
    userId?: Prisma.StringFilter<"ShortCollection"> | string;
    name?: Prisma.StringFilter<"ShortCollection"> | string;
    coverUrl?: Prisma.StringNullableFilter<"ShortCollection"> | string | null;
    sortOrder?: Prisma.IntFilter<"ShortCollection"> | number;
    createdAt?: Prisma.DateTimeFilter<"ShortCollection"> | Date | string;
};
export type ShortCollectionCreateWithoutShortsInput = {
    id?: string;
    name: string;
    coverUrl?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
    user: Prisma.UserCreateNestedOneWithoutShortCollectionsInput;
};
export type ShortCollectionUncheckedCreateWithoutShortsInput = {
    id?: string;
    userId: string;
    name: string;
    coverUrl?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
};
export type ShortCollectionCreateOrConnectWithoutShortsInput = {
    where: Prisma.ShortCollectionWhereUniqueInput;
    create: Prisma.XOR<Prisma.ShortCollectionCreateWithoutShortsInput, Prisma.ShortCollectionUncheckedCreateWithoutShortsInput>;
};
export type ShortCollectionUpsertWithoutShortsInput = {
    update: Prisma.XOR<Prisma.ShortCollectionUpdateWithoutShortsInput, Prisma.ShortCollectionUncheckedUpdateWithoutShortsInput>;
    create: Prisma.XOR<Prisma.ShortCollectionCreateWithoutShortsInput, Prisma.ShortCollectionUncheckedCreateWithoutShortsInput>;
    where?: Prisma.ShortCollectionWhereInput;
};
export type ShortCollectionUpdateToOneWithWhereWithoutShortsInput = {
    where?: Prisma.ShortCollectionWhereInput;
    data: Prisma.XOR<Prisma.ShortCollectionUpdateWithoutShortsInput, Prisma.ShortCollectionUncheckedUpdateWithoutShortsInput>;
};
export type ShortCollectionUpdateWithoutShortsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    coverUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutShortCollectionsNestedInput;
};
export type ShortCollectionUncheckedUpdateWithoutShortsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    coverUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type ShortCollectionCreateManyUserInput = {
    id?: string;
    name: string;
    coverUrl?: string | null;
    sortOrder?: number;
    createdAt?: Date | string;
};
export type ShortCollectionUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    coverUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    shorts?: Prisma.ShortUpdateManyWithoutCollectionNestedInput;
};
export type ShortCollectionUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    coverUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    shorts?: Prisma.ShortUncheckedUpdateManyWithoutCollectionNestedInput;
};
export type ShortCollectionUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    coverUrl?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    sortOrder?: Prisma.IntFieldUpdateOperationsInput | number;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
/**
 * Count Type ShortCollectionCountOutputType
 */
export type ShortCollectionCountOutputType = {
    shorts: number;
};
export type ShortCollectionCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    shorts?: boolean | ShortCollectionCountOutputTypeCountShortsArgs;
};
/**
 * ShortCollectionCountOutputType without action
 */
export type ShortCollectionCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollectionCountOutputType
     */
    select?: Prisma.ShortCollectionCountOutputTypeSelect<ExtArgs> | null;
};
/**
 * ShortCollectionCountOutputType without action
 */
export type ShortCollectionCountOutputTypeCountShortsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.ShortWhereInput;
};
export type ShortCollectionSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    name?: boolean;
    coverUrl?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    shorts?: boolean | Prisma.ShortCollection$shortsArgs<ExtArgs>;
    _count?: boolean | Prisma.ShortCollectionCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["shortCollection"]>;
export type ShortCollectionSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    name?: boolean;
    coverUrl?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["shortCollection"]>;
export type ShortCollectionSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    userId?: boolean;
    name?: boolean;
    coverUrl?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["shortCollection"]>;
export type ShortCollectionSelectScalar = {
    id?: boolean;
    userId?: boolean;
    name?: boolean;
    coverUrl?: boolean;
    sortOrder?: boolean;
    createdAt?: boolean;
};
export type ShortCollectionOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "userId" | "name" | "coverUrl" | "sortOrder" | "createdAt", ExtArgs["result"]["shortCollection"]>;
export type ShortCollectionInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    shorts?: boolean | Prisma.ShortCollection$shortsArgs<ExtArgs>;
    _count?: boolean | Prisma.ShortCollectionCountOutputTypeDefaultArgs<ExtArgs>;
};
export type ShortCollectionIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type ShortCollectionIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $ShortCollectionPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "ShortCollection";
    objects: {
        user: Prisma.$UserPayload<ExtArgs>;
        shorts: Prisma.$ShortPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        userId: string;
        name: string;
        coverUrl: string | null;
        sortOrder: number;
        createdAt: Date;
    }, ExtArgs["result"]["shortCollection"]>;
    composites: {};
};
export type ShortCollectionGetPayload<S extends boolean | null | undefined | ShortCollectionDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload, S>;
export type ShortCollectionCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<ShortCollectionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: ShortCollectionCountAggregateInputType | true;
};
export interface ShortCollectionDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['ShortCollection'];
        meta: {
            name: 'ShortCollection';
        };
    };
    /**
     * Find zero or one ShortCollection that matches the filter.
     * @param {ShortCollectionFindUniqueArgs} args - Arguments to find a ShortCollection
     * @example
     * // Get one ShortCollection
     * const shortCollection = await prisma.shortCollection.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ShortCollectionFindUniqueArgs>(args: Prisma.SelectSubset<T, ShortCollectionFindUniqueArgs<ExtArgs>>): Prisma.Prisma__ShortCollectionClient<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one ShortCollection that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ShortCollectionFindUniqueOrThrowArgs} args - Arguments to find a ShortCollection
     * @example
     * // Get one ShortCollection
     * const shortCollection = await prisma.shortCollection.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ShortCollectionFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, ShortCollectionFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__ShortCollectionClient<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first ShortCollection that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortCollectionFindFirstArgs} args - Arguments to find a ShortCollection
     * @example
     * // Get one ShortCollection
     * const shortCollection = await prisma.shortCollection.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ShortCollectionFindFirstArgs>(args?: Prisma.SelectSubset<T, ShortCollectionFindFirstArgs<ExtArgs>>): Prisma.Prisma__ShortCollectionClient<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first ShortCollection that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortCollectionFindFirstOrThrowArgs} args - Arguments to find a ShortCollection
     * @example
     * // Get one ShortCollection
     * const shortCollection = await prisma.shortCollection.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ShortCollectionFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, ShortCollectionFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__ShortCollectionClient<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more ShortCollections that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortCollectionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ShortCollections
     * const shortCollections = await prisma.shortCollection.findMany()
     *
     * // Get first 10 ShortCollections
     * const shortCollections = await prisma.shortCollection.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const shortCollectionWithIdOnly = await prisma.shortCollection.findMany({ select: { id: true } })
     *
     */
    findMany<T extends ShortCollectionFindManyArgs>(args?: Prisma.SelectSubset<T, ShortCollectionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a ShortCollection.
     * @param {ShortCollectionCreateArgs} args - Arguments to create a ShortCollection.
     * @example
     * // Create one ShortCollection
     * const ShortCollection = await prisma.shortCollection.create({
     *   data: {
     *     // ... data to create a ShortCollection
     *   }
     * })
     *
     */
    create<T extends ShortCollectionCreateArgs>(args: Prisma.SelectSubset<T, ShortCollectionCreateArgs<ExtArgs>>): Prisma.Prisma__ShortCollectionClient<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many ShortCollections.
     * @param {ShortCollectionCreateManyArgs} args - Arguments to create many ShortCollections.
     * @example
     * // Create many ShortCollections
     * const shortCollection = await prisma.shortCollection.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ShortCollectionCreateManyArgs>(args?: Prisma.SelectSubset<T, ShortCollectionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many ShortCollections and returns the data saved in the database.
     * @param {ShortCollectionCreateManyAndReturnArgs} args - Arguments to create many ShortCollections.
     * @example
     * // Create many ShortCollections
     * const shortCollection = await prisma.shortCollection.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ShortCollections and only return the `id`
     * const shortCollectionWithIdOnly = await prisma.shortCollection.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ShortCollectionCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, ShortCollectionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a ShortCollection.
     * @param {ShortCollectionDeleteArgs} args - Arguments to delete one ShortCollection.
     * @example
     * // Delete one ShortCollection
     * const ShortCollection = await prisma.shortCollection.delete({
     *   where: {
     *     // ... filter to delete one ShortCollection
     *   }
     * })
     *
     */
    delete<T extends ShortCollectionDeleteArgs>(args: Prisma.SelectSubset<T, ShortCollectionDeleteArgs<ExtArgs>>): Prisma.Prisma__ShortCollectionClient<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one ShortCollection.
     * @param {ShortCollectionUpdateArgs} args - Arguments to update one ShortCollection.
     * @example
     * // Update one ShortCollection
     * const shortCollection = await prisma.shortCollection.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ShortCollectionUpdateArgs>(args: Prisma.SelectSubset<T, ShortCollectionUpdateArgs<ExtArgs>>): Prisma.Prisma__ShortCollectionClient<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more ShortCollections.
     * @param {ShortCollectionDeleteManyArgs} args - Arguments to filter ShortCollections to delete.
     * @example
     * // Delete a few ShortCollections
     * const { count } = await prisma.shortCollection.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ShortCollectionDeleteManyArgs>(args?: Prisma.SelectSubset<T, ShortCollectionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more ShortCollections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortCollectionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ShortCollections
     * const shortCollection = await prisma.shortCollection.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ShortCollectionUpdateManyArgs>(args: Prisma.SelectSubset<T, ShortCollectionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more ShortCollections and returns the data updated in the database.
     * @param {ShortCollectionUpdateManyAndReturnArgs} args - Arguments to update many ShortCollections.
     * @example
     * // Update many ShortCollections
     * const shortCollection = await prisma.shortCollection.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ShortCollections and only return the `id`
     * const shortCollectionWithIdOnly = await prisma.shortCollection.updateManyAndReturn({
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
    updateManyAndReturn<T extends ShortCollectionUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, ShortCollectionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one ShortCollection.
     * @param {ShortCollectionUpsertArgs} args - Arguments to update or create a ShortCollection.
     * @example
     * // Update or create a ShortCollection
     * const shortCollection = await prisma.shortCollection.upsert({
     *   create: {
     *     // ... data to create a ShortCollection
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ShortCollection we want to update
     *   }
     * })
     */
    upsert<T extends ShortCollectionUpsertArgs>(args: Prisma.SelectSubset<T, ShortCollectionUpsertArgs<ExtArgs>>): Prisma.Prisma__ShortCollectionClient<runtime.Types.Result.GetResult<Prisma.$ShortCollectionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of ShortCollections.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortCollectionCountArgs} args - Arguments to filter ShortCollections to count.
     * @example
     * // Count the number of ShortCollections
     * const count = await prisma.shortCollection.count({
     *   where: {
     *     // ... the filter for the ShortCollections we want to count
     *   }
     * })
    **/
    count<T extends ShortCollectionCountArgs>(args?: Prisma.Subset<T, ShortCollectionCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], ShortCollectionCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a ShortCollection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortCollectionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ShortCollectionAggregateArgs>(args: Prisma.Subset<T, ShortCollectionAggregateArgs>): Prisma.PrismaPromise<GetShortCollectionAggregateType<T>>;
    /**
     * Group by ShortCollection.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ShortCollectionGroupByArgs} args - Group by arguments.
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
    groupBy<T extends ShortCollectionGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: ShortCollectionGroupByArgs['orderBy'];
    } : {
        orderBy?: ShortCollectionGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, ShortCollectionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetShortCollectionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the ShortCollection model
     */
    readonly fields: ShortCollectionFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for ShortCollection.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__ShortCollectionClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    shorts<T extends Prisma.ShortCollection$shortsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.ShortCollection$shortsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$ShortPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
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
 * Fields of the ShortCollection model
 */
export interface ShortCollectionFieldRefs {
    readonly id: Prisma.FieldRef<"ShortCollection", 'String'>;
    readonly userId: Prisma.FieldRef<"ShortCollection", 'String'>;
    readonly name: Prisma.FieldRef<"ShortCollection", 'String'>;
    readonly coverUrl: Prisma.FieldRef<"ShortCollection", 'String'>;
    readonly sortOrder: Prisma.FieldRef<"ShortCollection", 'Int'>;
    readonly createdAt: Prisma.FieldRef<"ShortCollection", 'DateTime'>;
}
/**
 * ShortCollection findUnique
 */
export type ShortCollectionFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionInclude<ExtArgs> | null;
    /**
     * Filter, which ShortCollection to fetch.
     */
    where: Prisma.ShortCollectionWhereUniqueInput;
};
/**
 * ShortCollection findUniqueOrThrow
 */
export type ShortCollectionFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionInclude<ExtArgs> | null;
    /**
     * Filter, which ShortCollection to fetch.
     */
    where: Prisma.ShortCollectionWhereUniqueInput;
};
/**
 * ShortCollection findFirst
 */
export type ShortCollectionFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionInclude<ExtArgs> | null;
    /**
     * Filter, which ShortCollection to fetch.
     */
    where?: Prisma.ShortCollectionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ShortCollections to fetch.
     */
    orderBy?: Prisma.ShortCollectionOrderByWithRelationInput | Prisma.ShortCollectionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ShortCollections.
     */
    cursor?: Prisma.ShortCollectionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ShortCollections from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ShortCollections.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ShortCollections.
     */
    distinct?: Prisma.ShortCollectionScalarFieldEnum | Prisma.ShortCollectionScalarFieldEnum[];
};
/**
 * ShortCollection findFirstOrThrow
 */
export type ShortCollectionFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionInclude<ExtArgs> | null;
    /**
     * Filter, which ShortCollection to fetch.
     */
    where?: Prisma.ShortCollectionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ShortCollections to fetch.
     */
    orderBy?: Prisma.ShortCollectionOrderByWithRelationInput | Prisma.ShortCollectionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ShortCollections.
     */
    cursor?: Prisma.ShortCollectionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ShortCollections from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ShortCollections.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ShortCollections.
     */
    distinct?: Prisma.ShortCollectionScalarFieldEnum | Prisma.ShortCollectionScalarFieldEnum[];
};
/**
 * ShortCollection findMany
 */
export type ShortCollectionFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionInclude<ExtArgs> | null;
    /**
     * Filter, which ShortCollections to fetch.
     */
    where?: Prisma.ShortCollectionWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ShortCollections to fetch.
     */
    orderBy?: Prisma.ShortCollectionOrderByWithRelationInput | Prisma.ShortCollectionOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ShortCollections.
     */
    cursor?: Prisma.ShortCollectionWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ShortCollections from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ShortCollections.
     */
    skip?: number;
    distinct?: Prisma.ShortCollectionScalarFieldEnum | Prisma.ShortCollectionScalarFieldEnum[];
};
/**
 * ShortCollection create
 */
export type ShortCollectionCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionInclude<ExtArgs> | null;
    /**
     * The data needed to create a ShortCollection.
     */
    data: Prisma.XOR<Prisma.ShortCollectionCreateInput, Prisma.ShortCollectionUncheckedCreateInput>;
};
/**
 * ShortCollection createMany
 */
export type ShortCollectionCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many ShortCollections.
     */
    data: Prisma.ShortCollectionCreateManyInput | Prisma.ShortCollectionCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * ShortCollection createManyAndReturn
 */
export type ShortCollectionCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * The data used to create many ShortCollections.
     */
    data: Prisma.ShortCollectionCreateManyInput | Prisma.ShortCollectionCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * ShortCollection update
 */
export type ShortCollectionUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionInclude<ExtArgs> | null;
    /**
     * The data needed to update a ShortCollection.
     */
    data: Prisma.XOR<Prisma.ShortCollectionUpdateInput, Prisma.ShortCollectionUncheckedUpdateInput>;
    /**
     * Choose, which ShortCollection to update.
     */
    where: Prisma.ShortCollectionWhereUniqueInput;
};
/**
 * ShortCollection updateMany
 */
export type ShortCollectionUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update ShortCollections.
     */
    data: Prisma.XOR<Prisma.ShortCollectionUpdateManyMutationInput, Prisma.ShortCollectionUncheckedUpdateManyInput>;
    /**
     * Filter which ShortCollections to update
     */
    where?: Prisma.ShortCollectionWhereInput;
    /**
     * Limit how many ShortCollections to update.
     */
    limit?: number;
};
/**
 * ShortCollection updateManyAndReturn
 */
export type ShortCollectionUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * The data used to update ShortCollections.
     */
    data: Prisma.XOR<Prisma.ShortCollectionUpdateManyMutationInput, Prisma.ShortCollectionUncheckedUpdateManyInput>;
    /**
     * Filter which ShortCollections to update
     */
    where?: Prisma.ShortCollectionWhereInput;
    /**
     * Limit how many ShortCollections to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * ShortCollection upsert
 */
export type ShortCollectionUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionInclude<ExtArgs> | null;
    /**
     * The filter to search for the ShortCollection to update in case it exists.
     */
    where: Prisma.ShortCollectionWhereUniqueInput;
    /**
     * In case the ShortCollection found by the `where` argument doesn't exist, create a new ShortCollection with this data.
     */
    create: Prisma.XOR<Prisma.ShortCollectionCreateInput, Prisma.ShortCollectionUncheckedCreateInput>;
    /**
     * In case the ShortCollection was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.ShortCollectionUpdateInput, Prisma.ShortCollectionUncheckedUpdateInput>;
};
/**
 * ShortCollection delete
 */
export type ShortCollectionDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionInclude<ExtArgs> | null;
    /**
     * Filter which ShortCollection to delete.
     */
    where: Prisma.ShortCollectionWhereUniqueInput;
};
/**
 * ShortCollection deleteMany
 */
export type ShortCollectionDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which ShortCollections to delete
     */
    where?: Prisma.ShortCollectionWhereInput;
    /**
     * Limit how many ShortCollections to delete.
     */
    limit?: number;
};
/**
 * ShortCollection.shorts
 */
export type ShortCollection$shortsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Short
     */
    select?: Prisma.ShortSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Short
     */
    omit?: Prisma.ShortOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortInclude<ExtArgs> | null;
    where?: Prisma.ShortWhereInput;
    orderBy?: Prisma.ShortOrderByWithRelationInput | Prisma.ShortOrderByWithRelationInput[];
    cursor?: Prisma.ShortWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.ShortScalarFieldEnum | Prisma.ShortScalarFieldEnum[];
};
/**
 * ShortCollection without action
 */
export type ShortCollectionDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ShortCollection
     */
    select?: Prisma.ShortCollectionSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the ShortCollection
     */
    omit?: Prisma.ShortCollectionOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.ShortCollectionInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=ShortCollection.d.ts.map