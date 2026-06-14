import { ExchangeService } from './exchange.service.js';
import { env } from '../../config/env.js';

export class CurrencyConversionService {
  static async convertKrToFiat(krAmount: number, currency: string, type: 'buy' | 'sell' = 'sell'): Promise<number> {
    const baseUsd = ExchangeService.getUSDFromKr(krAmount);
    const rate = await ExchangeService.getTransactionRate(currency, type);
    return baseUsd * rate;
  }

  static async convertFiatToKr(fiatAmount: number, currency: string, type: 'buy' | 'sell' = 'buy'): Promise<number> {
    const rate = await ExchangeService.getTransactionRate(currency, type);
    const baseUsd = fiatAmount / rate;
    // Convert USD to Kr using the configured rate: 1 USD = 100 Kr (since KR_TO_USD_RATE = 0.01)
    return Math.floor(baseUsd / env.KR_TO_USD_RATE);
  }

  static async getDisplayConversion(krAmount: number, currency: string): Promise<number> {
    const baseUsd = ExchangeService.getUSDFromKr(krAmount);
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
