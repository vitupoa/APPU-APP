import { AdminRole } from '@prisma/client';

// Permission matrix: maps each role to its allowed actions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // wildcard = full access

  CONTENT_MODERATOR: [
    'content.view', 'content.hide', 'content.delete', 'content.approve', 'content.flag',
    'users.view', 'reports.view', 'reports.resolve',
  ],

  FINANCIAL_ADMIN: [
    'wallet.view', 'wallet.topup', 'wallet.withdraw', 'wallet.freeze',
    'withdrawals.view', 'withdrawals.approve', 'withdrawals.reject',
    'escrow.view', 'escrow.release', 'escrow.refund',
    'transactions.view', 'platform_wallet.view', 'platform_wallet.manage',
    'fees.configure', 'users.view',
  ],

  SUPPORT_ADMIN: [
    'users.view', 'users.verify', 'users.reset_password',
    'reports.view', 'reports.resolve',
    'disputes.view', 'disputes.resolve',
    'names.manage', 'announcements.send',
  ],

  MARKETING_ADMIN: [
    'campaigns.view', 'campaigns.manage',
    'flash_sales.manage', 'featured.manage',
    'announcements.send', 'ads.view', 'ads.manage',
    'analytics.view',
  ],

  ANALYTICS_ADMIN: [
    'analytics.view', 'reports.view',
    'users.view', 'transactions.view',
  ],

  SECURITY_ADMIN: [
    'audit_logs.view', 'users.view', 'users.suspend', 'users.ban',
    'ip_ban.manage', 'rate_limits.configure',
    'security.monitor',
  ],

  COMMUNITY_MANAGER: [
    'users.view', 'chamas.view', 'chamas.manage',
    'content.view', 'content.flag',
    'reports.view', 'reports.resolve',
    'announcements.send',
  ],
};

export function hasPermission(role: string, action: string): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  if (permissions.includes('*')) return true;
  // Check exact match or wildcard prefix (e.g., "users.*" matches "users.view")
  return permissions.some(p => {
    if (p === action) return true;
    if (p.endsWith('.*') && action.startsWith(p.slice(0, -1))) return true;
    return false;
  });
}

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}

// All platform features that can be toggled
export const PLATFORM_FEATURES = [
  'shorts', 'contests', 'wallet', 'shop', 'stories',
  'chamas', 'chama', 'marketplace', 'ads', 'chat', 'tips',
  'subscriptions', 'teams', 'comments', 'notifications',
  'budgets', 'group_buys', 'flash_sales',
  'garage', 'imports', 'gifts', 'deal_alerts',
  'teams_contests', 'individual_contests', 'brand_marketplace', 'feed', 'garage_services', 'car_imports'
] as const;

export type PlatformFeature = typeof PLATFORM_FEATURES[number];

// Continent mapping for geo-targeting
export const CONTINENT_COUNTRIES: Record<string, string[]> = {
  'Africa': ['KE', 'NG', 'ZA', 'GH', 'TZ', 'UG', 'ET', 'RW', 'CI', 'SN', 'CM', 'AO', 'MZ', 'MW', 'ZM', 'ZW', 'BW', 'NA', 'MU', 'MG'],
  'Europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'AT', 'CH', 'IE', 'PT'],
  'North America': ['US', 'CA', 'MX'],
  'South America': ['BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'UY'],
  'Asia': ['JP', 'CN', 'IN', 'KR', 'SG', 'MY', 'ID', 'TH', 'PH', 'VN', 'AE', 'SA', 'IL', 'TR'],
  'Oceania': ['AU', 'NZ', 'FJ'],
};

// Admin action types for audit logging
export const ADMIN_ACTIONS = {
  // User management
  USER_SUSPEND: 'user.suspend',
  USER_BAN: 'user.ban',
  USER_BLOCK: 'user.block',
  USER_UNSUSPEND: 'user.unsuspend',
  USER_VERIFY: 'user.verify',
  USER_DELETE: 'user.delete',
  USER_RESET_PASSWORD: 'user.reset_password',
  USER_ROLE_ASSIGN: 'user.role_assign',
  USER_ROLE_REVOKE: 'user.role_revoke',
  USER_WALLET_TOPUP: 'user.wallet_topup',
  USER_NAME_CHANGE: 'user.name_change',

  // Content moderation
  CONTENT_HIDE: 'content.hide',
  CONTENT_DELETE: 'content.delete',
  CONTENT_APPROVE: 'content.approve',
  CONTENT_RESTORE: 'content.restore',

  // Financial
  WITHDRAWAL_APPROVE: 'withdrawal.approve',
  WITHDRAWAL_REJECT: 'withdrawal.reject',
  PLATFORM_WALLET_TOPUP: 'platform_wallet.topup',
  PLATFORM_WALLET_WITHDRAW: 'platform_wallet.withdraw',
  ESCROW_RELEASE: 'escrow.release',
  ESCROW_REFUND: 'escrow.refund',
  FEE_UPDATE: 'fee.update',

  // Platform config
  FEATURE_FLAG_UPDATE: 'feature_flag.update',
  CONFIG_UPDATE: 'config.update',
  MAINTENANCE_TOGGLE: 'maintenance.toggle',
  NAME_PROHIBIT: 'name.prohibit',
  USERNAME_RESERVE: 'username.reserve',

  // Communication
  ANNOUNCEMENT_CREATE: 'announcement.create',
  ANNOUNCEMENT_DELETE: 'announcement.delete',
} as const;
