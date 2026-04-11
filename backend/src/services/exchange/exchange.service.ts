import axios from 'axios';
import { env } from '../../config/env';

// In-memory cache fallback if Redis isn't fully set up yet
const rateCache = new Map<string, { rate: number; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class ExchangeService {
  /**
   * Fetches the exchange rate from a base currency to Kr equivalent (which is usually USD).
   * For Krieta, 1 Kr is technically pegged internally (e.g., to $1), 
   * or we convert User Local Fiat -> Base Currency.
   * Assuming 1 Kr = 1 Base Unit (like USD), then rate is basically "How much local fiat for 1 USD".
   */
  static async getRate(localCurrency: string): Promise<number> {
    const currency = localCurrency.toLowerCase();
    
    // Check cache
    const cached = rateCache.get(currency);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.rate;
    }

    try {
      // fawazahmed0 API provides rates relative to USD (base)
      const url = `${env.EXCHANGE_RATE_BASE_URL}/usd.json`;
      const response = await axios.get(url);
      
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
    } catch (error) {
      // Return a stale cached rate if API fails, otherwise throw
      const stale = rateCache.get(currency);
      if (stale) return stale.rate;
      
      throw new Error(`Failed to fetch exchange rate for ${currency}`);
    }
  }

  /**
   * Fiat -> KR Conversion engine properly isolating the Tokenomic Pegs
   * 100 Kr = $1.00 USD (Base Peg is Absolute)
   */
  static getKrFromUSD(usdAmount: number): number {
      return usdAmount * 100;
  }

  static getUSDFromKr(krAmount: number): number {
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
  static async getTransactionRate(localCurrency: string, type: 'buy' | 'sell'): Promise<number> {
    const baseRate = await this.getRate(localCurrency);
    
    if (type === 'buy') {
      const TOPUP_MARGIN = 0.045; // 4.5% Spread explicitly isolated preventing arbitrage 
      return baseRate * (1 + TOPUP_MARGIN);
    } else {
      // 0% Withdrawal Fees
      return baseRate;
    }
  }
}
