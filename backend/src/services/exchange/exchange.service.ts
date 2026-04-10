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
   * Returns rate with Krieta's 4.5% platform margin applied.
   * If user is BUYING Kr (topup), they pay 4.5% more fiat.
   * If user is SELLING Kr (withdraw), they get 4.5% less fiat.
   */
  static async getTransactionRate(localCurrency: string, type: 'buy' | 'sell'): Promise<number> {
    const baseRate = await this.getRate(localCurrency);
    const MARGIN = 0.045; // 4.5%

    if (type === 'buy') {
      return baseRate * (1 + MARGIN);
    } else {
      return baseRate * (1 - MARGIN);
    }
  }
}
