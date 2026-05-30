import { Router, Response } from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import {
  requireRarAccess, requirePermission, requireSuperAdmin, RarRequest
} from '../../middleware/rembrandtRar.js';
import { UserManagementService } from './services/user-management.service.js';
import { ContentModerationService } from './services/content-moderation.service.js';
import { FinancialService } from './services/financial.service.js';
import { FeatureFlagService } from './services/feature-flags.service.js';
import { AnalyticsService } from './services/analytics.service.js';
import { AuditService } from './services/audit.service.js';
import {
  suspendUserSchema, assignRoleSchema, userNameChangeSchema,
  moderateContentSchema, walletTopupSchema, withdrawalReviewSchema,
  platformWalletActionSchema, feeConfigSchema,
  featureFlagSchema, bulkFeatureFlagSchema,
  prohibitedNameSchema, reservedUsernameSchema,
  announcementSchema, platformConfigSchema, paginationSchema,
} from './rembrandt-rar.validation.js';
import { prisma } from '../../config/database.js';
import analyticsRoutes from './analytics.routes.js';
import complianceRoutes from './compliance.routes.js';


// Helper to safely extract string from query parameter
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}
const router = Router();

// All RAR routes require auth + active admin profile
router.use(authMiddleware as any);
router.use(requireRarAccess as any);

// ═══════════════════════════════════════════════════════════
// ANALYTICS DASHBOARD (NEW)
// ═══════════════════════════════════════════════════════════
router.use('/analytics', analyticsRoutes);

// ═══════════════════════════════════════════════════════════
// COMPLIANCE DASHBOARD (NEW)
// ═══════════════════════════════════════════════════════════
router.use('/compliance', complianceRoutes);

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════

