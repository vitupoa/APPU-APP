import { WalletService } from './wallet.service.js';
import { ExchangeService } from '../../services/exchange/exchange.service.js';
import { tipSchema, exchangeRateSchema } from './wallet.validation.js';
export class WalletController {
    static async getBalance(req, res) {
        try {
            const targetCurrency = req.query.currency;
            const result = await WalletService.getBalance(req.userId, targetCurrency);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async sendTip(req, res) {
        try {
            const data = tipSchema.parse(req.body);
            const result = await WalletService.sendTip(req.userId, data.recipientId, data.krAmount, data.currency);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: 'Validation failed', details: error.errors });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    }
    static async getTransactions(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            const offset = req.query.offset ? parseInt(req.query.offset) : 0;
            const result = await WalletService.getTransactions(req.userId, limit, offset);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async searchUsers(req, res) {
        try {
            const query = req.query.query || '';
            const result = await WalletService.searchUsers(query);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getExchangeRate(req, res) {
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
        }
        catch (error) {
            if (error.name === 'ZodError') {
                res.status(400).json({ error: 'Validation failed', details: error.errors });
            }
            else {
                res.status(400).json({ error: error.message });
            }
        }
    }
}
//# sourceMappingURL=wallet.controller.js.map