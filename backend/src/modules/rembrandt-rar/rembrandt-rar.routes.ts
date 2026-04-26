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

const router = Router();

// All RAR routes require auth + active admin profile
router.use(authMiddleware as any);
router.use(requireRarAccess as any);

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════

router.get('/dashboard', requirePermission('analytics.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const overview = await AnalyticsService.getDashboardOverview();
    res.json(overview);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/dashboard/user-growth', requirePermission('analytics.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    res.json(await AnalyticsService.getUserGrowthChart(days));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/dashboard/revenue', requirePermission('analytics.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    res.json(await AnalyticsService.getRevenueChart(days));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/dashboard/content-stats', requirePermission('analytics.view') as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await AnalyticsService.getContentStats()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/dashboard/top-creators', requirePermission('analytics.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    res.json(await AnalyticsService.getTopCreators(limit));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════

router.get('/users', requirePermission('users.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit, search, sort, order } = paginationSchema.parse(req.query);
    const accountType = req.query.accountType as string | undefined;
    const isSuspended = req.query.isSuspended === 'true' ? true : req.query.isSuspended === 'false' ? false : undefined;
    res.json(await UserManagementService.listUsers({ page, limit, search, sort, order, accountType, isSuspended }));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/users/:id', requirePermission('users.view') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.getUserDetail(req.params.id as string)); }
  catch (e: any) { res.status(404).json({ error: e.message }); }
});

router.post('/users/:id/suspend', requirePermission('users.suspend') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = suspendUserSchema.parse(req.body);
    res.json(await UserManagementService.suspendUser(req.userId!, req.params.id as string, data, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/users/:id/unsuspend', requirePermission('users.suspend') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.unsuspendUser(req.userId!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/users/:id/verify', requirePermission('users.verify') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.verifyUser(req.userId!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/users/:id', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.deleteUser(req.userId!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/users/:id/role', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = assignRoleSchema.parse(req.body);
    res.json(await UserManagementService.assignRole(req.userId!, req.params.id as string, data, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/users/:id/role', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.revokeRole(req.userId!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/users/:id/name', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = userNameChangeSchema.parse(req.body);
    res.json(await UserManagementService.changeUserName(req.userId!, req.params.id as string, data, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/users/:id/reset-password', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.resetUserPassword(req.userId!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/users/:id/password', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const { password } = req.body;
    res.json(await UserManagementService.changeUserPassword(req.userId!, req.params.id as string, password, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.put('/users/:id/profile', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    res.json(await UserManagementService.updateUserProfile(req.userId!, req.params.id as string, req.body, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/auto-admire', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.getAutoAdmireUsers()); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/auto-admire', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.addAutoAdmireUser(req.userId!, req.body.userId)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/auto-admire/:id', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.removeAutoAdmireUser(req.userId!, req.params.id as string)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// CONTENT MODERATION
// ═══════════════════════════════════════════════════════════

router.get('/content/:type', requirePermission('content.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit, search } = paginationSchema.parse(req.query);
    const userId = req.query.userId as string | undefined;
    const status = req.query.status as string | undefined;
    const type = req.params.type as any;
    res.json(await ContentModerationService.listContent(type, { page, limit, search, userId, status }));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/content/short/:id/moderate', requirePermission('content.hide', 'content.delete') as any, async (req: RarRequest, res: Response) => {
  try {
    const { action, reason } = moderateContentSchema.parse(req.body);
    res.json(await ContentModerationService.moderateShort(req.userId!, req.params.id as string, action, reason, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/content/post/:id/moderate', requirePermission('content.hide', 'content.delete') as any, async (req: RarRequest, res: Response) => {
  try {
    const { action, reason } = moderateContentSchema.parse(req.body);
    res.json(await ContentModerationService.moderatePost(req.userId!, req.params.id as string, action, reason, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/content/contest/:id/moderate', requirePermission('content.hide', 'content.delete') as any, async (req: RarRequest, res: Response) => {
  try {
    const { action, reason } = moderateContentSchema.parse(req.body);
    res.json(await ContentModerationService.moderateContest(req.userId!, req.params.id as string, action, reason, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/content/story/:id/moderate', requirePermission('content.hide', 'content.delete') as any, async (req: RarRequest, res: Response) => {
  try {
    const { action, reason } = moderateContentSchema.parse(req.body);
    res.json(await ContentModerationService.moderateStory(req.userId!, req.params.id as string, action, reason, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/content/moderation-logs', requirePermission('content.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const contentType = req.query.contentType as string | undefined;
    res.json(await ContentModerationService.getModerationLogs({ page, limit, contentType }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// FINANCIAL CONTROLS
// ═══════════════════════════════════════════════════════════

router.get('/wallet/platform', requirePermission('platform_wallet.view') as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.getPlatformWallets()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/wallet/platform', requirePermission('platform_wallet.manage') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = platformWalletActionSchema.parse(req.body);
    res.json(await FinancialService.platformWalletAction(req.userId!, data, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/wallet/topup-user', requirePermission('wallet.topup') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = walletTopupSchema.parse(req.body);
    res.json(await FinancialService.topupUserWallet(req.userId!, data, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
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
      req.userId!, { fiatAmount: amount, currency, reason: reason || 'Platform deduction' },
      req.ip, req.headers['user-agent'] as string | undefined
    ));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/withdrawals', requirePermission('withdrawals.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const status = req.query.status as string | undefined;
    const userId = req.query.userId as string | undefined;
    res.json(await FinancialService.listWithdrawals({ page, limit, status, userId }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/withdrawals/:id', requirePermission('withdrawals.view') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.getWithdrawalDetail(req.params.id as string)); }
  catch (e: any) { res.status(404).json({ error: e.message }); }
});

router.post('/withdrawals/:id/review', requirePermission('withdrawals.approve', 'withdrawals.reject') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = withdrawalReviewSchema.parse(req.body);
    res.json(await FinancialService.reviewWithdrawal(req.userId!, req.params.id as string, data, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/withdrawals/:id/override-name', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.overrideNameMatch(req.userId!, req.params.id as string)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/transactions', requirePermission('transactions.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const userId = req.query.userId as string | undefined;
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    res.json(await FinancialService.listTransactions({ page, limit, userId, type, status }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/escrows', requirePermission('escrow.view') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const status = req.query.status as string | undefined;
    res.json(await FinancialService.listEscrows({ page, limit, status }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/escrows/:id/release', requirePermission('escrow.release') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.releaseEscrow(req.userId!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/escrows/:id/refund', requirePermission('escrow.refund') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.refundEscrow(req.userId!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/fees', requirePermission('fees.configure') as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await FinancialService.getFeeConfig()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/fees', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = feeConfigSchema.parse(req.body);
    res.json(await FinancialService.updateFeeConfig(req.userId!, data, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// FEATURE FLAGS
// ═══════════════════════════════════════════════════════════

router.get('/feature-flags', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const featureKey = req.query.featureKey as string | undefined;
    const scope = req.query.scope as string | undefined;
    res.json(await FeatureFlagService.listFlags({ page, limit, featureKey, scope }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get('/feature-flags/summary', requireSuperAdmin as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await FeatureFlagService.getFeatureSummary()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/feature-flags', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = featureFlagSchema.parse(req.body);
    res.json(await FeatureFlagService.setFlag(req.userId!, data as any, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/feature-flags/bulk', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = bulkFeatureFlagSchema.parse(req.body);
    res.json(await FeatureFlagService.bulkToggle(req.userId!, data as any, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/feature-flags/:id', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try { res.json(await FeatureFlagService.deleteFlag(req.userId!, req.params.id as string, req.ip, req.headers['user-agent'] as string | undefined)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// NAMES MANAGEMENT
// ═══════════════════════════════════════════════════════════

router.get('/names/prohibited', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    res.json(await UserManagementService.listProhibitedNames(page));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/names/prohibited', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = prohibitedNameSchema.parse(req.body);
    res.json(await UserManagementService.addProhibitedName(req.userId!, data));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/names/prohibited/:id', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.removeProhibitedName(req.userId!, req.params.id as string)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.get('/names/reserved', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    res.json(await UserManagementService.listReservedUsernames(page));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/names/reserved', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = reservedUsernameSchema.parse(req.body);
    res.json(await UserManagementService.reserveUsername(req.userId!, data));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/names/reserved/:id', requirePermission('names.manage') as any, async (req: RarRequest, res: Response) => {
  try { res.json(await UserManagementService.releaseReservedUsername(req.userId!, req.params.id as string)); }
  catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// PLATFORM CONFIG
// ═══════════════════════════════════════════════════════════

router.get('/settings', requireSuperAdmin as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await FeatureFlagService.getAllConfigs()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/settings', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const data = platformConfigSchema.parse(req.body);
    res.json(await FeatureFlagService.setConfig(req.userId!, data.key, data.value, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.post('/settings/maintenance', requireSuperAdmin as any, async (req: RarRequest, res: Response) => {
  try {
    const { enabled } = req.body;
    res.json(await FeatureFlagService.toggleMaintenance(req.userId!, !!enabled, req.ip, req.headers['user-agent'] as string | undefined));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════

router.get('/announcements', requirePermission('announcements.send') as any, async (req: RarRequest, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const [items, total] = await Promise.all([
      prisma.platformAnnouncement.findMany({
        orderBy: { createdAt: 'desc' }, take: limit, skip: (page - 1) * limit,
      }),
      prisma.platformAnnouncement.count(),
    ]);
    res.json({ items, total, page, limit });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/announcements', requirePermission('announcements.send') as any, async (req: RarRequest, res: Response) => {
  try {
    const data = announcementSchema.parse(req.body);
    const announcement = await prisma.platformAnnouncement.create({
      data: {
        ...data,
        createdBy: req.userId!,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      }
    });
    await AuditService.log(req.userId!, 'announcement.create', 'announcement', announcement.id, data, req.ip, req.headers['user-agent'] as string | undefined);
    res.status(201).json(announcement);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

router.delete('/announcements/:id', requirePermission('announcements.send') as any, async (req: RarRequest, res: Response) => {
  try {
    await prisma.platformAnnouncement.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
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
    res.json(await AuditService.getLogs({ page, limit, adminId, action, targetType }));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════
// ADMIN TEAM
// ═══════════════════════════════════════════════════════════

router.get('/team', requireSuperAdmin as any, async (_req: RarRequest, res: Response) => {
  try { res.json(await AnalyticsService.getAdminList()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

export { router as rembrandtRarRoutes };
