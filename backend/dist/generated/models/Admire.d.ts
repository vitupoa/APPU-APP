import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace";
/**
 * Model Admire
 *
 */
export type AdmireModel = runtime.Types.Result.DefaultSelection<Prisma.$AdmirePayload>;
export type AggregateAdmire = {
    _count: AdmireCountAggregateOutputType | null;
    _min: AdmireMinAggregateOutputType | null;
    _max: AdmireMaxAggregateOutputType | null;
};
export type AdmireMinAggregateOutputType = {
    id: string | null;
    admirerId: string | null;
    admiredId: string | null;
    isLovers: boolean | null;
    createdAt: Date | null;
};
export type AdmireMaxAggregateOutputType = {
    id: string | null;
    admirerId: string | null;
    admiredId: string | null;
    isLovers: boolean | null;
    createdAt: Date | null;
};
export type AdmireCountAggregateOutputType = {
    id: number;
    admirerId: number;
    admiredId: number;
    isLovers: number;
    createdAt: number;
    _all: number;
};
export type AdmireMinAggregateInputType = {
    id?: true;
    admirerId?: true;
    admiredId?: true;
    isLovers?: true;
    createdAt?: true;
};
export type AdmireMaxAggregateInputType = {
    id?: true;
    admirerId?: true;
    admiredId?: true;
    isLovers?: true;
    createdAt?: true;
};
export type AdmireCountAggregateInputType = {
    id?: true;
    admirerId?: true;
    admiredId?: true;
    isLovers?: true;
    createdAt?: true;
    _all?: true;
};
export type AdmireAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Admire to aggregate.
     */
    where?: Prisma.AdmireWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Admires to fetch.
     */
    orderBy?: Prisma.AdmireOrderByWithRelationInput | Prisma.AdmireOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: Prisma.AdmireWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Admires from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Admires.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Admires
    **/
    _count?: true | AdmireCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: AdmireMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: AdmireMaxAggregateInputType;
};
export type GetAdmireAggregateType<T extends AdmireAggregateArgs> = {
    [P in keyof T & keyof AggregateAdmire]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateAdmire[P]> : Prisma.GetScalarType<T[P], AggregateAdmire[P]>;
};
export type AdmireGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.AdmireWhereInput;
    orderBy?: Prisma.AdmireOrderByWithAggregationInput | Prisma.AdmireOrderByWithAggregationInput[];
    by: Prisma.AdmireScalarFieldEnum[] | Prisma.AdmireScalarFieldEnum;
    having?: Prisma.AdmireScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: AdmireCountAggregateInputType | true;
    _min?: AdmireMinAggregateInputType;
    _max?: AdmireMaxAggregateInputType;
};
export type AdmireGroupByOutputType = {
    id: string;
    admirerId: string;
    admiredId: string;
    isLovers: boolean;
    createdAt: Date;
    _count: AdmireCountAggregateOutputType | null;
    _min: AdmireMinAggregateOutputType | null;
    _max: AdmireMaxAggregateOutputType | null;
};
type GetAdmireGroupByPayload<T extends AdmireGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<AdmireGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof AdmireGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], AdmireGroupByOutputType[P]> : Prisma.GetScalarType<T[P], AdmireGroupByOutputType[P]>;
}>>;
export type AdmireWhereInput = {
    AND?: Prisma.AdmireWhereInput | Prisma.AdmireWhereInput[];
    OR?: Prisma.AdmireWhereInput[];
    NOT?: Prisma.AdmireWhereInput | Prisma.AdmireWhereInput[];
    id?: Prisma.StringFilter<"Admire"> | string;
    admirerId?: Prisma.StringFilter<"Admire"> | string;
    admiredId?: Prisma.StringFilter<"Admire"> | string;
    isLovers?: Prisma.BoolFilter<"Admire"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Admire"> | Date | string;
    admirer?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    admired?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type AdmireOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    admirerId?: Prisma.SortOrder;
    admiredId?: Prisma.SortOrder;
    isLovers?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    admirer?: Prisma.UserOrderByWithRelationInput;
    admired?: Prisma.UserOrderByWithRelationInput;
};
export type AdmireWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    admirerId_admiredId?: Prisma.AdmireAdmirerIdAdmiredIdCompoundUniqueInput;
    AND?: Prisma.AdmireWhereInput | Prisma.AdmireWhereInput[];
    OR?: Prisma.AdmireWhereInput[];
    NOT?: Prisma.AdmireWhereInput | Prisma.AdmireWhereInput[];
    admirerId?: Prisma.StringFilter<"Admire"> | string;
    admiredId?: Prisma.StringFilter<"Admire"> | string;
    isLovers?: Prisma.BoolFilter<"Admire"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Admire"> | Date | string;
    admirer?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
    admired?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id" | "admirerId_admiredId">;
