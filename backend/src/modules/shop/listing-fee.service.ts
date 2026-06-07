import { prisma } from '../../lib/prisma';
import { ProductCategory, TargetingScope } from '@prisma/client';
import crypto from 'crypto';

export class ListingFeeService {
  async calculateListingFee(userId: string, category: ProductCategory, country: string) {
    const config = await this.getListingFeeConfig();
    if (!config.is_enabled) return { fee: 0, isFree: true, quotaType: null };

    const quota = await this.getUserQuota(userId);
    const freeQuota = this.checkFreeQuota(quota, config);
    
    if (freeQuota.hasFreeSlot) {
      return { fee: 0, isFree: true, quotaType: freeQuota.quotaType };
    }

    const fee = await this.getFeeForLocation(country, category);
    return { fee, isFree: false, quotaType: null };
  }

  async chargeListingFee(userId: string, productId: string, category: ProductCategory, country: string) {
    const { fee, isFree, quotaType } = await this.calculateListingFee(userId, category, country);
    
    if (!isFree && fee > 0) {
      const wallet = await prisma.wallets.findUnique({ where: { user_id: userId } });
      if (!wallet || Number(wallet.kr_balance) < fee) {
        throw new Error('Insufficient balance for listing fee');
      }

      await prisma.$transaction([
        prisma.wallets.update({
          where: { user_id: userId },
          data: { kr_balance: { decrement: fee } }
        }),
        prisma.platform_wallet.update({
          where: { label: 'LISTING_FEES' },
          data: { kr_balance: { increment: fee } }
        }),
        prisma.transactions.create({
          data: {
            user_id: userId,
            type: 'SHOP_LISTING_FEE',
            transaction_type: 'SHOP_LISTING_FEE',
            amount_kr: fee,
            status: 'completed',
            reference_id: productId,
            description: `Listing fee for ${category} product`
          }
        })
      ]);
    }

    await this.recordListingFee(userId, productId, category, country, fee, isFree, quotaType);
    
    if (isFree && quotaType) {
      await this.incrementQuota(userId, quotaType);
    }

    return { fee, isFree };
  }

  private async getListingFeeConfig() {
    const config = await prisma.listing_fee_config.findFirst({
      where: { is_enabled: true, is_active: true },
      orderBy: { priority: 'desc' }
    });
    return config || { is_enabled: false, daily_free_quota: 0, weekly_free_quota: 0, monthly_free_quota: 0 };
  }

  private async getUserQuota(userId: string) {
    let quota = await prisma.user_listing_quota.findUnique({ where: { user_id: userId } });
    
    if (!quota) {
      quota = await prisma.user_listing_quota.create({
        data: { user_id: userId }
      } as any);
    }

    const now = new Date();
    const updates: any = {};

    if (this.shouldResetDaily(quota.last_daily_reset)) {
      updates.daily_used = 0;
      updates.last_daily_reset = now;
    }
    if (this.shouldResetWeekly(quota.last_weekly_reset)) {
      updates.weekly_used = 0;
      updates.last_weekly_reset = now;
    }
    if (this.shouldResetMonthly(quota.last_monthly_reset)) {
      updates.monthly_used = 0;
      updates.last_monthly_reset = now;
    }

    if (Object.keys(updates).length > 0) {
      quota = await prisma.user_listing_quota.update({
        where: { user_id: userId },
        data: updates
      });
    }

    return quota;
  }

  private checkFreeQuota(quota: any, config: any) {
    if (config.daily_free_quota > 0 && quota.daily_used < config.daily_free_quota) {
      return { hasFreeSlot: true, quotaType: 'daily' };
    }
    if (config.weekly_free_quota > 0 && quota.weekly_used < config.weekly_free_quota) {
      return { hasFreeSlot: true, quotaType: 'weekly' };
    }
    if (config.monthly_free_quota > 0 && quota.monthly_used < config.monthly_free_quota) {
      return { hasFreeSlot: true, quotaType: 'monthly' };
    }
    return { hasFreeSlot: false, quotaType: null };
  }

  private async getFeeForLocation(country: string, category: ProductCategory) {
    const configs = await prisma.listing_fee_config.findMany({
      where: { is_enabled: true, is_active: true },
      orderBy: { priority: 'desc' }
    });

    for (const config of configs) {
      if (config.category && config.category !== category) continue;
      if (config.scope === 'COUNTRY' && config.scope_value === country) {
        const feeValue = config.base_fee_kr;
        return typeof feeValue === 'number' ? feeValue : Number(feeValue);
      }
    }

    const globalConfig = configs.find(c => c.scope === 'GLOBAL');
    const globalFee = globalConfig?.base_fee_kr || 0;
    return typeof globalFee === 'number' ? globalFee : Number(globalFee);
  }

  private async incrementQuota(userId: string, quotaType: string) {
    const updates: any = {};
    if (quotaType === 'daily') updates.daily_used = { increment: 1 };
    if (quotaType === 'weekly') updates.weekly_used = { increment: 1 };
    if (quotaType === 'monthly') updates.monthly_used = { increment: 1 };

    await prisma.user_listing_quota.update({
      where: { user_id: userId },
      data: updates
    });
  }

  private async recordListingFee(userId: string, productId: string, category: ProductCategory, country: string, fee: number, isFree: boolean, quotaType: string | null) {
    await prisma.listing_fee_transaction.create({
      data: {
        user_id: userId,
        product_id: productId,
        category,
        location_scope: 'COUNTRY',
        location_value: country,
        fee_kr: fee,
        was_free: isFree,
        quota_type: quotaType
      }
    } as any);
  }

  private shouldResetDaily(lastReset: Date): boolean {
    const now = new Date();
    return now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth();
  }

  private shouldResetWeekly(lastReset: Date): boolean {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return lastReset < weekAgo;
  }

  private shouldResetMonthly(lastReset: Date): boolean {
    const now = new Date();
    return now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  }

  async getListingFeeAnalytics(startDate: Date, endDate: Date) {
    const transactions = await prisma.listing_fee_transaction.findMany({
      where: {
        created_at: { gte: startDate, lte: endDate }
      }
    });

    const totalRevenue = transactions.reduce((sum: number, t: any) => {
      const fee = typeof t.fee_kr === 'number' ? t.fee_kr : Number(t.fee_kr);
      return sum + fee;
    }, 0);
    const paidListings = transactions.filter((t: any) => !t.was_free).length;
    const freeListings = transactions.filter((t: any) => t.was_free).length;

    return {
      totalRevenue,
      totalListings: transactions.length,
      paidListings,
      freeListings,
      averageFee: paidListings > 0 ? totalRevenue / paidListings : 0
    };
  }
}

export const listingFeeService = new ListingFeeService();
