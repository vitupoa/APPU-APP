"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const exchange_service_1 = require("../../services/exchange/exchange.service");
const mpesa_service_1 = require("../../services/payments/mpesa.service");
const paypal_service_1 = require("../../services/payments/paypal.service");
const paystack_service_1 = require("../../services/payments/paystack.service");
const wallet_validation_1 = require("../wallet/wallet.validation");
const database_1 = require("../../config/database");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
/**
 * POST /api/v1/payments/topup
 * Initiates a top-up via user's chosen provider.
 */
router.post('/topup', auth_1.authMiddleware, async (req, res) => {
    try {
        const data = wallet_validation_1.topupInitiateSchema.parse(req.body);
        const userId = req.userId;
        const reference = `topup_${userId}_${Date.now()}`;
        let result;
        switch (data.provider) {
            case 'mpesa': {
                // Fetch user phone for STK Push
                const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
                if (!user?.phone) {
                    res.status(400).json({ error: 'Phone number required for M-Pesa' });
                    return;
                }
                result = await mpesa_service_1.MpesaService.initiateStk({
                    phoneNumber: user.phone,
                    amount: data.fiatAmount,
                    accountReference: reference,
                    transactionDesc: 'Krieta Wallet Top-Up'
                });
                break;
            }
            case 'paypal': {
                result = await paypal_service_1.PaypalService.createOrder({
                    amount: data.fiatAmount,
                    currency: data.currency,
                    description: 'Krieta Wallet Top-Up',
                    referenceId: reference
                });
                break;
            }
            case 'paystack': {
                const user = await database_1.prisma.user.findUnique({ where: { id: userId } });
                if (!user?.email) {
                    res.status(400).json({ error: 'Email required for Paystack' });
                    return;
                }
                result = await paystack_service_1.PaystackService.initializeTransaction({
                    email: user.email,
                    amount: data.fiatAmount,
                    currency: data.currency,
                    reference
                });
                break;
            }
        }
        // Record pending transaction
        await database_1.prisma.transaction.create({
            data: {
                userId,
                type: 'topup',
                amountFiat: data.fiatAmount,
                amountKr: new client_1.Prisma.Decimal(0), // Calculated on confirmation
                currency: data.currency,
                status: 'pending',
                provider: data.provider,
                reference
            }
        });
        res.status(200).json({ reference, ...result });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        else {
            res.status(500).json({ error: error.message });
        }
    }
});
/**
 * POST /api/v1/payments/mpesa/callback
 * Safaricom calls this after STK Push completes.
 */
router.post('/mpesa/callback', async (req, res) => {
    try {
        const parsed = mpesa_service_1.MpesaService.parseCallback(req.body);
        // Find the pending transaction
        const tx = await database_1.prisma.transaction.findFirst({
            where: {
                provider: 'mpesa',
                status: 'pending',
                // M-Pesa doesn't give us our reference back in callback,
                // so we match by the most recent pending mpesa tx
            },
            orderBy: { createdAt: 'desc' }
        });
        if (!tx) {
            res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
            return;
        }
        if (parsed.success && parsed.amount) {
            const rate = await exchange_service_1.ExchangeService.getTransactionRate('KES', 'buy');
            const krAmount = new client_1.Prisma.Decimal(parsed.amount / rate);
            await database_1.prisma.$transaction(async (dbTx) => {
                await dbTx.transaction.update({
                    where: { id: tx.id },
                    data: {
                        status: 'completed',
                        amountKr: krAmount,
                        reference: parsed.mpesaReceiptNumber || tx.reference
                    }
                });
                await dbTx.wallet.upsert({
                    where: { userId: tx.userId },
                    create: { userId: tx.userId, krBalance: krAmount },
                    update: { krBalance: { increment: krAmount } }
                });
                // Unlock wallet identity on first inflow
                await dbTx.user.update({
                    where: { id: tx.userId },
                    data: { isWalletUnlocked: true }
                });
            });
        }
        else {
            await database_1.prisma.transaction.update({
                where: { id: tx.id },
                data: { status: 'failed' }
            });
        }
        // Always return success to Safaricom
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
    catch (error) {
        console.error('M-Pesa callback error:', error.message);
        res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
});
/**
 * POST /api/v1/payments/paypal/capture
 * Frontend calls after user approves PayPal order.
 */
router.post('/paypal/capture', auth_1.authMiddleware, async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            res.status(400).json({ error: 'orderId is required' });
            return;
        }
        const capture = await paypal_service_1.PaypalService.captureOrder(orderId);
        if (capture.success) {
            const rate = await exchange_service_1.ExchangeService.getTransactionRate(capture.currency, 'buy');
            const krAmount = new client_1.Prisma.Decimal(capture.amount / rate);
            await database_1.prisma.$transaction(async (dbTx) => {
                // Find pending tx
                const tx = await dbTx.transaction.findFirst({
                    where: { userId: req.userId, provider: 'paypal', status: 'pending' },
                    orderBy: { createdAt: 'desc' }
                });
                if (tx) {
                    await dbTx.transaction.update({
                        where: { id: tx.id },
                        data: {
                            status: 'completed',
                            amountKr: krAmount,
                            reference: capture.captureId
                        }
                    });
                }
                await dbTx.wallet.upsert({
                    where: { userId: req.userId },
                    create: { userId: req.userId, krBalance: krAmount },
                    update: { krBalance: { increment: krAmount } }
                });
                await dbTx.user.update({
                    where: { id: req.userId },
                    data: { isWalletUnlocked: true }
                });
            });
            res.status(200).json({ success: true, krAmount });
        }
        else {
            res.status(400).json({ error: 'PayPal capture failed' });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
/**
 * POST /api/v1/payments/paystack/webhook
 * Paystack calls this on payment events.
 */
router.post('/paystack/webhook', async (req, res) => {
    try {
        // Verify signature
        const signature = req.headers['x-paystack-signature'];
        const rawBody = JSON.stringify(req.body);
        if (!paystack_service_1.PaystackService.verifyWebhookSignature(rawBody, signature)) {
            res.status(401).json({ error: 'Invalid signature' });
            return;
        }
        const parsed = paystack_service_1.PaystackService.parseWebhook(req.body);
        if (parsed.event === 'charge.success') {
            const tx = await database_1.prisma.transaction.findFirst({
                where: { reference: parsed.reference, status: 'pending' }
            });
            if (tx) {
                const rate = await exchange_service_1.ExchangeService.getTransactionRate(parsed.currency, 'buy');
                const krAmount = new client_1.Prisma.Decimal(parsed.amount / rate);
                await database_1.prisma.$transaction(async (dbTx) => {
                    await dbTx.transaction.update({
                        where: { id: tx.id },
                        data: { status: 'completed', amountKr: krAmount }
                    });
                    await dbTx.wallet.upsert({
                        where: { userId: tx.userId },
                        create: { userId: tx.userId, krBalance: krAmount },
                        update: { krBalance: { increment: krAmount } }
                    });
                    await dbTx.user.update({
                        where: { id: tx.userId },
                        data: { isWalletUnlocked: true }
                    });
                });
            }
        }
        res.status(200).json({ status: 'ok' });
    }
    catch (error) {
        console.error('Paystack webhook error:', error.message);
        res.status(200).json({ status: 'ok' });
    }
});
exports.default = router;
//# sourceMappingURL=payment.routes.js.map