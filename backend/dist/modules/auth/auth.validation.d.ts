import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    username: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    accountType: z.ZodDefault<z.ZodEnum<["CREATOR", "BUSINESS"]>>;
    country: z.ZodString;
    currency: z.ZodString;
    deviceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    country: string;
    currency: string;
    accountType: "CREATOR" | "BUSINESS";
    deviceId: string;
    password: string;
    phone?: string | undefined;
}, {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    country: string;
    currency: string;
    deviceId: string;
    password: string;
    accountType?: "CREATOR" | "BUSINESS" | undefined;
    phone?: string | undefined;
}>;
export declare const loginSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
    deviceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    deviceId: string;
    password: string;
    email?: string | undefined;
    username?: string | undefined;
    phone?: string | undefined;
}, {
    deviceId: string;
    password: string;
    email?: string | undefined;
    username?: string | undefined;
    phone?: string | undefined;
}>, {
    deviceId: string;
    password: string;
    email?: string | undefined;
    username?: string | undefined;
    phone?: string | undefined;
}, {
    deviceId: string;
    password: string;
    email?: string | undefined;
    username?: string | undefined;
    phone?: string | undefined;
}>;
export declare const oauthSchema: z.ZodObject<{
    provider: z.ZodEnum<["google", "apple"]>;
    token: z.ZodString;
    deviceId: z.ZodString;
    country: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
    accountType: z.ZodOptional<z.ZodEnum<["CREATOR", "BUSINESS"]>>;
    username: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    deviceId: string;
    provider: "google" | "apple";
    token: string;
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    country?: string | undefined;
    currency?: string | undefined;
    accountType?: "CREATOR" | "BUSINESS" | undefined;
}, {
    deviceId: string;
    provider: "google" | "apple";
    token: string;
    username?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    country?: string | undefined;
    currency?: string | undefined;
    accountType?: "CREATOR" | "BUSINESS" | undefined;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
    deviceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
    deviceId: string;
}, {
    refreshToken: string;
    deviceId: string;
}>;
export declare const logoutSchema: z.ZodObject<{
    refreshToken: z.ZodString;
    deviceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
    deviceId: string;
}, {
    refreshToken: string;
    deviceId: string;
}>;
export declare const checkUsernameSchema: z.ZodObject<{
    username: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
}, {
    username: string;
}>;
//# sourceMappingURL=auth.validation.d.ts.map