export type AdmireOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    admirerId?: Prisma.SortOrder;
    admiredId?: Prisma.SortOrder;
    isLovers?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.AdmireCountOrderByAggregateInput;
    _max?: Prisma.AdmireMaxOrderByAggregateInput;
    _min?: Prisma.AdmireMinOrderByAggregateInput;
};
export type AdmireScalarWhereWithAggregatesInput = {
    AND?: Prisma.AdmireScalarWhereWithAggregatesInput | Prisma.AdmireScalarWhereWithAggregatesInput[];
    OR?: Prisma.AdmireScalarWhereWithAggregatesInput[];
    NOT?: Prisma.AdmireScalarWhereWithAggregatesInput | Prisma.AdmireScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Admire"> | string;
    admirerId?: Prisma.StringWithAggregatesFilter<"Admire"> | string;
    admiredId?: Prisma.StringWithAggregatesFilter<"Admire"> | string;
    isLovers?: Prisma.BoolWithAggregatesFilter<"Admire"> | boolean;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Admire"> | Date | string;
};
export type AdmireCreateInput = {
    id?: string;
    isLovers?: boolean;
    createdAt?: Date | string;
    admirer: Prisma.UserCreateNestedOneWithoutAdmiringInput;
    admired: Prisma.UserCreateNestedOneWithoutAdmirersInput;
};
export type AdmireUncheckedCreateInput = {
    id?: string;
    admirerId: string;
    admiredId: string;
    isLovers?: boolean;
    createdAt?: Date | string;
};
export type AdmireUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    isLovers?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    admirer?: Prisma.UserUpdateOneRequiredWithoutAdmiringNestedInput;
    admired?: Prisma.UserUpdateOneRequiredWithoutAdmirersNestedInput;
};
export type AdmireUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    admirerId?: Prisma.StringFieldUpdateOperationsInput | string;
    admiredId?: Prisma.StringFieldUpdateOperationsInput | string;
    isLovers?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdmireCreateManyInput = {
    id?: string;
    admirerId: string;
    admiredId: string;
    isLovers?: boolean;
    createdAt?: Date | string;
};
export type AdmireUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    isLovers?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdmireUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    admirerId?: Prisma.StringFieldUpdateOperationsInput | string;
    admiredId?: Prisma.StringFieldUpdateOperationsInput | string;
    isLovers?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdmireListRelationFilter = {
    every?: Prisma.AdmireWhereInput;
    some?: Prisma.AdmireWhereInput;
    none?: Prisma.AdmireWhereInput;
};
export type AdmireOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type AdmireAdmirerIdAdmiredIdCompoundUniqueInput = {
    admirerId: string;
    admiredId: string;
};
export type AdmireCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    admirerId?: Prisma.SortOrder;
    admiredId?: Prisma.SortOrder;
    isLovers?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AdmireMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    admirerId?: Prisma.SortOrder;
    admiredId?: Prisma.SortOrder;
    isLovers?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AdmireMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    admirerId?: Prisma.SortOrder;
    admiredId?: Prisma.SortOrder;
    isLovers?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type AdmireCreateNestedManyWithoutAdmiredInput = {
    create?: Prisma.XOR<Prisma.AdmireCreateWithoutAdmiredInput, Prisma.AdmireUncheckedCreateWithoutAdmiredInput> | Prisma.AdmireCreateWithoutAdmiredInput[] | Prisma.AdmireUncheckedCreateWithoutAdmiredInput[];
    connectOrCreate?: Prisma.AdmireCreateOrConnectWithoutAdmiredInput | Prisma.AdmireCreateOrConnectWithoutAdmiredInput[];
    createMany?: Prisma.AdmireCreateManyAdmiredInputEnvelope;
    connect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
};
export type AdmireCreateNestedManyWithoutAdmirerInput = {
    create?: Prisma.XOR<Prisma.AdmireCreateWithoutAdmirerInput, Prisma.AdmireUncheckedCreateWithoutAdmirerInput> | Prisma.AdmireCreateWithoutAdmirerInput[] | Prisma.AdmireUncheckedCreateWithoutAdmirerInput[];
    connectOrCreate?: Prisma.AdmireCreateOrConnectWithoutAdmirerInput | Prisma.AdmireCreateOrConnectWithoutAdmirerInput[];
    createMany?: Prisma.AdmireCreateManyAdmirerInputEnvelope;
    connect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
};
export type AdmireUncheckedCreateNestedManyWithoutAdmiredInput = {
    create?: Prisma.XOR<Prisma.AdmireCreateWithoutAdmiredInput, Prisma.AdmireUncheckedCreateWithoutAdmiredInput> | Prisma.AdmireCreateWithoutAdmiredInput[] | Prisma.AdmireUncheckedCreateWithoutAdmiredInput[];
    connectOrCreate?: Prisma.AdmireCreateOrConnectWithoutAdmiredInput | Prisma.AdmireCreateOrConnectWithoutAdmiredInput[];
    createMany?: Prisma.AdmireCreateManyAdmiredInputEnvelope;
    connect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
};
export type AdmireUncheckedCreateNestedManyWithoutAdmirerInput = {
    create?: Prisma.XOR<Prisma.AdmireCreateWithoutAdmirerInput, Prisma.AdmireUncheckedCreateWithoutAdmirerInput> | Prisma.AdmireCreateWithoutAdmirerInput[] | Prisma.AdmireUncheckedCreateWithoutAdmirerInput[];
    connectOrCreate?: Prisma.AdmireCreateOrConnectWithoutAdmirerInput | Prisma.AdmireCreateOrConnectWithoutAdmirerInput[];
    createMany?: Prisma.AdmireCreateManyAdmirerInputEnvelope;
    connect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
};
export type AdmireUpdateManyWithoutAdmiredNestedInput = {
    create?: Prisma.XOR<Prisma.AdmireCreateWithoutAdmiredInput, Prisma.AdmireUncheckedCreateWithoutAdmiredInput> | Prisma.AdmireCreateWithoutAdmiredInput[] | Prisma.AdmireUncheckedCreateWithoutAdmiredInput[];
    connectOrCreate?: Prisma.AdmireCreateOrConnectWithoutAdmiredInput | Prisma.AdmireCreateOrConnectWithoutAdmiredInput[];
    upsert?: Prisma.AdmireUpsertWithWhereUniqueWithoutAdmiredInput | Prisma.AdmireUpsertWithWhereUniqueWithoutAdmiredInput[];
    createMany?: Prisma.AdmireCreateManyAdmiredInputEnvelope;
    set?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    disconnect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    delete?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    connect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    update?: Prisma.AdmireUpdateWithWhereUniqueWithoutAdmiredInput | Prisma.AdmireUpdateWithWhereUniqueWithoutAdmiredInput[];
    updateMany?: Prisma.AdmireUpdateManyWithWhereWithoutAdmiredInput | Prisma.AdmireUpdateManyWithWhereWithoutAdmiredInput[];
    deleteMany?: Prisma.AdmireScalarWhereInput | Prisma.AdmireScalarWhereInput[];
};
export type AdmireUpdateManyWithoutAdmirerNestedInput = {
    create?: Prisma.XOR<Prisma.AdmireCreateWithoutAdmirerInput, Prisma.AdmireUncheckedCreateWithoutAdmirerInput> | Prisma.AdmireCreateWithoutAdmirerInput[] | Prisma.AdmireUncheckedCreateWithoutAdmirerInput[];
    connectOrCreate?: Prisma.AdmireCreateOrConnectWithoutAdmirerInput | Prisma.AdmireCreateOrConnectWithoutAdmirerInput[];
    upsert?: Prisma.AdmireUpsertWithWhereUniqueWithoutAdmirerInput | Prisma.AdmireUpsertWithWhereUniqueWithoutAdmirerInput[];
    createMany?: Prisma.AdmireCreateManyAdmirerInputEnvelope;
    set?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    disconnect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    delete?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    connect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    update?: Prisma.AdmireUpdateWithWhereUniqueWithoutAdmirerInput | Prisma.AdmireUpdateWithWhereUniqueWithoutAdmirerInput[];
    updateMany?: Prisma.AdmireUpdateManyWithWhereWithoutAdmirerInput | Prisma.AdmireUpdateManyWithWhereWithoutAdmirerInput[];
    deleteMany?: Prisma.AdmireScalarWhereInput | Prisma.AdmireScalarWhereInput[];
};
export type AdmireUncheckedUpdateManyWithoutAdmiredNestedInput = {
    create?: Prisma.XOR<Prisma.AdmireCreateWithoutAdmiredInput, Prisma.AdmireUncheckedCreateWithoutAdmiredInput> | Prisma.AdmireCreateWithoutAdmiredInput[] | Prisma.AdmireUncheckedCreateWithoutAdmiredInput[];
    connectOrCreate?: Prisma.AdmireCreateOrConnectWithoutAdmiredInput | Prisma.AdmireCreateOrConnectWithoutAdmiredInput[];
    upsert?: Prisma.AdmireUpsertWithWhereUniqueWithoutAdmiredInput | Prisma.AdmireUpsertWithWhereUniqueWithoutAdmiredInput[];
    createMany?: Prisma.AdmireCreateManyAdmiredInputEnvelope;
    set?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    disconnect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    delete?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    connect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    update?: Prisma.AdmireUpdateWithWhereUniqueWithoutAdmiredInput | Prisma.AdmireUpdateWithWhereUniqueWithoutAdmiredInput[];
    updateMany?: Prisma.AdmireUpdateManyWithWhereWithoutAdmiredInput | Prisma.AdmireUpdateManyWithWhereWithoutAdmiredInput[];
    deleteMany?: Prisma.AdmireScalarWhereInput | Prisma.AdmireScalarWhereInput[];
};
export type AdmireUncheckedUpdateManyWithoutAdmirerNestedInput = {
    create?: Prisma.XOR<Prisma.AdmireCreateWithoutAdmirerInput, Prisma.AdmireUncheckedCreateWithoutAdmirerInput> | Prisma.AdmireCreateWithoutAdmirerInput[] | Prisma.AdmireUncheckedCreateWithoutAdmirerInput[];
    connectOrCreate?: Prisma.AdmireCreateOrConnectWithoutAdmirerInput | Prisma.AdmireCreateOrConnectWithoutAdmirerInput[];
    upsert?: Prisma.AdmireUpsertWithWhereUniqueWithoutAdmirerInput | Prisma.AdmireUpsertWithWhereUniqueWithoutAdmirerInput[];
    createMany?: Prisma.AdmireCreateManyAdmirerInputEnvelope;
    set?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    disconnect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    delete?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    connect?: Prisma.AdmireWhereUniqueInput | Prisma.AdmireWhereUniqueInput[];
    update?: Prisma.AdmireUpdateWithWhereUniqueWithoutAdmirerInput | Prisma.AdmireUpdateWithWhereUniqueWithoutAdmirerInput[];
    updateMany?: Prisma.AdmireUpdateManyWithWhereWithoutAdmirerInput | Prisma.AdmireUpdateManyWithWhereWithoutAdmirerInput[];
    deleteMany?: Prisma.AdmireScalarWhereInput | Prisma.AdmireScalarWhereInput[];
};
export type AdmireCreateWithoutAdmiredInput = {
    id?: string;
    isLovers?: boolean;
    createdAt?: Date | string;
    admirer: Prisma.UserCreateNestedOneWithoutAdmiringInput;
};
export type AdmireUncheckedCreateWithoutAdmiredInput = {
    id?: string;
    admirerId: string;
    isLovers?: boolean;
    createdAt?: Date | string;
};
export type AdmireCreateOrConnectWithoutAdmiredInput = {
    where: Prisma.AdmireWhereUniqueInput;
    create: Prisma.XOR<Prisma.AdmireCreateWithoutAdmiredInput, Prisma.AdmireUncheckedCreateWithoutAdmiredInput>;
};
export type AdmireCreateManyAdmiredInputEnvelope = {
    data: Prisma.AdmireCreateManyAdmiredInput | Prisma.AdmireCreateManyAdmiredInput[];
    skipDuplicates?: boolean;
};
export type AdmireCreateWithoutAdmirerInput = {
    id?: string;
    isLovers?: boolean;
    createdAt?: Date | string;
    admired: Prisma.UserCreateNestedOneWithoutAdmirersInput;
};
export type AdmireUncheckedCreateWithoutAdmirerInput = {
    id?: string;
    admiredId: string;
    isLovers?: boolean;
    createdAt?: Date | string;
};
export type AdmireCreateOrConnectWithoutAdmirerInput = {
    where: Prisma.AdmireWhereUniqueInput;
    create: Prisma.XOR<Prisma.AdmireCreateWithoutAdmirerInput, Prisma.AdmireUncheckedCreateWithoutAdmirerInput>;
};
export type AdmireCreateManyAdmirerInputEnvelope = {
    data: Prisma.AdmireCreateManyAdmirerInput | Prisma.AdmireCreateManyAdmirerInput[];
    skipDuplicates?: boolean;
};
export type AdmireUpsertWithWhereUniqueWithoutAdmiredInput = {
    where: Prisma.AdmireWhereUniqueInput;
    update: Prisma.XOR<Prisma.AdmireUpdateWithoutAdmiredInput, Prisma.AdmireUncheckedUpdateWithoutAdmiredInput>;
    create: Prisma.XOR<Prisma.AdmireCreateWithoutAdmiredInput, Prisma.AdmireUncheckedCreateWithoutAdmiredInput>;
};
export type AdmireUpdateWithWhereUniqueWithoutAdmiredInput = {
    where: Prisma.AdmireWhereUniqueInput;
    data: Prisma.XOR<Prisma.AdmireUpdateWithoutAdmiredInput, Prisma.AdmireUncheckedUpdateWithoutAdmiredInput>;
};
export type AdmireUpdateManyWithWhereWithoutAdmiredInput = {
    where: Prisma.AdmireScalarWhereInput;
    data: Prisma.XOR<Prisma.AdmireUpdateManyMutationInput, Prisma.AdmireUncheckedUpdateManyWithoutAdmiredInput>;
};
export type AdmireScalarWhereInput = {
    AND?: Prisma.AdmireScalarWhereInput | Prisma.AdmireScalarWhereInput[];
    OR?: Prisma.AdmireScalarWhereInput[];
    NOT?: Prisma.AdmireScalarWhereInput | Prisma.AdmireScalarWhereInput[];
    id?: Prisma.StringFilter<"Admire"> | string;
    admirerId?: Prisma.StringFilter<"Admire"> | string;
    admiredId?: Prisma.StringFilter<"Admire"> | string;
    isLovers?: Prisma.BoolFilter<"Admire"> | boolean;
    createdAt?: Prisma.DateTimeFilter<"Admire"> | Date | string;
};
export type AdmireUpsertWithWhereUniqueWithoutAdmirerInput = {
    where: Prisma.AdmireWhereUniqueInput;
    update: Prisma.XOR<Prisma.AdmireUpdateWithoutAdmirerInput, Prisma.AdmireUncheckedUpdateWithoutAdmirerInput>;
    create: Prisma.XOR<Prisma.AdmireCreateWithoutAdmirerInput, Prisma.AdmireUncheckedCreateWithoutAdmirerInput>;
};
export type AdmireUpdateWithWhereUniqueWithoutAdmirerInput = {
    where: Prisma.AdmireWhereUniqueInput;
    data: Prisma.XOR<Prisma.AdmireUpdateWithoutAdmirerInput, Prisma.AdmireUncheckedUpdateWithoutAdmirerInput>;
};
export type AdmireUpdateManyWithWhereWithoutAdmirerInput = {
    where: Prisma.AdmireScalarWhereInput;
    data: Prisma.XOR<Prisma.AdmireUpdateManyMutationInput, Prisma.AdmireUncheckedUpdateManyWithoutAdmirerInput>;
};
export type AdmireCreateManyAdmiredInput = {
    id?: string;
    admirerId: string;
    isLovers?: boolean;
    createdAt?: Date | string;
};
export type AdmireCreateManyAdmirerInput = {
    id?: string;
    admiredId: string;
    isLovers?: boolean;
    createdAt?: Date | string;
};
export type AdmireUpdateWithoutAdmiredInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    isLovers?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    admirer?: Prisma.UserUpdateOneRequiredWithoutAdmiringNestedInput;
};
export type AdmireUncheckedUpdateWithoutAdmiredInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    admirerId?: Prisma.StringFieldUpdateOperationsInput | string;
    isLovers?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdmireUncheckedUpdateManyWithoutAdmiredInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    admirerId?: Prisma.StringFieldUpdateOperationsInput | string;
    isLovers?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdmireUpdateWithoutAdmirerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    isLovers?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    admired?: Prisma.UserUpdateOneRequiredWithoutAdmirersNestedInput;
};
export type AdmireUncheckedUpdateWithoutAdmirerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    admiredId?: Prisma.StringFieldUpdateOperationsInput | string;
    isLovers?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdmireUncheckedUpdateManyWithoutAdmirerInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    admiredId?: Prisma.StringFieldUpdateOperationsInput | string;
    isLovers?: Prisma.BoolFieldUpdateOperationsInput | boolean;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type AdmireSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    admirerId?: boolean;
    admiredId?: boolean;
    isLovers?: boolean;
    createdAt?: boolean;
    admirer?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    admired?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["admire"]>;
