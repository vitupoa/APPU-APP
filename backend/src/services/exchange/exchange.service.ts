import axios from 'axios';
import { env } from '../../config/env.js';

// In-memory cache fallback if Redis isn't fully set up yet
const rateCache = new Map<string, { rate: number; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── PLATFORM FEE CONSTANTS (KES-denominated) ───────────
// These are invisible operational fees baked into exchange math.
const TOPUP_FX_FEE_KES = 20;      // Added to the exchange rate on buy (top-ups)
const DISPLAY_FX_ADJ_KES = 30;    // Subtracted from conversion when showing fiat balance
const WITHDRAWAL_FEE_KES = 1;     // Flat KES deducted from wallet on withdrawal

export class ExchangeService {
  /**
   * Fetches the raw exchange rate from USD → localCurrency.
   * This is the pure market rate with NO platform adjustments.
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
   * Kr 1 = $100.00 USD (Base Peg is Absolute)
   */
  static getKrFromUSD(usdAmount: number): number {
      return usdAmount / 100;
  }

  static getUSDFromKr(krAmount: number): number {
      return krAmount * 100;
  }

  /**
   * Returns rate with Krieta's 4.5% platform margin applied ONLY on BUYS (Topups).
   * Additionally embeds the invisible KES 20 exchange fee on buys.
   * Withdrawals operate entirely free (Margin 0).
   * 
   * @param localCurrency User's local ISO currency (e.g. KES)
   * @param type transaction format (buy or sell)
   * @returns Exchange Rate relative to Fiat
   */
  static async getTransactionRate(localCurrency: string, type: 'buy' | 'sell'): Promise<number> {
    const usdToFiatRate = await this.getRate(localCurrency);
    // 1 Kr = 100 USD
    const krToFiatRate = usdToFiatRate * 100;
    
    if (type === 'buy') {
      const TOPUP_MARGIN = 0.045; // 4.5% Spread explicitly isolated preventing arbitrage 
      const marginApplied = krToFiatRate * (1 + TOPUP_MARGIN);
      // Embed KES 20 fee: Convert KES 20 into the target currency equivalent,
      // then add it to the per-Kr rate so the user pays slightly more per Kr.
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
   * Returns the KES withdrawal fee converted to Kr for silent deduction.
   */
  static async getWithdrawalFeeKr(): Promise<number> {
    const kesRate = await this.getRate('KES');
    // KES 1 in USD, then USD to Kr
    const feeUsd = WITHDRAWAL_FEE_KES / kesRate;
    return this.getKrFromUSD(feeUsd);
  }

  /**
   * Returns the KES 20 topup fee converted to Kr for platform wallet crediting.
   */
  static async getTopupFeeKr(fiatAmount: number, localCurrency: string): Promise<number> {
    const kesRate = await this.getRate('KES');
    const localRate = await this.getRate(localCurrency);
    // Convert fiatAmount to USD, figure out how many Kr were bought
    // The fee portion is the KES 20 equivalent in Kr
    const feeUsd = TOPUP_FX_FEE_KES / kesRate;
    return this.getKrFromUSD(feeUsd);
  }
}
