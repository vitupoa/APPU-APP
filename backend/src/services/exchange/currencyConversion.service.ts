import { ExchangeService } from './exchange.service.js';

export class CurrencyConversionService {
  static async convertKrToFiat(krAmount: number, currency: string, type: 'buy' | 'sell' = 'sell'): Promise<number> {
    const baseUsd = ExchangeService.getUSDFromKr(krAmount);
    const rate = await ExchangeService.getTransactionRate(currency, type);
    return baseUsd * rate;
  }

  static async convertFiatToKr(fiatAmount: number, currency: string, type: 'buy' | 'sell' = 'buy'): Promise<number> {
    const rate = await ExchangeService.getTransactionRate(currency, type);
    const baseUsd = fiatAmount / rate;
    return Math.floor(baseUsd * 100);
  }

  static async getDisplayConversion(krAmount: number, currency: string): Promise<number> {
    const baseUsd = ExchangeService.getUSDFromKr(krAmount);
    const displayRate = await ExchangeService.getDisplayRate(currency);
    return baseUsd * displayRate;
  }

  static async getTopupFee(currency: string): Promise<number> {
    return await ExchangeService.getTopupFeeKr(currency);
  }

  static async getWithdrawalFee(currency: string): Promise<number> {
    return await ExchangeService.getWithdrawalFeeKr(currency);
  }
}

export const currencyConversionService = new CurrencyConversionService();
