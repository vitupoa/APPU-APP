import { z } from 'zod';
export declare const topupInitiateSchema: z.ZodObject<{
    fiatAmount: z.ZodNumber;
    currency: z.ZodString;
    provider: z.ZodEnum<["paypal", "paystack", "mpesa"]>;
}, "strip", z.ZodTypeAny, {
    currency: string;
    provider: "paypal" | "paystack" | "mpesa";
    fiatAmount: number;
}, {
    currency: string;
    provider: "paypal" | "paystack" | "mpesa";
    fiatAmount: number;
}>;
export declare const withdrawInitiateSchema: z.ZodObject<{
    fiatAmount: z.ZodNumber;
    currency: z.ZodString;
    provider: z.ZodEnum<["mpesa", "payoneer"]>;
    destinationAccount: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currency: string;
    provider: "mpesa" | "payoneer";
    fiatAmount: number;
    destinationAccount: string;
}, {
    currency: string;
    provider: "mpesa" | "payoneer";
    fiatAmount: number;
    destinationAccount: string;
}>;
export declare const tipSchema: z.ZodObject<{
    recipientId: z.ZodString;
    fiatAmount: z.ZodNumber;
    currency: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currency: string;
    fiatAmount: number;
    recipientId: string;
}, {
    currency: string;
    fiatAmount: number;
    recipientId: string;
}>;
export declare const exchangeRateSchema: z.ZodObject<{
    currency: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    currency?: string | undefined;
}, {
    currency?: string | undefined;
}>;
//# sourceMappingURL=wallet.validation.d.ts.map