import { prisma } from '../../config/database.js';
import { KYCStatus } from '@prisma/client';

export enum KYCTier {
  TIER_0 = 'TIER_0', // No KYC
  TIER_1 = 'TIER_1', // Basic verification
  TIER_2 = 'TIER_2', // Full KYC
}

export interface KYCLimits {
  tier: KYCTier;
  dailyWithdrawalLimit: number;
  monthlyWithdrawalLimit: number;
  singleTransactionLimit: number;
  requiresKYC: boolean;
}

const KYC_TIER_LIMITS: Record<KYCTier, KYCLimits> = {
  [KYCTier.TIER_0]: {
    tier: KYCTier.TIER_0,
    dailyWithdrawalLimit: 10000, // 10,000 Rc (~$100)
    monthlyWithdrawalLimit: 50000, // 50,000 Rc (~$500)
    singleTransactionLimit: 5000, // 5,000 Rc (~$50)
    requiresKYC: false
  },
  [KYCTier.TIER_1]: {
    tier: KYCTier.TIER_1,
    dailyWithdrawalLimit: 50000, // 50,000 Rc (~$500)
    monthlyWithdrawalLimit: 500000, // 500,000 Rc (~$5,000)
    singleTransactionLimit: 25000, // 25,000 Rc (~$250)
    requiresKYC: true
  },
  [KYCTier.TIER_2]: {
    tier: KYCTier.TIER_2,
    dailyWithdrawalLimit: 500000, // 500,000 Rc (~$5,000)
    monthlyWithdrawalLimit: 5000000, // 5,000,000 Rc (~$50,000)
    singleTransactionLimit: 100000, // 100,000 Rc (~$1,000)
    requiresKYC: true
  }
};

export class KYCTierService {
  async getUserKYCTier(userId: string): Promise<KYCTier> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { kyc_status: true }
    });

    if (!user) throw new Error('User not found');

    switch (user.kyc_status) {
      case 'APPROVED':
        return KYCTier.TIER_2;
      case 'PENDING':
        return KYCTier.TIER_1;
      default:
        return KYCTier.TIER_0;
    }
  }

  async getUserLimits(userId: string): Promise<KYCLimits> {
    const tier = await this.getUserKYCTier(userId);
    return KYC_TIER_LIMITS[tier];
  }

  async checkWithdrawalLimit(userId: string, amountKr: number): Promise<{
    allowed: boolean;
    reason?: string;
    currentTier: KYCTier;
    limits: KYCLimits;
  }> {
    const limits = await this.getUserLimits(userId);
    const tier = limits.tier;

    // Check single transaction limit
    if (amountRc > limits.singleTransactionLimit) {
      return {
        allowed: false,
        reason: `Single transaction limit exceeded. Max: ${limits.singleTransactionLimit} Rc`,
        currentTier: tier,
        limits
      };
    }

    // Get today's withdrawals
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyWithdrawals = await prisma.transactions.aggregate({
      where: {
        user_id: userId,
        type: 'withdrawal',
        status: 'completed',
        created_at: { gte: today }
      },
      _sum: { amount_kr: true }
    });

    const dailyTotal = Number(dailyWithdrawals._sum.amount_kr || 0) + amountKr;

    if (dailyTotal > limits.dailyWithdrawalLimit) {
      return {
        allowed: false,
        reason: `Daily withdrawal limit exceeded. Max: ${limits.dailyWithdrawalLimit} Rc`,
        currentTier: tier,
        limits
      };
    }

    // Get monthly withdrawals
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyWithdrawals = await prisma.transactions.aggregate({
      where: {
        user_id: userId,
        type: 'withdrawal',
        status: 'completed',
        created_at: { gte: monthStart }
      },
      _sum: { amount_kr: true }
    });

    const monthlyTotal = Number(monthlyWithdrawals._sum.amount_kr || 0) + amountKr;

    if (monthlyTotal > limits.monthlyWithdrawalLimit) {
      return {
        allowed: false,
        reason: `Monthly withdrawal limit exceeded. Max: ${limits.monthlyWithdrawalLimit} Rc`,
        currentTier: tier,
        limits
      };
    }

    return {
      allowed: true,
      currentTier: tier,
      limits
    };
  }

  getTierLimits(tier: KYCTier): KYCLimits {
    return KYC_TIER_LIMITS[tier];
  }

  getAllTiers(): KYCLimits[] {
    return Object.values(KYC_TIER_LIMITS);
  }
}

export const kycTierService = new KYCTierService();
