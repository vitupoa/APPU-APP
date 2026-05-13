import { z } from 'zod';

export const createChamaSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['ROTATING', 'INVESTMENT', 'WELFARE', 'HYBRID']),
  description: z.string().optional(),
  reason: z.string().optional(),
  maxMembers: z.number().int().min(2).optional(),
  autoLockOnFull: z.boolean().optional(),
  contributionAmountKr: z.number().positive(),
  contributionFrequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ONE_OFF']),
  membershipFeeKr: z.number().positive().optional(),
  lockPeriodDays: z.number().int().min(0).optional(),
  penaltyAmountKr: z.number().positive().optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
  minApprovals: z.number().int().min(2).optional(),
  allowMidTermVoteOut: z.boolean().optional(),
});

export const updateChamaSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  avatar_url: z.string().url().optional(),
  maxMembers: z.number().int().min(2).optional(),
  isLocked: z.boolean().optional(),
  autoLockOnFull: z.boolean().optional(),
  penaltyAmountKr: z.number().positive().optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
  min_approvals: z.number().int().min(2).optional(),
  allowMidTermVoteOut: z.boolean().optional(),
  status: z.enum(['SETUP', 'ACTIVE', 'PAUSED', 'COMPLETED', 'DISSOLVED']).optional(),
});

export const joinChamaSchema = z.object({}).optional();

export const removeMemberSchema = z.object({
  reason: z.string().min(1),
});

export const contributeSchema = z.object({
  amount_kr: z.number().positive(),
});

export const requestPayoutSchema = z.object({
  recipientUserId: z.string().uuid(),
  amount_kr: z.number().positive(),
  cycle_id: z.string().uuid().optional(),
});

export const approvePayoutSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  reason: z.string().optional(),
});
