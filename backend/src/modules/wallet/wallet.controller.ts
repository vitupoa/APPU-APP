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
      
      // SECURITY: Prevent self-tipping at controller level (defense in depth)
      if (req.userId === data.recipientId) {
        return res.status(400).json({ 
          error: 'You cannot tip yourself',
          code: 'SELF_TIP_NOT_ALLOWED'
        });
      }
      
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
      
      // SECURITY: Get client IP address for audit trail
      const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                        req.socket.remoteAddress || 
                        'unknown';
      
      const result = await WalletService.initiateTopup(
        req.userId!,
        data.fiatAmount,
        data.currency,
        data.provider,
        data.phoneNumber,
        data.email,
        ipAddress
      );
      
      res.status(200).json(result);
    } catch (error: any) {
      console.error('❌ Top-up initiation error:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          success: false,
          error: 'Validation failed', 
          details: error.errors 
        });
      } else {
        res.status(400).json({ 
          success: false,
          error: error.message || 'Failed to initiate top-up'
        });
      }
    }
  }

  static async confirmTopup(req: AuthRequest, res: Response): Promise<void> {
    try {
      // SECURITY: Users should NOT be able to manually confirm top-ups
      // This endpoint should be disabled or heavily restricted
      res.status(403).json({ 
        error: 'Manual confirmation not allowed. Top-ups are confirmed automatically via payment provider webhooks.' 
      });
      return;
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async verifyAccount(req: AuthRequest, res: Response) {
    try {
      const { accountNumber, bankCode, country } = req.body;
      
      if (!accountNumber || !bankCode || !country) {
        res.status(400).json({ 
          success: false,
          error: 'Missing required fields: accountNumber, bankCode, country' 
        });
        return;
      }
      
      const result = await WalletService.verifyAccount(accountNumber, bankCode, country);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  static async getBanks(req: AuthRequest, res: Response) {
    try {
      const country = req.query.country as string || 'KE';
      const result = await WalletService.getBanks(country);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getCountries(req: AuthRequest, res: Response) {
    try {
      const result = await WalletService.getCountries();
      res.status(200).json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