export type AdmireSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    admirerId?: boolean;
    admiredId?: boolean;
    isLovers?: boolean;
    createdAt?: boolean;
    admirer?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    admired?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["admire"]>;
export type AdmireSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    admirerId?: boolean;
    admiredId?: boolean;
    isLovers?: boolean;
    createdAt?: boolean;
    admirer?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    admired?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["admire"]>;
export type AdmireSelectScalar = {
    id?: boolean;
    admirerId?: boolean;
    admiredId?: boolean;
    isLovers?: boolean;
    createdAt?: boolean;
};
export type AdmireOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "admirerId" | "admiredId" | "isLovers" | "createdAt", ExtArgs["result"]["admire"]>;
export type AdmireInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    admirer?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    admired?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type AdmireIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    admirer?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    admired?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type AdmireIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    admirer?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
    admired?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $AdmirePayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Admire";
    objects: {
        admirer: Prisma.$UserPayload<ExtArgs>;
        admired: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        admirerId: string;
        admiredId: string;
        isLovers: boolean;
        createdAt: Date;
    }, ExtArgs["result"]["admire"]>;
    composites: {};
};
export type AdmireGetPayload<S extends boolean | null | undefined | AdmireDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$AdmirePayload, S>;
export type AdmireCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<AdmireFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: AdmireCountAggregateInputType | true;
};
export interface AdmireDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Admire'];
        meta: {
            name: 'Admire';
        };
    };
    /**
     * Find zero or one Admire that matches the filter.
     * @param {AdmireFindUniqueArgs} args - Arguments to find a Admire
     * @example
     * // Get one Admire
     * const admire = await prisma.admire.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AdmireFindUniqueArgs>(args: Prisma.SelectSubset<T, AdmireFindUniqueArgs<ExtArgs>>): Prisma.Prisma__AdmireClient<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find one Admire that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AdmireFindUniqueOrThrowArgs} args - Arguments to find a Admire
     * @example
     * // Get one Admire
     * const admire = await prisma.admire.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AdmireFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, AdmireFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__AdmireClient<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Admire that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdmireFindFirstArgs} args - Arguments to find a Admire
     * @example
     * // Get one Admire
     * const admire = await prisma.admire.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AdmireFindFirstArgs>(args?: Prisma.SelectSubset<T, AdmireFindFirstArgs<ExtArgs>>): Prisma.Prisma__AdmireClient<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    /**
     * Find the first Admire that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdmireFindFirstOrThrowArgs} args - Arguments to find a Admire
     * @example
     * // Get one Admire
     * const admire = await prisma.admire.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AdmireFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, AdmireFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__AdmireClient<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Find zero or more Admires that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdmireFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Admires
     * const admires = await prisma.admire.findMany()
     *
     * // Get first 10 Admires
     * const admires = await prisma.admire.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const admireWithIdOnly = await prisma.admire.findMany({ select: { id: true } })
     *
     */
    findMany<T extends AdmireFindManyArgs>(args?: Prisma.SelectSubset<T, AdmireFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    /**
     * Create a Admire.
     * @param {AdmireCreateArgs} args - Arguments to create a Admire.
     * @example
     * // Create one Admire
     * const Admire = await prisma.admire.create({
     *   data: {
     *     // ... data to create a Admire
     *   }
     * })
     *
     */
    create<T extends AdmireCreateArgs>(args: Prisma.SelectSubset<T, AdmireCreateArgs<ExtArgs>>): Prisma.Prisma__AdmireClient<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Create many Admires.
     * @param {AdmireCreateManyArgs} args - Arguments to create many Admires.
     * @example
     * // Create many Admires
     * const admire = await prisma.admire.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends AdmireCreateManyArgs>(args?: Prisma.SelectSubset<T, AdmireCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Create many Admires and returns the data saved in the database.
     * @param {AdmireCreateManyAndReturnArgs} args - Arguments to create many Admires.
     * @example
     * // Create many Admires
     * const admire = await prisma.admire.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Admires and only return the `id`
     * const admireWithIdOnly = await prisma.admire.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends AdmireCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, AdmireCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    /**
     * Delete a Admire.
     * @param {AdmireDeleteArgs} args - Arguments to delete one Admire.
     * @example
     * // Delete one Admire
     * const Admire = await prisma.admire.delete({
     *   where: {
     *     // ... filter to delete one Admire
     *   }
     * })
     *
     */
    delete<T extends AdmireDeleteArgs>(args: Prisma.SelectSubset<T, AdmireDeleteArgs<ExtArgs>>): Prisma.Prisma__AdmireClient<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Update one Admire.
     * @param {AdmireUpdateArgs} args - Arguments to update one Admire.
     * @example
     * // Update one Admire
     * const admire = await prisma.admire.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends AdmireUpdateArgs>(args: Prisma.SelectSubset<T, AdmireUpdateArgs<ExtArgs>>): Prisma.Prisma__AdmireClient<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Delete zero or more Admires.
     * @param {AdmireDeleteManyArgs} args - Arguments to filter Admires to delete.
     * @example
     * // Delete a few Admires
     * const { count } = await prisma.admire.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends AdmireDeleteManyArgs>(args?: Prisma.SelectSubset<T, AdmireDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Admires.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdmireUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Admires
     * const admire = await prisma.admire.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends AdmireUpdateManyArgs>(args: Prisma.SelectSubset<T, AdmireUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    /**
     * Update zero or more Admires and returns the data updated in the database.
     * @param {AdmireUpdateManyAndReturnArgs} args - Arguments to update many Admires.
     * @example
     * // Update many Admires
     * const admire = await prisma.admire.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Admires and only return the `id`
     * const admireWithIdOnly = await prisma.admire.updateManyAndReturn({
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
    updateManyAndReturn<T extends AdmireUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, AdmireUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    /**
     * Create or update one Admire.
     * @param {AdmireUpsertArgs} args - Arguments to update or create a Admire.
     * @example
     * // Update or create a Admire
     * const admire = await prisma.admire.upsert({
     *   create: {
     *     // ... data to create a Admire
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Admire we want to update
     *   }
     * })
     */
    upsert<T extends AdmireUpsertArgs>(args: Prisma.SelectSubset<T, AdmireUpsertArgs<ExtArgs>>): Prisma.Prisma__AdmireClient<runtime.Types.Result.GetResult<Prisma.$AdmirePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    /**
     * Count the number of Admires.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdmireCountArgs} args - Arguments to filter Admires to count.
     * @example
     * // Count the number of Admires
     * const count = await prisma.admire.count({
     *   where: {
     *     // ... the filter for the Admires we want to count
     *   }
     * })
    **/
    count<T extends AdmireCountArgs>(args?: Prisma.Subset<T, AdmireCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], AdmireCountAggregateOutputType> : number>;
    /**
     * Allows you to perform aggregations operations on a Admire.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdmireAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends AdmireAggregateArgs>(args: Prisma.Subset<T, AdmireAggregateArgs>): Prisma.PrismaPromise<GetAdmireAggregateType<T>>;
    /**
     * Group by Admire.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdmireGroupByArgs} args - Group by arguments.
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
    groupBy<T extends AdmireGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: AdmireGroupByArgs['orderBy'];
    } : {
        orderBy?: AdmireGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, AdmireGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAdmireGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the Admire model
     */
    readonly fields: AdmireFieldRefs;
}
/**
 * The delegate class that acts as a "Promise-like" for Admire.
 * Why is this prefixed with `Prisma__`?
 * Because we want to prevent naming conflicts as mentioned in
 * https://github.com/prisma/prisma-client-js/issues/707
 */
export interface Prisma__AdmireClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    admirer<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    admired<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
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
 * Fields of the Admire model
 */
export interface AdmireFieldRefs {
    readonly id: Prisma.FieldRef<"Admire", 'String'>;
    readonly admirerId: Prisma.FieldRef<"Admire", 'String'>;
    readonly admiredId: Prisma.FieldRef<"Admire", 'String'>;
    readonly isLovers: Prisma.FieldRef<"Admire", 'Boolean'>;
    readonly createdAt: Prisma.FieldRef<"Admire", 'DateTime'>;
}
/**
 * Admire findUnique
 */
export type AdmireFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireInclude<ExtArgs> | null;
    /**
     * Filter, which Admire to fetch.
     */
    where: Prisma.AdmireWhereUniqueInput;
};
/**
 * Admire findUniqueOrThrow
 */
export type AdmireFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireInclude<ExtArgs> | null;
    /**
     * Filter, which Admire to fetch.
     */
    where: Prisma.AdmireWhereUniqueInput;
};
/**
 * Admire findFirst
 */
export type AdmireFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireInclude<ExtArgs> | null;
    /**
     * Filter, which Admire to fetch.
     */
    where?: Prisma.AdmireWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Admires to fetch.
     */
    orderBy?: Prisma.AdmireOrderByWithRelationInput | Prisma.AdmireOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Admires.
     */
    cursor?: Prisma.AdmireWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Admires from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Admires.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Admires.
     */
    distinct?: Prisma.AdmireScalarFieldEnum | Prisma.AdmireScalarFieldEnum[];
};
/**
 * Admire findFirstOrThrow
 */
