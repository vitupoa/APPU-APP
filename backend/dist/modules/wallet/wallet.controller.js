"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const wallet_service_1 = require("./wallet.service");
const exchange_service_1 = require("../../services/exchange/exchange.service");
const wallet_validation_1 = require("./wallet.validation");
class WalletController {
    static async getBalance(req, res) {
        try {
            const result = await wallet_service_1.WalletService.getBalance(req.userId);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async sendTip(req, res) {
        try {
            const data = wallet_validation_1.tipSchema.parse(req.body);
            const result = await wallet_service_1.WalletService.sendTip(req.userId, data.recipientId, data.fiatAmount, data.currency);
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
            const result = await wallet_service_1.WalletService.getTransactions(req.userId, limit, offset);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getExchangeRate(req, res) {
        try {
            const data = wallet_validation_1.exchangeRateSchema.parse(req.query);
            const currency = data.currency || 'USD';
            const rate = await exchange_service_1.ExchangeService.getRate(currency);
            const buyRate = await exchange_service_1.ExchangeService.getTransactionRate(currency, 'buy');
            const sellRate = await exchange_service_1.ExchangeService.getTransactionRate(currency, 'sell');
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
exports.WalletController = WalletController;
//# sourceMappingURL=wallet.controller.js.map