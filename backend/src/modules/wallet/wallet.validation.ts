import { z } from 'zod';

export const topupInitiateSchema = z.object({
  fiatAmount: z.number().int('Amount must be a whole number').positive('Amount must be positive'),
  currency: z.string().length(3),
  provider: z.enum(['paypal', 'paystack', 'mpesa']),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
});

export const withdrawInitiateSchema = z.object({
  krAmount: z.number().positive('Amount must be positive'),
  fiatAmount: z.number().int('Amount must be a whole number').positive('Amount must be positive'),
  currency: z.string().length(3),
  provider: z.enum(['mpesa', 'payoneer', 'paypal', 'paystack']),
  destinationAccount: z.string().min(1, 'Destination account details required'),
  phoneNumber: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  accountNumber: z.string().optional(),
  bankCode: z.string().optional(),
  accountName: z.string().optional(),
  country: z.string().optional(),
});

export const tipSchema = z.object({
  recipient_id: z.string().uuid('Invalid recipient ID'),
  krAmount: z.number().int('Amount must be a whole number').positive('Tip must be a positive integer'),
  currency: z.string().length(3),
  // MITM protection fields
  signature: z.string().min(1, 'Transaction signature required'),
  timestamp: z.number().int().positive('Timestamp required'),
  nonce: z.string().min(1, 'Nonce required'),
});

export const exchangeRateSchema = z.object({
  currency: z.string().length(3).optional(), // Defaults to user currency if missing
});