export type AdmireFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireInclude<ExtArgs> | null;
    /**
     * Filter, which Admire to fetch.
     */
    where?: Prisma.AdmireWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Admires to fetch.
     */
    orderBy?: Prisma.AdmireOrderByWithRelationInput | Prisma.AdmireOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Admires.
     */
    cursor?: Prisma.AdmireWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Admires from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Admires.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Admires.
     */
    distinct?: Prisma.AdmireScalarFieldEnum | Prisma.AdmireScalarFieldEnum[];
};
/**
 * Admire findMany
 */
export type AdmireFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireInclude<ExtArgs> | null;
    /**
     * Filter, which Admires to fetch.
     */
    where?: Prisma.AdmireWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Admires to fetch.
     */
    orderBy?: Prisma.AdmireOrderByWithRelationInput | Prisma.AdmireOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Admires.
     */
    cursor?: Prisma.AdmireWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Admires from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Admires.
     */
    skip?: number;
    distinct?: Prisma.AdmireScalarFieldEnum | Prisma.AdmireScalarFieldEnum[];
};
/**
 * Admire create
 */
export type AdmireCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireInclude<ExtArgs> | null;
    /**
     * The data needed to create a Admire.
     */
    data: Prisma.XOR<Prisma.AdmireCreateInput, Prisma.AdmireUncheckedCreateInput>;
};
/**
 * Admire createMany
 */
