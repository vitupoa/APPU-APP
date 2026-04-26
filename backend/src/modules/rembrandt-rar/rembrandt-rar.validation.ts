import { z } from 'zod';

// ─── USER MANAGEMENT ──────────────────────────────────────

export const suspendUserSchema = z.object({
  reason: z.string().min(5).max(500),
  type: z.enum(['SUSPENDED', 'BANNED', 'BLOCKED']),
  expiresAt: z.string().datetime().optional(),
});

export const assignRoleSchema = z.object({
  role: z.enum([
    'SUPER_ADMIN', 'CONTENT_MODERATOR', 'FINANCIAL_ADMIN',
    'SUPPORT_ADMIN', 'MARKETING_ADMIN', 'ANALYTICS_ADMIN',
    'SECURITY_ADMIN', 'COMMUNITY_MANAGER'
  ]),
  permissions: z.record(z.boolean()).optional(),
});

export const userNameChangeSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  displayName: z.string().min(2).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
});

// ─── CONTENT MODERATION ───────────────────────────────────

export const moderateContentSchema = z.object({
  action: z.enum(['hide', 'delete', 'approve', 'flag', 'restore']),
  reason: z.string().min(3).max(500).optional(),
});

// ─── FINANCIAL ────────────────────────────────────────────

export const walletTopupSchema = z.object({
  userId: z.string().uuid(),
  amountKr: z.number().int('Amount must be a whole number').positive(),
  reason: z.string().min(3).max(500),
});

export const withdrawalReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});

export const platformWalletActionSchema = z.object({
  amountKr: z.number().int('Amount must be a whole number').positive(),
  action: z.enum(['topup', 'withdraw']),
  reason: z.string().min(3).max(500),
});

export const feeConfigSchema = z.object({
  tipFeePercent: z.number().min(0).max(50).optional(),
  contestFeePercent: z.number().min(0).max(50).optional(),
  shopFeePercent: z.number().min(0).max(50).optional(),
  subscriptionFeePercent: z.number().min(0).max(50).optional(),
  withdrawalFeePercent: z.number().min(0).max(50).optional(),
});

// ─── FEATURE FLAGS ────────────────────────────────────────

export const featureFlagSchema = z.object({
  featureKey: z.string().min(1).max(100),
  isEnabled: z.boolean(),
  scope: z.enum(['GLOBAL', 'CONTINENT', 'COUNTRY', 'REGION', 'CITY', 'USER']),
  scopeValue: z.string().max(200).optional(),
});

export const bulkFeatureFlagSchema = z.object({
  isEnabled: z.boolean(),
  scope: z.enum(['GLOBAL', 'CONTINENT', 'COUNTRY', 'REGION', 'CITY', 'USER']),
  scopeValue: z.string().max(200).optional(),
});

// ─── NAMES ────────────────────────────────────────────────

export const prohibitedNameSchema = z.object({
  name: z.string().min(1).max(100).transform(v => v.toLowerCase()),
  type: z.enum(['username', 'display_name', 'both']),
  reason: z.string().max(500).optional(),
});

export const reservedUsernameSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  reservedFor: z.string().uuid().optional(),
  reason: z.string().max(500).optional(),
});

// ─── ANNOUNCEMENTS ────────────────────────────────────────

export const announcementSchema = z.object({
  title: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
  type: z.enum(['banner', 'push', 'email', 'in_app']),
  targetScope: z.string().max(200).default('all'),
  expiresAt: z.string().datetime().optional(),
});

// ─── PLATFORM CONFIG ──────────────────────────────────────

export const platformConfigSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.any(),
});

// ─── QUERY PARAMS ─────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.string().default('1').transform(Number),
  limit: z.string().default('20').transform(Number),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

export const contentFilterSchema = z.object({
  type: z.enum(['short', 'post', 'contest', 'comment', 'product', 'story']).optional(),
  status: z.string().optional(),
  userId: z.string().uuid().optional(),
});
