export declare class ExchangeService {
    /**
     * Fetches the exchange rate from a base currency to Kr equivalent (which is usually USD).
     * For Krieta, 1 Kr is technically pegged internally (e.g., to $1),
     * or we convert User Local Fiat -> Base Currency.
     * Assuming 1 Kr = 1 Base Unit (like USD), then rate is basically "How much local fiat for 1 USD".
     */
    static getRate(localCurrency: string): Promise<number>;
    /**
     * Fiat -> KR Conversion engine properly isolating the Tokenomic Pegs
     * 100 Kr = $1.00 USD (Base Peg is Absolute)
     */
    static getKrFromUSD(usdAmount: number): number;
    static getUSDFromKr(krAmount: number): number;
    /**
     * Returns rate with Krieta's 4.5% platform margin applied ONLY on BUYS (Topups).
     * Withdrawals operate entirely free (Margin 0).
     *
     * @param localCurrency User's local ISO currency (e.g. KES)
     * @param type transaction format (buy or sell)
     * @returns Exchange Rate relative to Fiat
     */
    static getTransactionRate(localCurrency: string, type: 'buy' | 'sell'): Promise<number>;
}
//# sourceMappingURL=exchange.service.d.ts.map