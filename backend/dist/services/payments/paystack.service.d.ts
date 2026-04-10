export declare class PaystackService {
    private static headers;
    /**
     * Initializes a Paystack transaction for top-up.
     * Returns an authorization_url for the user to complete payment.
     */
    static initializeTransaction(params: {
        email: string;
        amount: number;
        currency: string;
        reference: string;
        callbackUrl?: string;
    }): Promise<{
        authorizationUrl: string;
        reference: string;
        accessCode: string;
    }>;
    /**
     * Verifies a Paystack transaction by reference.
     */
    static verifyTransaction(reference: string): Promise<{
        success: boolean;
        amount: number;
        currency: string;
        channel: string;
        paidAt: string;
    }>;
    /**
     * Processes Paystack webhook events.
     */
    static parseWebhook(body: any): {
        event: string;
        reference: string;
        amount: number;
        currency: string;
        status: string;
    };
    /**
     * Verifies Paystack webhook signature.
     */
    static verifyWebhookSignature(body: string, signature: string): boolean;
}
//# sourceMappingURL=paystack.service.d.ts.map