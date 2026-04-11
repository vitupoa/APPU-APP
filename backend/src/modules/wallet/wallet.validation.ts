import { z } from 'zod';

export const topupInitiateSchema = z.object({
  fiatAmount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3),
  provider: z.enum(['paypal', 'paystack', 'mpesa']),
  phoneNumber: z.string().optional(),
});

export const withdrawInitiateSchema = z.object({
  fiatAmount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3),
  provider: z.enum(['mpesa', 'payoneer']),
  destinationAccount: z.string().min(1, 'Destination account details required'),
});

export const tipSchema = z.object({
  recipientId: z.string().uuid('Invalid recipient ID'),
  krAmount: z.number().int().positive('Tip must be a positive integer'),
  currency: z.string().length(3),
});

export const exchangeRateSchema = z.object({
  currency: z.string().length(3).optional(), // Defaults to user currency if missing
});
