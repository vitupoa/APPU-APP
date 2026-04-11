"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeRateSchema = exports.tipSchema = exports.withdrawInitiateSchema = exports.topupInitiateSchema = void 0;
const zod_1 = require("zod");
exports.topupInitiateSchema = zod_1.z.object({
    fiatAmount: zod_1.z.number().positive('Amount must be positive'),
    currency: zod_1.z.string().length(3),
    provider: zod_1.z.enum(['paypal', 'paystack', 'mpesa']),
    phoneNumber: zod_1.z.string().optional(),
});
exports.withdrawInitiateSchema = zod_1.z.object({
    fiatAmount: zod_1.z.number().positive('Amount must be positive'),
    currency: zod_1.z.string().length(3),
    provider: zod_1.z.enum(['mpesa', 'payoneer']),
    destinationAccount: zod_1.z.string().min(1, 'Destination account details required'),
});
exports.tipSchema = zod_1.z.object({
    recipientId: zod_1.z.string().uuid('Invalid recipient ID'),
    krAmount: zod_1.z.number().int().positive('Tip must be a positive integer'),
    currency: zod_1.z.string().length(3),
});
exports.exchangeRateSchema = zod_1.z.object({
    currency: zod_1.z.string().length(3).optional(), // Defaults to user currency if missing
});
//# sourceMappingURL=wallet.validation.js.map