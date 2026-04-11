export declare class AuthService {
    /**
     * Generates a 6-Digit OTP, maps to Redis with strict 10-minute expiry (600s), and dispatches via AWS SES natively
     */
    static requestEmailOTP(email: string): Promise<{
        message: string;
    }>;
    /**
     * Explodes the OTP upon validation mapping absolute protection organically
     */
    static verifyEmailOTP(email: string, otp: string): Promise<{
        success: boolean;
    }>;
    /**
     * Helper to generate a unique refresh token, hash it, and store it
     */
    private static createRefreshToken;
    /**
     * Generates a username suggestion based on firstName, lastName, or email.
     * Checks database to ensure it's available.
     */
    static suggestUsernames(base: string): Promise<string[]>;
    static register(data: any): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
            displayName: string;
            accountType: import(".prisma/client").$Enums.AccountType;
            isWalletUnlocked: boolean;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    static login(data: any): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
            displayName: string;
            accountType: import(".prisma/client").$Enums.AccountType;
            isWalletUnlocked: boolean;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    static oauthLogin(data: any): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
            displayName: string;
            accountType: import(".prisma/client").$Enums.AccountType;
            isWalletUnlocked: boolean;
        };
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
    }>;
    static refreshToken(data: {
        refreshToken: string;
        deviceId: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    static logout(data: {
        refreshToken: string;
        deviceId: string;
    }): Promise<{
        success: boolean;
    }>;
}
//# sourceMappingURL=auth.service.d.ts.map