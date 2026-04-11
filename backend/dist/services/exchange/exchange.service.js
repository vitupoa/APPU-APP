"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../../config/env");
// In-memory cache fallback if Redis isn't fully set up yet
const rateCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
class ExchangeService {
    /**
     * Fetches the exchange rate from a base currency to Kr equivalent (which is usually USD).
     * For Krieta, 1 Kr is technically pegged internally (e.g., to $1),
     * or we convert User Local Fiat -> Base Currency.
     * Assuming 1 Kr = 1 Base Unit (like USD), then rate is basically "How much local fiat for 1 USD".
     */
    static async getRate(localCurrency) {
        const currency = localCurrency.toLowerCase();
        // Check cache
        const cached = rateCache.get(currency);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.rate;
        }
        try {
            // fawazahmed0 API provides rates relative to USD (base)
            const url = `${env_1.env.EXCHANGE_RATE_BASE_URL}/usd.json`;
            const response = await axios_1.default.get(url);
            const rates = response.data.usd;
            if (!rates || !rates[currency]) {
                throw new Error(`Currency ${currency} not supported`);
            }
            const rawRate = rates[currency];
            // Cache the result
            rateCache.set(currency, {
                rate: rawRate,
                expiresAt: Date.now() + CACHE_TTL
            });
            return rawRate;
        }
        catch (error) {
            // Return a stale cached rate if API fails, otherwise throw
            const stale = rateCache.get(currency);
            if (stale)
                return stale.rate;
            throw new Error(`Failed to fetch exchange rate for ${currency}`);
        }
    }
    /**
     * Fiat -> KR Conversion engine properly isolating the Tokenomic Pegs
     * 100 Kr = $1.00 USD (Base Peg is Absolute)
     */
    static getKrFromUSD(usdAmount) {
        return usdAmount * 100;
    }
    static getUSDFromKr(krAmount) {
        return krAmount / 100;
    }
    /**
     * Returns rate with Krieta's 4.5% platform margin applied ONLY on BUYS (Topups).
     * Withdrawals operate entirely free (Margin 0).
     *
     * @param localCurrency User's local ISO currency (e.g. KES)
     * @param type transaction format (buy or sell)
     * @returns Exchange Rate relative to Fiat
     */
    static async getTransactionRate(localCurrency, type) {
        const baseRate = await this.getRate(localCurrency);
        if (type === 'buy') {
            const TOPUP_MARGIN = 0.045; // 4.5% Spread explicitly isolated preventing arbitrage 
            return baseRate * (1 + TOPUP_MARGIN);
        }
        else {
            // 0% Withdrawal Fees
            return baseRate;
        }
    }
}
exports.ExchangeService = ExchangeService;
//# sourceMappingURL=exchange.service.js.map