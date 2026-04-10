export declare class ExchangeService {
    /**
     * Fetches the exchange rate from a base currency to Kr equivalent (which is usually USD).
     * For Krieta, 1 Kr is technically pegged internally (e.g., to $1),
     * or we convert User Local Fiat -> Base Currency.
     * Assuming 1 Kr = 1 Base Unit (like USD), then rate is basically "How much local fiat for 1 USD".
     */
    static getRate(localCurrency: string): Promise<number>;
    /**
     * Returns rate with Krieta's 4.5% platform margin applied.
     * If user is BUYING Kr (topup), they pay 4.5% more fiat.
     * If user is SELLING Kr (withdraw), they get 4.5% less fiat.
     */
    static getTransactionRate(localCurrency: string, type: 'buy' | 'sell'): Promise<number>;
}
//# sourceMappingURL=exchange.service.d.ts.map