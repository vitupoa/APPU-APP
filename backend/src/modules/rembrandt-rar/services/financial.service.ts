import { prisma } from '../../../config/database.js';
import { Prisma } from '@prisma/client';
import { AuditService } from './audit.service.js';
import { ADMIN_ACTIONS } from '../rembrandt-rar.types.js';
import { ExchangeService } from '../../../services/exchange/exchange.service.js';
import crypto from 'crypto';

export class FinancialService {
  // ─── PLATFORM WALLET ────────────────────────────────────

  static async getPlatformWallets() {
    return prisma.platform_wallet.findMany();
  }

  static async ensurePlatformWallet(label = 'main') {
    return prisma.platform_wallet.upsert({
      where: { id: label },
      create: { kr_balance: 0 },
      update: {},
    });
  }

  static async platformWalletAction(
    adminId: string,
    data: { amount_kr: number; action: 'topup' | 'withdraw'; reason: string },
    ip?: string, ua?: string
  ) {
    const wallet = await this.ensurePlatformWallet('main');
    const amount = new Prisma.Decimal(data.amount_kr);

    if (data.action === 'withdraw' && wallet.kr_balance.lessThan(amount)) {
      throw new Error('Insufficient platform wallet balance');
    }

    const updated = await prisma.platform_wallet.update({
      where: { id: 'main' },
      data: {
        kr_balance: data.action === 'topup'
          ? { increment: amount }
          : { decrement: amount }
      }
    });

    const auditAction = data.action === 'topup'
      ? ADMIN_ACTIONS.PLATFORM_WALLET_TOPUP
      : ADMIN_ACTIONS.PLATFORM_WALLET_WITHDRAW;

    await AuditService.log(adminId, auditAction, 'platform_wallet', 'main', {
      amount_kr: data.amount_kr, reason: data.reason
    }, ip, ua);

    return { success: true, newBalance: updated.kr_balance, action: data.action };
  }

  // ─── USER WALLET TOPUP ──────────────────────────────────

  static async topupUserWallet(
    adminId: string,
    data: { userId: string; amountKr: number; reason: string },
    ip?: string, ua?: string
  ) {
    const amount = new Prisma.Decimal(data.amountKr);

    const wallet = await prisma.wallets.upsert({
      where: { user_id: data.userId },
      create: { user_id: data.userId, kr_balance: amount },
      update: { kr_balance: { increment: amount } },
    });

    await prisma.transactions.create({
      data: {
        user_id: data.userId,
        type: 'admin_topup',
        amount_kr: amount,
        status: 'completed',
        provider: 'platform_admin',
        counterparty_id: adminId,
        metadata: { reason: data.reason, adminId },
      }
    });

    await AuditService.log(adminId, ADMIN_ACTIONS.USER_WALLET_TOPUP, 'user', data.userId, {
      amount_kr: data.amountKr, reason: data.reason
    }, ip, ua);

    return { success: true, newBalance: wallet.kr_balance };
  }

  // ─── WITHDRAWALS ────────────────────────────────────────

