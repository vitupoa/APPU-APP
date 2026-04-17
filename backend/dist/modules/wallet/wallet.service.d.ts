export declare class WalletService {
    /**
     * Retrieves the wallet balance ensuring a wallet exists.
     */
    static getBalance(userId: string, targetCurrency?: string): Promise<{
        krBalance: import("@prisma/client-runtime-utils").Decimal;
        fiatEquivalent: number;
        currency: string;
        isWalletUnlocked: boolean;
    }>;
    /**
     * Transfers a Tip from one user to another atomically parsing explicit Tokenomics (15% platform cut).
     */
    static sendTip(senderId: string, recipientId: string, senderKrAmount: number, senderCurrency: string): Promise<{
        success: boolean;
        krTipped: number;
        krReceived: any;
        platformFee: number;
    }>;
    static getTransactions(userId: string, limit?: number, offset?: number): Promise<{
        status: string;
        type: string;
        id: string;
        createdAt: Date;
        userId: string;
        currency: string | null;
        provider: string | null;
        amountKr: import("@prisma/client-runtime-utils").Decimal;
        amountFiat: import("@prisma/client-runtime-utils").Decimal | null;
        reference: string | null;
        counterpartyId: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
    static searchUsers(query: string): Promise<{
        isLovers: boolean;
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
        isVerified: boolean;
    }[]>;
}
//# sourceMappingURL=wallet.service.d.ts.map