export type AdmireCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to create many Admires.
     */
    data: Prisma.AdmireCreateManyInput | Prisma.AdmireCreateManyInput[];
    skipDuplicates?: boolean;
};
/**
 * Admire createManyAndReturn
 */
export type AdmireCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelectCreateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * The data used to create many Admires.
     */
    data: Prisma.AdmireCreateManyInput | Prisma.AdmireCreateManyInput[];
    skipDuplicates?: boolean;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireIncludeCreateManyAndReturn<ExtArgs> | null;
};
/**
 * Admire update
 */
export type AdmireUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireInclude<ExtArgs> | null;
    /**
     * The data needed to update a Admire.
     */
    data: Prisma.XOR<Prisma.AdmireUpdateInput, Prisma.AdmireUncheckedUpdateInput>;
    /**
     * Choose, which Admire to update.
     */
    where: Prisma.AdmireWhereUniqueInput;
};
/**
 * Admire updateMany
 */
export type AdmireUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * The data used to update Admires.
     */
    data: Prisma.XOR<Prisma.AdmireUpdateManyMutationInput, Prisma.AdmireUncheckedUpdateManyInput>;
    /**
     * Filter which Admires to update
     */
    where?: Prisma.AdmireWhereInput;
    /**
     * Limit how many Admires to update.
     */
    limit?: number;
};
/**
 * Admire updateManyAndReturn
 */