  static async listWithdrawals(options: {
    page?: number; limit?: number; status?: string; userId?: string;
  }) {
    const { page = 1, limit = 20, status, userId } = options;
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.user_id = userId;

    const [items, total] = await Promise.all([
      prisma.withdrawal_requests.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, display_name: true, first_name: true, last_name: true } }
        },
        orderBy: { created_at: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.withdrawal_requests.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getWithdrawalDetail(withdrawalId: string) {
    return prisma.withdrawal_requests.findUniqueOrThrow({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true, username: true, display_name: true,
            first_name: true, last_name: true, email: true, country: true
          }
        }
      }
    });
  }

  static async reviewWithdrawal(
    adminId: string, withdrawalId: string,
    data: { action: 'approve' | 'reject'; note?: string },
    ip?: string, ua?: string
  ) {
    const withdrawal = await prisma.withdrawal_requests.findUniqueOrThrow({
      where: { id: withdrawalId },
      include: { user: { select: { first_name: true, last_name: true, display_name: true } } }
    });

    if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'FLAGGED') {
      throw new Error(`Cannot review withdrawal in ${withdrawal.status} status`);
    }

    // Name matching check
    const runingaName = `${withdrawal.user.first_name} ${withdrawal.user.last_name}`.toLowerCase().trim();
    const accountName = (withdrawal.account_name || '').toLowerCase().trim();
    const nameMatch = this.fuzzyNameMatch(runingaName, accountName);

    if (data.action === 'approve') {
      if (!nameMatch.isMatch) {
        // Auto-flag if names don't match, admin must explicitly override
        if (withdrawal.name_match_status !== 'admin_override') {
          return {
            success: false,
            warning: 'NAME_MISMATCH',
            message: `Account name "${withdrawal.account_name}" does not match Runinga name "${withdrawal.user.first_name} ${withdrawal.user.last_name}"`,
            similarity: nameMatch.similarity,
            requiresOverride: true,
          };
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.withdrawal_requests.update({
          where: { id: withdrawalId },
          data: {
            status: 'APPROVED',
            name_match_status: nameMatch.isMatch ? 'match' : 'admin_override',
            reviewed_by: adminId,
            review_note: data.note,
            reviewed_at: new Date(),
          }
        });

        // Calculate invisible withdrawal fee (KES 1 → Rc)
        const withdrawalFeeRc = await ExchangeService.getWithdrawalFeeKr();
        const totalDeduction = withdrawal.amount_kr.add(new Prisma.Decimal(withdrawalFeeKr));

        // Deduct from user wallet (withdrawal amount + invisible fee)
        await tx.wallets.update({
          where: { user_id: withdrawal.user_id },
          data: { kr_balance: { decrement: totalDeduction } }
        });

        await tx.transactions.create({
          data: {
            user_id: withdrawal.user_id,
            type: 'withdraw',
            amount_kr: withdrawal.amount_kr,
            amount_fiat: withdrawal.amount_fiat,
            currency: withdrawal.currency,
            status: 'completed',
            provider: withdrawal.provider,
            counterparty_id: adminId,
          }
        });

        // Credit withdrawal fee to @JohnOyugi's operational wallet
        if (withdrawalFeeRc > 0) {
          const opsUser = await tx.user.findFirst({ where: { username: 'JohnOyugi' } });
          if (opsUser) {
            await tx.wallets.upsert({
              where: { user_id: opsUser.id },
              create: { user_id: opsUser.id, kr_balance: new Prisma.Decimal(withdrawalFeeKr) },
              update: { kr_balance: { increment: new Prisma.Decimal(withdrawalFeeKr) } },
            });
          }
        }
      });

      await AuditService.log(adminId, ADMIN_ACTIONS.WITHDRAWAL_APPROVE, 'withdrawal', withdrawalId, {
        amount_kr: withdrawal.amount_kr.toString(), note: data.note
      }, ip, ua);

      return { success: true, message: 'Withdrawal approved' };

    } else {
      await prisma.withdrawal_requests.update({
        where: { id: withdrawalId },
        data: {
          status: 'REJECTED',
          reviewed_by: adminId,
          review_note: data.note || 'Rejected by admin',
          reviewed_at: new Date(),
        }
      });

      await AuditService.log(adminId, ADMIN_ACTIONS.WITHDRAWAL_REJECT, 'withdrawal', withdrawalId, {
        note: data.note
      }, ip, ua);

      return { success: true, message: 'Withdrawal rejected' };
    }
  }

  static async overrideNameMatch(adminId: string, withdrawalId: string) {
    await prisma.withdrawal_requests.update({
      where: { id: withdrawalId },
      data: { name_match_status: 'admin_override' }
    });
    return { success: true, message: 'Name match overridden by admin' };
  }

  // ─── TRANSACTIONS ───────────────────────────────────────

  static async listTransactions(options: {
    page?: number; limit?: number; userId?: string; type?: string; status?: string;
  }) {
    const { page = 1, limit = 50, userId, type, status } = options;
    const where: any = {};
    if (userId) where.user_id = userId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.transactions.findMany({
        where, orderBy: { created_at: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.transactions.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── ESCROW ─────────────────────────────────────────────

  static async listEscrows(options: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = options;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.escrows.findMany({
        where,
        include: { user: { select: { id: true, username: true, display_name: true } },
          Contest: { select: { id: true, title: true } },
        },
        orderBy: { created_at: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.escrows.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async releaseEscrow(adminId: string, escrowId: string, ip?: string, ua?: string) {
    const escrow = await prisma.escrows.findUniqueOrThrow({ where: { id: escrowId } });
    if (escrow.status !== 'held') throw new Error('Escrow not in held status');

    await prisma.$transaction(async (tx) => {
      await tx.escrows.update({ where: { id: escrowId }, data: { status: 'released' } });
      await tx.wallets.update({
        where: { user_id: escrow.user_id },
        data: { kr_balance: { increment: escrow.prize_amount_kr } }
      });
    });

    await AuditService.log(adminId, ADMIN_ACTIONS.ESCROW_RELEASE, 'escrow', escrowId, {
      amount_kr: escrow.prize_amount_kr.toString()
    }, ip, ua);
    return { success: true, message: 'Escrow released' };
  }

  static async refundEscrow(adminId: string, escrowId: string, ip?: string, ua?: string) {
    const escrow = await prisma.escrows.findUniqueOrThrow({ where: { id: escrowId } });
    if (escrow.status !== 'held') throw new Error('Escrow not in held status');

    await prisma.$transaction(async (tx) => {
      await tx.escrows.update({ where: { id: escrowId }, data: { status: 'refunded' } });
      const totalRefund = escrow.prize_amount_kr.add(escrow.fee_amount_kr);
      await tx.wallets.update({
        where: { user_id: escrow.user_id },
        data: { kr_balance: { increment: totalRefund } }
      });
    });

    await AuditService.log(adminId, ADMIN_ACTIONS.ESCROW_REFUND, 'escrow', escrowId, {}, ip, ua);
    return { success: true, message: 'Escrow refunded' };
  }

  // ─── FEE CONFIG ─────────────────────────────────────────

  static async getFeeConfig() {
    const config = await prisma.platform_config.findUnique({ where: { key: 'fee_structure' } });
    return config?.value ?? {
      tipFeePercent: 15,
      contestFeePercent: 10,
      shopFeePercent: 8,
      subscriptionFeePercent: 15,
      withdrawalFeePercent: 2,
    };
  }

  static async updateFeeConfig(_adminId: string, fees: Record<string, number>, ip?: string, ua?: string) {
    await prisma.platform_config.upsert({
      where: { key: 'fee_structure' },
      create: { key: 'fee_structure', value: fees },
      update: { value: fees },
    });
    await AuditService.log(_adminId, ADMIN_ACTIONS.FEE_UPDATE, 'config', 'fee_structure', fees, ip, ua);
    return { success: true, fees };
  }

  // ─── BULK CURRENCY DEDUCTION ────────────────────────────
  /**
   * Super Admin enters a fiat amount + currency code (e.g. $1 USD, Tsh 1 TZS).
   * All users whose wallet currency matches get that fiat amount silently
   * deducted from their Rc balance. The total is credited to the platform revenue wallet.
   */
  static async bulkCurrencyDeduction(
    adminId: string,
    data: { fiatAmount: number; currency: string; reason: string },
    ip?: string, ua?: string
  ) {
    const { fiatAmount, currency, reason } = data;

    // Convert fiat amount → USD → Rc
    const usdToFiatRate = await ExchangeService.getRate(currency);
    const fiatInUsd = fiatAmount / usdToFiatRate;
    const krAmount = ExchangeService.getKrFromUSD(fiatInUsd);
    const krDecimal = new Prisma.Decimal(krAmount);

    if (krAmount <= 0) throw new Error('Deduction amount too small to convert');

    // Find all users with matching currency who have sufficient balance
    const matchingWallets = await prisma.wallets.findMany({
      where: {
        User: { currency: { equals: currency, mode: 'insensitive' } },
        kr_balance: { gte: krDecimal }
      },
      select: { user_id: true, kr_balance: true }
    });

    if (matchingWallets.length === 0) {
      return { success: true, usersAffected: 0, totalKrDeducted: 0, message: 'No eligible users found' };
    }

    // Batch deduct atomically
    let totalDeducted = new Prisma.Decimal(0);
    const BATCH_SIZE = 100;

    for (let i = 0; i < matchingWallets.length; i += BATCH_SIZE) {
      const batch = matchingWallets.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(
        batch.map((w: any) =>
          prisma.wallets.update({
            where: { user_id: w.user_id },
            data: { kr_balance: { decrement: krDecimal } }
          })
        )
      );
      totalDeducted = totalDeducted.add(krDecimal.mul(batch.length));
    }

    // Credit total deducted to @JohnOyugi's operational wallet
    const opsUser = await prisma.user.findFirst({ where: { username: 'JohnOyugi' } });
    if (opsUser) {
      await prisma.wallets.upsert({
        where: { user_id: opsUser.id },
        create: { user_id: opsUser.id, kr_balance: totalDeducted },
        update: { kr_balance: { increment: totalDeducted } },
      });
    }

    await AuditService.log(adminId, 'BULK_CURRENCY_DEDUCTION' as any, 'platform', 'bulk', {
      fiatAmount, currency, krPerUser: krAmount,
      usersAffected: matchingWallets.length,
      totalKrDeducted: totalDeducted.toString(),
      reason
    }, ip, ua);

    return {
      success: true,
      usersAffected: matchingWallets.length,
      krPerUser: krAmount,
      totalKrDeducted: totalDeducted.toNumber(),
      fiatAmount,
      currency,
    };
  }

  // ─── HELPERS ────────────────────────────────────────────

  private static fuzzyNameMatch(name1: string, name2: string): { isMatch: boolean; similarity: number } {
    const normalize = (s: string) => s.replace(/[^a-z]/g, '').toLowerCase();
    const n1 = normalize(name1);
    const n2 = normalize(name2);

    if (n1 === n2) return { isMatch: true, similarity: 1.0 };

    // Check if one contains the other
    if (n1.includes(n2) || n2.includes(n1)) return { isMatch: true, similarity: 0.9 };

    // Simple Levenshtein-based similarity
    const len = Math.max(n1.length, n2.length);
    if (len === 0) return { isMatch: true, similarity: 1.0 };

    const dist = this.levenshtein(n1, n2);
    const similarity = 1 - dist / len;

    return { isMatch: similarity >= 0.75, similarity };
  }

  private static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    return matrix[b.length][a.length];
  }
}