router.get('/dashboard', requirePermission('analytics.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const overview = await AnalyticsService.getDashboardOverview();
    res.json(overview); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.get('/dashboard/user-growth', requirePermission('analytics.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    res.json(await AnalyticsService.getUserGrowthChart(days)); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.get('/dashboard/revenue', requirePermission('analytics.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    res.json(await AnalyticsService.getRevenueChart(days)); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.get('/dashboard/content-stats', requirePermission('analytics.view') as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await AnalyticsService.getContentStats()); return; }
  catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.get('/dashboard/top-creators', requirePermission('analytics.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    res.json(await AnalyticsService.getTopCreators(limit)); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

// ═══════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════

router.get('/users', requirePermission('users.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit, search, sort, order } = paginationSchema.parse(req.query);
    const accountType = req.query.account_type as string | undefined;
    const isSuspended = req.query.isSuspended === 'true' ? true : req.query.isSuspended === 'false' ? false : undefined;
    res.json(await UserManagementService.listUsers({ page, limit, search, sort, order, accountType, isSuspended })); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.get('/users/:id', requirePermission('users.view') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.getUserDetail(req.params.id as string)); return; }
  catch (e: any) { res.status(404).json({ error: e.message }); return; }
});

router.post('/users/:id/suspend', requirePermission('users.suspend') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = suspendUserSchema.parse(req.body);
    res.json(await UserManagementService.suspendUser(req.user_id!, req.params.id as string, data, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/users/:id/unsuspend', requirePermission('users.suspend') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.unsuspendUser(req.user_id!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/users/:id/verify', requirePermission('users.verify') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.verifyUser(req.user_id!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.delete('/users/:id', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.deleteUser(req.user_id!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/users/:id/role', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = assignRoleSchema.parse(req.body);
    res.json(await UserManagementService.assignRole(req.user_id!, req.params.id as string, data, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.delete('/users/:id/role', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.revokeRole(req.user_id!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.put('/users/:id/name', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = userNameChangeSchema.parse(req.body);
    res.json(await UserManagementService.changeUserName(req.user_id!, req.params.id as string, data, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/users/:id/reset-password', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.resetUserPassword(req.user_id!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.put('/users/:id/password', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const { password } = req.body;
    res.json(await UserManagementService.changeUserPassword(req.user_id!, req.params.id as string, password, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.put('/users/:id/profile', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    res.json(await UserManagementService.updateUserProfile(req.user_id!, req.params.id as string, req.body, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.get('/auto-admire', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.getAutoAdmireUsers()); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/auto-admire', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.addAutoAdmireUser(req.user_id!, req.body.user_id)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.delete('/auto-admire/:id', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.removeAutoAdmireUser(req.user_id!, req.params.id as string)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

// ═══════════════════════════════════════════════════════════
// CONTENT MODERATION
// ═══════════════════════════════════════════════════════════

router.get('/content/:type', requirePermission('content.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query);
    const userId = req.query.user_id as string | undefined;
    const status = req.query.status as string | undefined;
    const type = req.params.type as any;
    res.json(await ContentModerationService.listContent(type, { page, limit, search, userId, status })); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/content/short/:id/moderate', requirePermission('content.hide', 'content.delete') as any, async (req: RarRequest, res: Response) => {
  try {
    const { action, reason } = moderateContentSchema.parse(req.body);
    res.json(await ContentModerationService.moderateShort(req.user_id!, req.params.id as string, action, reason, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/content/post/:id/moderate', requirePermission('content.hide', 'content.delete') as any, async (req: RarRequest, res: Response) => {
  try {
    const { action, reason } = moderateContentSchema.parse(req.body);
    res.json(await ContentModerationService.moderatePost(req.user_id!, req.params.id as string, action, reason, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/content/contest/:id/moderate', requirePermission('content.hide', 'content.delete') as any, async (req: RarRequest, res: Response) => {
  try {
    const { action, reason } = moderateContentSchema.parse(req.body);
    res.json(await ContentModerationService.moderateContest(req.user_id!, req.params.id as string, action, reason, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/content/story/:id/moderate', requirePermission('content.hide', 'content.delete') as any, async (req: RarRequest, res: Response) => {
  try {
    const { action, reason } = moderateContentSchema.parse(req.body);
    res.json(await ContentModerationService.moderateStory(req.user_id!, req.params.id as string, action, reason, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.get('/content/moderation-logs', requirePermission('content.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const contentType = req.query.contentType as string | undefined;
    res.json(await ContentModerationService.getModerationLogs({ page, limit, contentType })); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

// ═══════════════════════════════════════════════════════════
// FINANCIAL CONTROLS
// ═══════════════════════════════════════════════════════════

router.get('/wallet/platform', requirePermission('platform_wallet.view') as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.getPlatformWallets()); return; }
  catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.post('/wallet/platform', requirePermission('platform_wallet.manage') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = platformWalletActionSchema.parse(req.body);
    res.json(await FinancialService.platformWalletAction(req.user_id!, data, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/wallet/topup-user', requirePermission('wallet.topup') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = walletTopupSchema.parse(req.body);
    res.json(await FinancialService.topupUserWallet(req.user_id!, data, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/wallet/bulk-deduct', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const { fiatAmount, currency, reason } = req.body;
    const amount = Number(fiatAmount);
    if (!amount || !currency) {
      res.status(400).json({ error: 'fiatAmount and currency are required' });
      return;
    }
    if (!Number.isInteger(amount) || amount < 1) {
      res.status(400).json({ error: 'Amount must be a whole number (no decimals)' });
      return;
    }
    res.json(await FinancialService.bulkCurrencyDeduction(
      req.user_id!, { fiatAmount: amount, currency, reason: reason || 'Platform deduction' },
      req.ip, req.headers['user-agent'] as string | undefined
    )); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.get('/withdrawals', requirePermission('withdrawals.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const status = req.query.status as string | undefined;
    const userId = req.query.user_id as string | undefined;
    res.json(await FinancialService.listWithdrawals({ page, limit, status, userId })); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.get('/withdrawals/:id', requirePermission('withdrawals.view') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.getWithdrawalDetail(req.params.id as string)); return; }
  catch (e: any) { res.status(404).json({ error: e.message }); return; }
});

router.post('/withdrawals/:id/review', requirePermission('withdrawals.approve', 'withdrawals.reject') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = withdrawalReviewSchema.parse(req.body);
    res.json(await FinancialService.reviewWithdrawal(req.user_id!, req.params.id as string, data, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/withdrawals/:id/override-name', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.overrideNameMatch(req.user_id!, req.params.id as string)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.get('/transactions', requirePermission('transactions.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const userId = req.query.user_id as string | undefined;
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    res.json(await FinancialService.listTransactions({ page, limit, userId, type, status })); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.get('/escrows', requirePermission('escrow.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const status = req.query.status as string | undefined;
    res.json(await FinancialService.listEscrows({ page, limit, status })); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.post('/escrows/:id/release', requirePermission('escrow.release') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.releaseEscrow(req.user_id!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/escrows/:id/refund', requirePermission('escrow.refund') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.refundEscrow(req.user_id!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.get('/fees', requirePermission('fees.configure') as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.getFeeConfig()); return; }
  catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.put('/fees', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = feeConfigSchema.parse(req.body);
    res.json(await FinancialService.updateFeeConfig(req.user_id!, data, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

// ═══════════════════════════════════════════════════════════
// FEATURE FLAGS
// ═══════════════════════════════════════════════════════════

router.get('/feature-flags', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const featureKey = req.query.featureKey as string | undefined;
    const scope = req.query.scope as string | undefined;
    res.json(await FeatureFlagService.listFlags({ page, limit, featureKey, scope })); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.get('/feature-flags/summary', requireSuperAdmin as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await FeatureFlagService.getFeatureSummary()); return; }
  catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.post('/feature-flags', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = featureFlagSchema.parse(req.body);
    res.json(await FeatureFlagService.setFlag(req.user_id!, data as any, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/feature-flags/bulk', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = bulkFeatureFlagSchema.parse(req.body);
    res.json(await FeatureFlagService.bulkToggle(req.user_id!, data as any, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.delete('/feature-flags/:id', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await FeatureFlagService.deleteFlag(req.user_id!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

// ═══════════════════════════════════════════════════════════
// NAMES MANAGEMENT
// ═══════════════════════════════════════════════════════════

router.get('/names/prohibited', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    res.json(await UserManagementService.listProhibitedNames(page)); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.post('/names/prohibited', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = prohibitedNameSchema.parse(req.body);
    res.json(await UserManagementService.addProhibitedName(req.user_id!, data)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.delete('/names/prohibited/:id', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.removeProhibitedName(req.user_id!, req.params.id as string)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.get('/names/reserved', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    res.json(await UserManagementService.listReservedUsernames(page)); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.post('/names/reserved', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = reservedUsernameSchema.parse(req.body);
    res.json(await UserManagementService.reserveUsername(req.user_id!, data)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.delete('/names/reserved/:id', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.releaseReservedUsername(req.user_id!, req.params.id as string)); return; }
  catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

// ═══════════════════════════════════════════════════════════
// PLATFORM CONFIG
// ═══════════════════════════════════════════════════════════

router.get('/settings', requireSuperAdmin as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await FeatureFlagService.getAllConfigs()); return; }
  catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.put('/settings', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = platformConfigSchema.parse(req.body);
    res.json(await FeatureFlagService.setConfig(req.user_id!, data.key, data.value, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/settings/maintenance', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const { enabled } = req.body;
    res.json(await FeatureFlagService.toggleMaintenance(req.user_id!, !!enabled, req.ip, req.headers['user-agent'] as string | undefined)); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

// ═══════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════

router.get('/announcements', requirePermission('announcements.send') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const [items, total] = await Promise.all([
      prisma.platform_announcements.findMany({
        orderBy: { created_at: 'desc' }, take: limit, skip: (page - 1) * limit,
      }),
      prisma.platform_announcements.count(),
    ]);
    res.json({ items, total, page, limit }); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.post('/announcements', requirePermission('announcements.send') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = announcementSchema.parse(req.body);
    const announcement = await prisma.platform_announcements.create({
      data: {
        ...data,
        created_by: req.user_id!,
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
      }
    });
    await AuditService.log(req.user_id!, 'announcement.create', 'announcement', announcement.id, data, req.ip, req.headers['user-agent'] as string | undefined);
    res.status(201).json(announcement); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.delete('/announcements/:id', requirePermission('announcements.send') as any, async (req: RarRequest, res: Response) => {
  try {
    await prisma.platform_announcements.delete({ where: { id: req.params.id as string } });
    res.json({ success: true }); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

// ═══════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════

router.get('/logs', requirePermission('audit_logs.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const adminId = req.query.adminId as string | undefined;
    const action = req.query.action as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    res.json(await AuditService.getLogs({ page, limit, adminId, action, targetType })); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

// ═══════════════════════════════════════════════════════════
// ADMIN TEAM
// ═══════════════════════════════════════════════════════════

router.get('/team', requireSuperAdmin as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await AnalyticsService.getAdminList()); return; }
  catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.post('/team/add', requireSuperAdmin as any, async (req: RarRequest, res: Response): Promise<void> => {
  try {
    const { email, username, first_name, last_name, password, role } = req.body;

    // Validate required fields
    if (!email || !username || !first_name || !last_name || !password || !role) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'MODERATOR', 'FINANCE_MANAGER', 'SUPPORT_AGENT'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User with this email or username already exists' });
      return;
    }

    // Hash password
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and admin profile in transaction
    const newAdmin = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          first_name,
          last_name,
          display_name: `${first_name} ${last_name}`,
          password_hash: passwordHash,
          country: 'KE',
          currency: 'KES',
          is_admin: true,
          updated_at: new Date(),
        },
      });

      const adminProfile = await tx.adminProfile.create({
        data: {
          user_id: user.id,
          role,
          granted_by: req.user_id!,
          is_active: true,
        },
      });

      // Create wallet
      await tx.wallets.create({
        data: {
          user_id: user.id,
          kr_balance: 0,
        },
      });

      return { ...user, adminProfile };
    });

    // Log audit
    await AuditService.log(
      req.user_id!,
      'admin.create',
      'user',
      newAdmin.id,
      { email, username, role },
      req.ip,
      req.headers['user-agent'] as string | undefined
    );

    res.status(201).json({
      success: true,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        username: newAdmin.username,
        display_name: newAdmin.display_name,
        role: newAdmin.adminProfile.role,
      },
    }); return;
  } catch (e: any) {
    res.status(500).json({ error: e.message }); return;
  }
});

// ═══════════════════════════════════════════════════════════
// DATABASE MONITORING (SUPER ADMIN ONLY)
// ═══════════════════════════════════════════════════════════

router.get('/database/stats', requireSuperAdmin as any, async (_req: RarRequest, res: Response) => {
  try {
    const [connections, slowQueries, indexUsage, tableStats] = await Promise.all([
      prisma.$queryRaw`SELECT count(*) as connections, state FROM pg_stat_activity GROUP BY state`,
      prisma.$queryRaw`SELECT query, calls, total_time, mean_time, max_time FROM pg_stat_statements WHERE mean_time > 100 ORDER BY mean_time DESC LIMIT 20`,
      prisma.$queryRaw`SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read FROM pg_stat_user_indexes WHERE idx_scan > 0 ORDER BY idx_scan DESC LIMIT 20`,
      prisma.$queryRaw`SELECT schemaname, tablename, n_live_tup as row_count, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size FROM pg_stat_user_tables ORDER BY n_live_tup DESC LIMIT 20`
    ]);
    res.json({ connections, slowQueries, indexUsage, tableStats }); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.get('/database/performance', requireSuperAdmin as any, async (_req: RarRequest, res: Response) => {
  try {
    const [cacheHitRatio, indexHitRatio, locks] = await Promise.all([
      prisma.$queryRaw`SELECT sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as cache_hit_ratio FROM pg_statio_user_tables`,
      prisma.$queryRaw`SELECT sum(idx_blks_hit) / nullif(sum(idx_blks_hit) + sum(idx_blks_read), 0) as index_hit_ratio FROM pg_statio_user_indexes`,
      prisma.$queryRaw`SELECT locktype, mode, count(*) FROM pg_locks GROUP BY locktype, mode ORDER BY count DESC`
    ]);
    res.json({ cacheHitRatio, indexHitRatio, locks }); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

// ═══════════════════════════════════════════════════════════
// SHOP LISTING FEES
// ═══════════════════════════════════════════════════════════

router.get('/listing-fees/config', requirePermission('fees.configure') as any, async (_req: RarRequest, res: Response) => {
  try {
    const configs = await prisma.listing_fee_config.findMany({
      orderBy: [{ scope: 'asc' }, { priority: 'desc' }]
    });
    res.json(configs); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.post('/listing-fees/config', requirePermission('fees.configure') as any, async (req: RarRequest, res: Response) => {
  try {
    const { scope, scopeValue, category, baseFeeKr, dailyFreeQuota, weeklyFreeQuota, monthlyFreeQuota, isEnabled, priority } = req.body;
    
    const config = await prisma.listing_fee_config.upsert({
      where: {
        scope_scope_value_category: {
          scope,
          scope_value: scopeValue || null,
          category: category || null
        }
      },
      create: {
        scope,
        scope_value: scopeValue,
        category,
        base_fee_kr: baseFeeKr,
        daily_free_quota: dailyFreeQuota || 0,
        weekly_free_quota: weeklyFreeQuota || 0,
        monthly_free_quota: monthlyFreeQuota || 0,
        is_enabled: isEnabled ?? false,
        priority: priority || 0,
        created_by: req.user_id
      },
      update: {
        base_fee_kr: baseFeeKr,
        daily_free_quota: dailyFreeQuota,
        weekly_free_quota: weeklyFreeQuota,
        monthly_free_quota: monthlyFreeQuota,
        is_enabled: isEnabled,
        priority,
        updated_by: req.user_id
      }
    });
    
    await AuditService.log(req.user_id!, 'listing_fee.config', 'listing_fee_config', config.id, req.body, req.ip, req.headers['user-agent'] as string | undefined);
    res.json(config); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.post('/listing-fees/toggle', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const { isEnabled } = req.body;
    await prisma.listing_fee_config.updateMany({ data: { is_enabled: isEnabled } });
    await AuditService.log(req.user_id!, 'listing_fee.toggle', 'system', 'global', { isEnabled }, req.ip, req.headers['user-agent'] as string | undefined);
    res.json({ success: true, isEnabled }); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.delete('/listing-fees/config/:id', requirePermission('fees.configure') as any, async (req: RarRequest, res: Response) => {
  try {
    await prisma.listing_fee_config.delete({ where: { id: req.params.id as string } });
    await AuditService.log(req.user_id!, 'listing_fee.delete', 'listing_fee_config', req.params.id as string, {}, req.ip, req.headers['user-agent'] as string | undefined);
    res.json({ success: true }); return;
  } catch (e: any) { res.status(400).json({ error: e.message }); return; }
});

router.get('/listing-fees/analytics', requirePermission('analytics.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    
    const transactions = await prisma.listing_fee_transaction.findMany({
      where: { created_at: { gte: startDate, lte: endDate } }
    });
    
    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.fee_kr), 0);
    const paidListings = transactions.filter(t => !t.was_free).length;
    const freeListings = transactions.filter(t => t.was_free).length;
    
    const byCategory = await prisma.listing_fee_transaction.groupBy({
      by: ['category'],
      where: { created_at: { gte: startDate, lte: endDate } },
      _sum: { fee_kr: true },
      _count: true
    });
    
    const byLocation = await prisma.listing_fee_transaction.groupBy({
      by: ['location_value'],
      where: { created_at: { gte: startDate, lte: endDate } },
      _sum: { fee_kr: true },
      _count: true
    });
    
    res.json({
      totalRevenue,
      totalListings: transactions.length,
      paidListings,
      freeListings,
      averageFee: paidListings > 0 ? totalRevenue / paidListings : 0,
      byCategory: byCategory.map(c => ({ category: c.category, revenue: Number(c._sum.fee_kr || 0), count: c._count })),
      byLocation: byLocation.map(l => ({ location: l.location_value, revenue: Number(l._sum.fee_kr || 0), count: l._count }))
    }); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

router.get('/listing-fees/transactions', requirePermission('transactions.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    
    const [transactions, total] = await Promise.all([
      prisma.listing_fee_transaction.findMany({
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.listing_fee_transaction.count()
    ]);
    
    res.json({ items: transactions, total, page, limit }); return;
  } catch (e: any) { res.status(500).json({ error: e.message }); return; }
});

export { router as rembrandtRarRoutes };
