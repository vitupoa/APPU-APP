export interface JwtPayload {
    userId: string;
    role?: string;
    isWalletUnlocked: boolean;
    isAdmin: boolean;
    deviceId: string;
    accountType: string;
}
export declare const generateAccessToken: (payload: JwtPayload) => string;
export declare const verifyAccessToken: (token: string) => JwtPayload;
//# sourceMappingURL=jwt.d.ts.map