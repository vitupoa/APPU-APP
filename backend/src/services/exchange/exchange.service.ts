import axios from 'axios';
import { env } from '../../config/env.js';
import { pubClient as redis } from '../../shared/gateway/redis.js';

// In-memory cache fallback if Redis isn't available
const rateCache = new Map<string, { rate: number; expiresAt: number }>();
const CACHE_TTL_SECONDS = 3600; // 1 hour (as per requirements)
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

// ─── PLATFORM FEE CONSTANTS (KES-denominated) ───────────
// These are invisible operational fees baked into exchange math.
const TOPUP_FX_FEE_KES = 20;      // Added to the exchange rate on buy (top-ups)
const DISPLAY_FX_ADJ_KES = 30;    // Subtracted from conversion when showing fiat balance
const WITHDRAWAL_FEE_KES = 1;     // Flat KES deducted from wallet on withdrawal

export class ExchangeService {
  /**
   * Fetches the raw exchange rate from USD → localCurrency.
   * This is the pure market rate with NO platform adjustments.
   * 
   * Caches exchange rates in Redis for 1 hour (3600 seconds).
   * Falls back to in-memory cache if Redis is unavailable.
   * Supports multiple fiat currencies (USD, KES, EUR, GBP, etc.)
   * Handles API failures gracefully with cached fallback.
   * 
   * Requirements: 2.1.2
   */
  static async getRate(localCurrency: string): Promise<number> {
    const currency = localCurrency.toLowerCase();
    const cacheKey = `exchange_rate:usd:${currency}`;
    
    try {
      // Try Redis cache first
      const cachedRate = await redis.get(cacheKey);
      if (cachedRate) {
        return parseFloat(cachedRate);
      }
    } catch (redisError) {
      console.warn('[ExchangeService] Redis unavailable, checking in-memory cache:', redisError);
      
      // Fallback to in-memory cache
      const cached = rateCache.get(currency);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.rate;
      }
    }

    try {
      // Fetch from fawazahmed0 API
      const url = `${env.EXCHANGE_RATE_BASE_URL}/usd.json`;
      const response = await axios.get(url, { timeout: 5000 });
      
      const rates = response.data.usd;
      if (!rates || !rates[currency]) {
        throw new Error(`Currency ${currency} not supported`);
      }

      const rawRate = rates[currency];
      
      // Cache in Redis with 1 hour TTL
      try {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, rawRate.toString());
      } catch (redisError) {
        console.warn('[ExchangeService] Failed to cache in Redis:', redisError);
        
        // Fallback to in-memory cache
        rateCache.set(currency, {
          rate: rawRate,
          expiresAt: Date.now() + CACHE_TTL_MS
        });
      }

