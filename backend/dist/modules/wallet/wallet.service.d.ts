import { Prisma } from '@prisma/client';
export declare class WalletService {
    /**
     * Retrieves the wallet balance ensuring a wallet exists.
     */
    static getBalance(userId: string, targetCurrency?: string): Promise<{
        krBalance: Prisma.Decimal;
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
        krReceived: number;
        platformFee: number;
    }>;
    static getTransactions(userId: string, limit?: number, offset?: number): Promise<{
        status: string;
        type: string;
        id: string;
        currency: string | null;
        createdAt: Date;
        userId: string;
        amountKr: Prisma.Decimal;
        amountFiat: Prisma.Decimal | null;
        provider: string | null;
        reference: string | null;
        counterpartyId: string | null;
        metadata: Prisma.JsonValue | null;
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