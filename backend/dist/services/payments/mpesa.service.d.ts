export declare class MpesaService {
    private static getAccessToken;
    private static generatePassword;
    /**
     * Initiates an STK Push (Lipa Na M-Pesa Online).
     * User gets a prompt on their phone to enter PIN.
     */
    static initiateStk(params: {
        phoneNumber: string;
        amount: number;
        accountReference: string;
        transactionDesc: string;
    }): Promise<{
        checkoutRequestId: string;
        merchantRequestId: string;
    }>;
    /**
     * Queries the status of an STK Push transaction.
     */
    static queryStatus(checkoutRequestId: string): Promise<{
        resultCode: string;
        resultDesc: string;
    }>;
    /**
     * Processes the M-Pesa callback from Safaricom.
     * Called when user completes or cancels the STK Push.
     */
    static parseCallback(body: any): {
        success: boolean;
        checkoutRequestId: string;
        amount?: number;
        mpesaReceiptNumber?: string;
        phoneNumber?: string;
    };
}
//# sourceMappingURL=mpesa.service.d.ts.map