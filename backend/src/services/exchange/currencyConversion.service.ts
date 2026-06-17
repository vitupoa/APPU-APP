import { ExchangeService } from './exchange.service.js';
import { env } from '../../config/env.js';

export class CurrencyConversionService {
  /**
   * Convert Kr to Fiat currency
   * NEW TOKENOMICS: 1 Kr = 1 KES, 1 USD = 135 KES, therefore 1 Kr = 1/135 USD
   */
  static async convertKrToFiat(krAmount: number, currency: string, type: 'buy' | 'sell' = 'sell'): Promise<number> {
    const baseUsd = ExchangeService.getUSDFromKr(krAmount); // Kr / 135
    const rate = await ExchangeService.getRate(currency); // USD to target fiat
    return baseUsd * rate;
  }

  /**
   * Convert Fiat currency to Kr
   * NEW TOKENOMICS: 1 Kr = 1 KES, 1 USD = 135 KES, therefore 1 Kr = 1/135 USD
   */
  static async convertFiatToKr(fiatAmount: number, currency: string, type: 'buy' | 'sell' = 'buy'): Promise<number> {
    const rate = await ExchangeService.getRate(currency); // USD to fiat rate
    const baseUsd = fiatAmount / rate; // Convert fiat to USD
    // Convert USD to Kr: 1 USD = 135 Kr
    return Math.floor(ExchangeService.getKrFromUSD(baseUsd));
  }

  /**
   * Get display conversion (no margins applied)
   * NEW TOKENOMICS: 1 Kr = 1 KES, 1 USD = 135 KES
   */
  static async getDisplayConversion(krAmount: number, currency: string): Promise<number> {
    const baseUsd = ExchangeService.getUSDFromKr(krAmount); // Kr / 135
    const displayRate = await ExchangeService.getDisplayRate(currency);
    return baseUsd * displayRate;
  }

  static async getTopupFee(fiatAmount: number, currency: string): Promise<number> {
    return await ExchangeService.getTopupFeeKr(fiatAmount, currency);
  }

  static async getWithdrawalFee(): Promise<number> {
    return await ExchangeService.getWithdrawalFeeKr();
  }
}

export const currencyConversionService = new CurrencyConversionService();