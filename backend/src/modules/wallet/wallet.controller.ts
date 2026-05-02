import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.js';
import { WalletService } from './wallet.service.js';
import { ExchangeService } from '../../services/exchange/exchange.service.js';
import { tipSchema, exchangeRateSchema, topupInitiateSchema } from './wallet.validation.js';

export class WalletController {
  static async getBalance(req: AuthRequest, res: Response) {
    try {
      const targetCurrency = req.query.currency as string;
      const result = await WalletService.getBalance(req.userId!, targetCurrency);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async sendTip(req: AuthRequest, res: Response) {
    try {
      const data = tipSchema.parse(req.body);
      
      const result = await WalletService.sendTip(
        req.userId!, 
        data.recipientId, 
        data.krAmount, 
        data.currency
      );
      
      res.status(200).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  static async getTransactions(req: AuthRequest, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const result = await WalletService.getTransactions(req.userId!, limit, offset);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async searchUsers(req: AuthRequest, res: Response) {
    try {
      const query = req.query.query as string || '';
      const result = await WalletService.searchUsers(query);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getExchangeRate(req: AuthRequest, res: Response) {
    try {
      const data = exchangeRateSchema.parse(req.query);
      const currency = data.currency || 'USD';
      
      const rate = await ExchangeService.getRate(currency);
      const buyRate = await ExchangeService.getTransactionRate(currency, 'buy');
      const sellRate = await ExchangeService.getTransactionRate(currency, 'sell');

      res.status(200).json({
        currency,
        baseRate: rate,
        buyRate,
        sellRate,
        margin: '4.5%'
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  static async initiateTopup(req: AuthRequest, res: Response) {
    try {
      const data = topupInitiateSchema.parse(req.body);
      
      const result = await WalletService.initiateTopup(
        req.userId!,
        data.fiatAmount,
        data.currency,
        data.provider,
        data.phoneNumber,
        data.email
      );
      
      res.status(200).json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  static async confirmTopup(req: AuthRequest, res: Response) {
    try {
      const { transactionId, reference } = req.body;
      
      if (!transactionId) {
        return res.status(400).json({ error: 'Transaction ID required' });
      }
      
      const result = await WalletService.confirmTopup(req.userId!, transactionId, reference);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
