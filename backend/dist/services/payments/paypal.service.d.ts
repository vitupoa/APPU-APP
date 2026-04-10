export declare class PaypalService {
    private static getAccessToken;
    /**
     * Creates a PayPal order for top-up.
     * Frontend captures with PayPal SDK, then calls our confirm endpoint.
     */
    static createOrder(params: {
        amount: number;
        currency: string;
        description: string;
        referenceId: string;
    }): Promise<{
        orderId: string;
        approvalUrl: string;
    }>;
    /**
     * Captures (finalizes) a PayPal order after user approves.
     */
    static captureOrder(orderId: string): Promise<{
        success: boolean;
        captureId: string;
        amount: number;
        currency: string;
    }>;
}
//# sourceMappingURL=paypal.service.d.ts.map