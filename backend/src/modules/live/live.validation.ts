import { z } from 'zod';

export const startLiveSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['NORMAL', 'CHAMA', 'CONTEST_BATTLE', 'PROOF_OF_TASK', 'COMMERCE']).default('NORMAL'),
  chamaId: z.string().uuid().optional(),
  contestId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  isCoHostEnabled: z.boolean().default(false),
  maxCoHosts: z.number().int().min(1).max(4).default(1),
  scheduledStart: z.string().datetime().optional(),
});

export const liveTipSchema = z.object({
  recipientId: z.string().uuid(),
  amountKr: z.number().int().positive('Tip must be a positive integer'),
  giftType: z.string().optional(),
  message: z.string().max(200).optional(),
});

export const liveMessageSchema = z.object({
  text: z.string().min(1).max(500),
});

export const pinProductSchema = z.object({
  productId: z.string().uuid(),
  salePrice: z.number().positive().optional(),
});

export const giftGoalSchema = z.object({
  title: z.string().min(1).max(100),
  targetKr: z.number().int().positive(),
});

export const battleSchema = z.object({
  opponentStreamId: z.string().uuid(),
  contestId: z.string().uuid().optional(),
  durationSecs: z.number().int().min(60).max(600).default(300),
});

export const banViewerSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().max(200).optional(),
});

export const likeSchema = z.object({
  count: z.number().int().min(1).max(50).default(1),
});