      return rawRate;
    } catch (error) {
      console.error('[ExchangeService] Failed to fetch exchange rate:', error);
      
      // Try Redis cache even if expired (stale data better than no data)
      try {
        const staleRedisRate = await redis.get(cacheKey);
        if (staleRedisRate) {
          console.warn('[ExchangeService] Using stale Redis cache for', currency);
          return parseFloat(staleRedisRate);
        }
      } catch (redisError) {
        // Ignore Redis errors, try in-memory cache
      }
      
      // Try in-memory cache even if expired
      const stale = rateCache.get(currency);
      if (stale) {
        console.warn('[ExchangeService] Using stale in-memory cache for', currency);
        return stale.rate;
      }
      
      throw new Error(`Failed to fetch exchange rate for ${currency} and no cached data available`);
    }
  }

  /**
   * Alias for getRate() to match task requirements naming.
   * Fetches real-time exchange rates with Redis caching (1 hour TTL).
   * 
   * @param localCurrency ISO currency code (e.g., USD, KES, EUR, GBP)
   * @returns Exchange rate from USD to localCurrency
   */
  static async getExchangeRate(localCurrency: string): Promise<number> {
    return this.getRate(localCurrency);
  }

  /**
   * Fiat -> KR Conversion engine properly isolating the Tokenomic Pegs
   * NEW TOKENOMICS:
   * 1 Rc = 1 KES (Base Peg)
   * 1 USD = 135 KES
   * Therefore: 1 Rc = 1/135 USD = 0.00740740741 USD
   * 
   * RC_TO_USD_RATE = 1/135 = 0.00740740741
   */
  static getKrFromUSD(usdAmount: number): number {
      return usdAmount * 135; // 1 USD = 135 Rc
  }

  static getUSDFromKr(krAmount: number): number {
      return krAmount / 135; // 1 Rc = 1/135 USD
  }

  /**
   * Returns rate with Runinga's 4.5% platform margin applied ONLY on BUYS (Topups).
   * Additionally embeds the invisible KES 20 exchange fee on buys.
   * Withdrawals operate entirely free (Margin 0).
   * 
   * NEW TOKENOMICS: 1 Rc = 1 KES, 1 Rc = 1/135 USD
   * 
   * @param localCurrency User's local ISO currency (e.g. KES)
   * @param type transaction format (buy or sell)
   * @returns Exchange Rate relative to Fiat
   */
  static async getTransactionRate(localCurrency: string, type: 'buy' | 'sell'): Promise<number> {
    const usdToFiatRate = await this.getRate(localCurrency);
    // 1 Rc = 1 KES, and we need Rc to any fiat
    // First convert Rc to USD: 1 Rc = 1/135 USD
    // Then convert USD to target fiat: USD * usdToFiatRate
    // Combined: (1/135) * usdToFiatRate
    const krToFiatRate = usdToFiatRate / 135;
    
    if (type === 'buy') {
      const TOPUP_MARGIN = 0.045; // 4.5% Spread explicitly isolated preventing arbitrage 
      const marginApplied = krToFiatRate * (1 + TOPUP_MARGIN);
      // Embed KES 20 fee: Convert KES 20 into the target currency equivalent,
      // then add it to the per-Rc rate so the user pays slightly more per Rc.
      const kesRate = await this.getRate('KES');
      const feeInTargetCurrency = (TOPUP_FX_FEE_KES / kesRate) * usdToFiatRate;
      return marginApplied + feeInTargetCurrency;
    } else {
      // 0% Withdrawal Fees (visible)
      return krToFiatRate;
    }
  }

  /**
   * Returns the fiat display rate with a silent KES 30 downward adjustment.
   * This makes the displayed fiat equivalent slightly lower than the real value.
   * Used ONLY for balance display, never for actual transactions.
   */
  static async getDisplayRate(localCurrency: string): Promise<number> {
    const usdToFiatRate = await this.getRate(localCurrency);
    // Convert the KES 30 adjustment into the user's local currency
    const kesRate = await this.getRate('KES');
    const adjustmentInLocal = (DISPLAY_FX_ADJ_KES / kesRate) * usdToFiatRate;
    // Subtract from the raw rate so displayed fiat equivalent is lower
    return Math.max(usdToFiatRate - adjustmentInLocal, usdToFiatRate * 0.5);
  }

  /**
   * Returns the KES withdrawal fee converted to Rc for silent deduction.
   */
  static async getWithdrawalFeeKr(): Promise<number> {
    const kesRate = await this.getRate('KES');
    // KES 1 in USD, then USD to Rc
    const feeUsd = WITHDRAWAL_FEE_KES / kesRate;
    return this.getKrFromUSD(feeUsd);
  }

  /**
   * Returns the KES 20 topup fee converted to Rc for platform wallet crediting.
   */
  static async getTopupFeeKr(fiatAmount: number, localCurrency: string): Promise<number> {
    const kesRate = await this.getRate('KES');
    const localRate = await this.getRate(localCurrency);
    // Convert fiatAmount to USD, figure out how many Rc were bought
    // The fee portion is the KES 20 equivalent in Rc
    const feeUsd = TOPUP_FX_FEE_KES / kesRate;
    return this.getKrFromUSD(feeUsd);
  }
}
