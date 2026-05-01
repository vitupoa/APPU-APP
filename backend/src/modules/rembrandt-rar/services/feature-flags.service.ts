import { prisma } from '../../../config/database.js';
import { AuditService } from './audit.service.js';
import { ADMIN_ACTIONS, PLATFORM_FEATURES, CONTINENT_COUNTRIES } from '../rembrandt-rar.types.js';

type Scope = 'GLOBAL' | 'CONTINENT' | 'COUNTRY' | 'REGION' | 'CITY' | 'USER';

// Priority hierarchy: USER(50) > CITY(40) > REGION(30) > COUNTRY(20) > CONTINENT(10) > GLOBAL(0)
const SCOPE_PRIORITY: Record<Scope, number> = {
  GLOBAL: 0,
  CONTINENT: 10,
  COUNTRY: 20,
  REGION: 30,
  CITY: 40,
  USER: 50,
};

export class FeatureFlagService {
  /**
   * Check if a feature is enabled for a specific user context.
   * Hierarchical: most specific scope wins.
   */
  static async isFeatureEnabled(
    featureKey: string,
    context: { userId?: string; country?: string; city?: string; region?: string; continent?: string }
  ): Promise<boolean> {
    const flags = await prisma.featureFlag.findMany({
      where: { featureKey },
      orderBy: { priority: 'desc' },
    });

    if (flags.length === 0) return true; // Default: enabled

    // Find the most specific matching flag
    let bestMatch: { isEnabled: boolean; priority: number } | null = null;

    for (const flag of flags) {
      let matches = false;
      const priority = SCOPE_PRIORITY[flag.scope as Scope] ?? 0;

      switch (flag.scope) {
        case 'GLOBAL':
          matches = !flag.scopeValue;
          break;
        case 'USER':
          matches = flag.scopeValue === context.userId;
          break;
        case 'CITY':
          matches = flag.scopeValue === context.city;
          break;
        case 'REGION':
          matches = flag.scopeValue === context.region;
          break;
        case 'COUNTRY':
          matches = flag.scopeValue === context.country;
          break;
        case 'CONTINENT':
          matches = flag.scopeValue === context.continent ||
            (context.country ? this.isCountryInContinent(context.country, flag.scopeValue ?? '') : false);
          break;
      }

      if (matches && (!bestMatch || priority > bestMatch.priority)) {
        bestMatch = { isEnabled: flag.isEnabled, priority };
      }
    }

    return bestMatch?.isEnabled ?? true;
  }

  /**
   * Get all feature flags with optional filtering.
   */
  static async listFlags(options: {
    page?: number; limit?: number; featureKey?: string; scope?: string;
  }) {
    const { page = 1, limit = 50, featureKey, scope } = options;
    const where: any = {};
    if (featureKey) where.featureKey = featureKey;
    if (scope) where.scope = scope;

    const [items, total] = await Promise.all([
      prisma.featureFlag.findMany({
        where, orderBy: [{ featureKey: 'asc' }, { priority: 'desc' }],
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.featureFlag.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Set a feature flag (create or update).
   */
  static async setFlag(
    adminId: string,
    data: { featureKey: string; isEnabled: boolean; scope: Scope; scopeValue?: string },
    ip?: string, ua?: string
  ) {
    const scopeValue = data.scopeValue || null;
    const priority = SCOPE_PRIORITY[data.scope] ?? 0;

    const flag = await prisma.featureFlag.upsert({
      where: {
        featureKey_scope_scopeValue: {
          featureKey: data.featureKey,
          scope: data.scope,
          scopeValue: scopeValue ?? '',
        }
      },
      create: {
        featureKey: data.featureKey,
        isEnabled: data.isEnabled,
        scope: data.scope,
        scopeValue: scopeValue,
        priority,
        createdBy: adminId,
      },
      update: {
        isEnabled: data.isEnabled,
        priority,
      },
    });

    await AuditService.log(adminId, ADMIN_ACTIONS.FEATURE_FLAG_UPDATE, 'feature_flag', flag.id, {
      featureKey: data.featureKey, isEnabled: data.isEnabled, scope: data.scope, scopeValue
    }, ip, ua);

    return flag;
  }

  /**
   * Toggle ALL features at once for a given scope.
   */
  static async bulkToggle(
    adminId: string,
    data: { isEnabled: boolean; scope: Scope; scopeValue?: string },
    ip?: string, ua?: string
  ) {
    const results = [];
    for (const feature of PLATFORM_FEATURES) {
      const flag = await this.setFlag(adminId, {
        featureKey: feature,
        isEnabled: data.isEnabled,
        scope: data.scope,
        scopeValue: data.scopeValue,
      }, ip, ua);
      results.push(flag);
    }

    return { success: true, count: results.length, isEnabled: data.isEnabled };
  }

  /**
   * Delete a specific flag.
   */
  static async deleteFlag(adminId: string, flagId: string, ip?: string, ua?: string) {
    const flag = await prisma.featureFlag.delete({ where: { id: flagId } });
    await AuditService.log(adminId, ADMIN_ACTIONS.FEATURE_FLAG_UPDATE, 'feature_flag', flagId, {
      deleted: true, featureKey: flag.featureKey
    }, ip, ua);
    return { success: true };
  }

  /**
   * Get a summary: for each feature, its global status + override count.
   */
  static async getFeatureSummary() {
    const allFlags = await prisma.featureFlag.findMany({
      orderBy: [{ featureKey: 'asc' }, { priority: 'desc' }],
    });

    const summary: Record<string, { globalEnabled: boolean; overrides: number }> = {};

    for (const feature of PLATFORM_FEATURES) {
      const flags = allFlags.filter((f: any) => f.featureKey === feature);
      const globalFlag = flags.find(f => f.scope === 'GLOBAL');
      summary[feature] = {
        globalEnabled: globalFlag?.isEnabled ?? true,
        overrides: flags.filter((f: any) => f.scope !== 'GLOBAL').length,
      };
    }

    return summary;
  }

  // ─── PLATFORM CONFIG ────────────────────────────────────

  static async getConfig(key: string) {
    const config = await prisma.platformConfig.findUnique({ where: { key } });
    return config?.value ?? null;
  }

  static async setConfig(adminId: string, key: string, value: any, ip?: string, ua?: string) {
    const config = await prisma.platformConfig.upsert({
      where: { key },
      create: { key, value, updatedBy: adminId },
      update: { value, updatedBy: adminId },
    });
    await AuditService.log(adminId, ADMIN_ACTIONS.CONFIG_UPDATE, 'config', key, { value }, ip, ua);
    return config;
  }

  static async getAllConfigs() {
    return prisma.platformConfig.findMany({ orderBy: { key: 'asc' } });
  }

  static async toggleMaintenance(adminId: string, enabled: boolean, ip?: string, ua?: string) {
    await this.setConfig(adminId, 'maintenance_mode', { enabled, updatedAt: new Date().toISOString() }, ip, ua);
    await AuditService.log(adminId, ADMIN_ACTIONS.MAINTENANCE_TOGGLE, 'config', 'maintenance_mode', { enabled }, ip, ua);
    return { success: true, maintenanceMode: enabled };
  }

  // ─── HELPERS ────────────────────────────────────────────

  private static isCountryInContinent(countryCode: string, continent: string): boolean {
    const countries = CONTINENT_COUNTRIES[continent];
    return countries?.includes(countryCode.toUpperCase()) ?? false;
  }
}