export type AdmireUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelectUpdateManyAndReturn<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * The data used to update Admires.
     */
    data: Prisma.XOR<Prisma.AdmireUpdateManyMutationInput, Prisma.AdmireUncheckedUpdateManyInput>;
    /**
     * Filter which Admires to update
     */
    where?: Prisma.AdmireWhereInput;
    /**
     * Limit how many Admires to update.
     */
    limit?: number;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireIncludeUpdateManyAndReturn<ExtArgs> | null;
};
/**
 * Admire upsert
 */
export type AdmireUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireInclude<ExtArgs> | null;
    /**
     * The filter to search for the Admire to update in case it exists.
     */
    where: Prisma.AdmireWhereUniqueInput;
    /**
     * In case the Admire found by the `where` argument doesn't exist, create a new Admire with this data.
     */
    create: Prisma.XOR<Prisma.AdmireCreateInput, Prisma.AdmireUncheckedCreateInput>;
    /**
     * In case the Admire was found with the provided `where` argument, update it with this data.
     */
    update: Prisma.XOR<Prisma.AdmireUpdateInput, Prisma.AdmireUncheckedUpdateInput>;
};
/**
 * Admire delete
 */
export type AdmireDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireInclude<ExtArgs> | null;
    /**
     * Filter which Admire to delete.
     */
    where: Prisma.AdmireWhereUniqueInput;
};
/**
 * Admire deleteMany
 */
export type AdmireDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Filter which Admires to delete
     */
    where?: Prisma.AdmireWhereInput;
    /**
     * Limit how many Admires to delete.
     */
    limit?: number;
};
/**
 * Admire without action
 */
export type AdmireDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Admire
     */
    select?: Prisma.AdmireSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the Admire
     */
    omit?: Prisma.AdmireOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: Prisma.AdmireInclude<ExtArgs> | null;
};
export {};
//# sourceMappingURL=Admire.d.ts.map