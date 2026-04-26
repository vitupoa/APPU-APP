import { prisma } from '../../../config/database.js';
import { Prisma } from '../../../generated/prisma/client.js';
import { AuditService } from './audit.service.js';
import { ADMIN_ACTIONS } from '../rembrandt-rar.types.js';
import { ExchangeService } from '../../../services/exchange/exchange.service.js';

export class FinancialService {
  // ─── PLATFORM WALLET ────────────────────────────────────

  static async getPlatformWallets() {
    return prisma.platformWallet.findMany();
  }

  static async ensurePlatformWallet(label = 'main') {
    return prisma.platformWallet.upsert({
      where: { label },
      create: { label, krBalance: 0 },
      update: {},
    });
  }

  static async platformWalletAction(
    adminId: string,
    data: { amountKr: number; action: 'topup' | 'withdraw'; reason: string },
    ip?: string, ua?: string
  ) {
    const wallet = await this.ensurePlatformWallet('main');
    const amount = new Prisma.Decimal(data.amountKr);

    if (data.action === 'withdraw' && wallet.krBalance.lessThan(amount)) {
      throw new Error('Insufficient platform wallet balance');
    }

    const updated = await prisma.platformWallet.update({
      where: { label: 'main' },
      data: {
        krBalance: data.action === 'topup'
          ? { increment: amount }
          : { decrement: amount }
      }
    });

    const auditAction = data.action === 'topup'
      ? ADMIN_ACTIONS.PLATFORM_WALLET_TOPUP
      : ADMIN_ACTIONS.PLATFORM_WALLET_WITHDRAW;

    await AuditService.log(adminId, auditAction, 'platform_wallet', 'main', {
      amountKr: data.amountKr, reason: data.reason
    }, ip, ua);

    return { success: true, newBalance: updated.krBalance, action: data.action };
  }

  // ─── USER WALLET TOPUP ──────────────────────────────────

  static async topupUserWallet(
    adminId: string,
    data: { userId: string; amountKr: number; reason: string },
    ip?: string, ua?: string
  ) {
    const amount = new Prisma.Decimal(data.amountKr);

    const wallet = await prisma.wallet.upsert({
      where: { userId: data.userId },
      create: { userId: data.userId, krBalance: amount },
      update: { krBalance: { increment: amount } },
    });

    await prisma.transaction.create({
      data: {
        userId: data.userId,
        type: 'admin_topup',
        amountKr: amount,
        status: 'completed',
        provider: 'platform_admin',
        counterpartyId: adminId,
        metadata: { reason: data.reason, adminId },
      }
    });

    await AuditService.log(adminId, ADMIN_ACTIONS.USER_WALLET_TOPUP, 'user', data.userId, {
      amountKr: data.amountKr, reason: data.reason
    }, ip, ua);

    return { success: true, newBalance: wallet.krBalance };
  }

  // ─── WITHDRAWALS ────────────────────────────────────────

  static async listWithdrawals(options: {
    page?: number; limit?: number; status?: string; userId?: string;
  }) {
    const { page = 1, limit = 20, status, userId } = options;
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [items, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, displayName: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.withdrawalRequest.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async getWithdrawalDetail(withdrawalId: string) {
    return prisma.withdrawalRequest.findUniqueOrThrow({
      where: { id: withdrawalId },
      include: {
        user: {
          select: {
            id: true, username: true, displayName: true,
            firstName: true, lastName: true, email: true, country: true
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
    const withdrawal = await prisma.withdrawalRequest.findUniqueOrThrow({
      where: { id: withdrawalId },
      include: { user: { select: { firstName: true, lastName: true, displayName: true } } }
    });

    if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'FLAGGED') {
      throw new Error(`Cannot review withdrawal in ${withdrawal.status} status`);
    }

    // Name matching check
    const krietaName = `${withdrawal.user.firstName} ${withdrawal.user.lastName}`.toLowerCase().trim();
    const accountName = withdrawal.accountName.toLowerCase().trim();
    const nameMatch = this.fuzzyNameMatch(krietaName, accountName);

    if (data.action === 'approve') {
      if (!nameMatch.isMatch) {
        // Auto-flag if names don't match, admin must explicitly override
        if (withdrawal.nameMatchStatus !== 'admin_override') {
          return {
            success: false,
            warning: 'NAME_MISMATCH',
            message: `Account name "${withdrawal.accountName}" does not match Krieta name "${withdrawal.user.firstName} ${withdrawal.user.lastName}"`,
            similarity: nameMatch.similarity,
            requiresOverride: true,
          };
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.withdrawalRequest.update({
          where: { id: withdrawalId },
          data: {
            status: 'APPROVED',
            nameMatchStatus: nameMatch.isMatch ? 'match' : 'admin_override',
            reviewedBy: adminId,
            reviewNote: data.note,
            reviewedAt: new Date(),
          }
        });

        // Calculate invisible withdrawal fee (KES 1 → Kr)
        const withdrawalFeeKr = await ExchangeService.getWithdrawalFeeKr();
        const totalDeduction = withdrawal.amountKr.add(new Prisma.Decimal(withdrawalFeeKr));

        // Deduct from user wallet (withdrawal amount + invisible fee)
        await tx.wallet.update({
          where: { userId: withdrawal.userId },
          data: { krBalance: { decrement: totalDeduction } }
        });

        await tx.transaction.create({
          data: {
            userId: withdrawal.userId,
            type: 'withdraw',
            amountKr: withdrawal.amountKr,
            amountFiat: withdrawal.amountFiat,
            currency: withdrawal.currency,
            status: 'completed',
            provider: withdrawal.provider,
            counterpartyId: adminId,
          }
        });

        // Credit withdrawal fee to @JohnOyugi's operational wallet
        if (withdrawalFeeKr > 0) {
          const opsUser = await tx.user.findFirst({ where: { username: 'JohnOyugi' } });
          if (opsUser) {
            await tx.wallet.upsert({
              where: { userId: opsUser.id },
              create: { userId: opsUser.id, krBalance: new Prisma.Decimal(withdrawalFeeKr) },
              update: { krBalance: { increment: new Prisma.Decimal(withdrawalFeeKr) } },
            });
          }
        }
      });

      await AuditService.log(adminId, ADMIN_ACTIONS.WITHDRAWAL_APPROVE, 'withdrawal', withdrawalId, {
        amountKr: withdrawal.amountKr.toString(), note: data.note
      }, ip, ua);

      return { success: true, message: 'Withdrawal approved' };

    } else {
      await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'REJECTED',
          reviewedBy: adminId,
          reviewNote: data.note || 'Rejected by admin',
          reviewedAt: new Date(),
        }
      });

      await AuditService.log(adminId, ADMIN_ACTIONS.WITHDRAWAL_REJECT, 'withdrawal', withdrawalId, {
        note: data.note
      }, ip, ua);

      return { success: true, message: 'Withdrawal rejected' };
    }
  }

  static async overrideNameMatch(adminId: string, withdrawalId: string) {
    await prisma.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: { nameMatchStatus: 'admin_override' }
    });
    return { success: true, message: 'Name match overridden by admin' };
  }

  // ─── TRANSACTIONS ───────────────────────────────────────

  static async listTransactions(options: {
    page?: number; limit?: number; userId?: string; type?: string; status?: string;
  }) {
    const { page = 1, limit = 50, userId, type, status } = options;
    const where: any = {};
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where, orderBy: { createdAt: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.transaction.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── ESCROW ─────────────────────────────────────────────

  static async listEscrows(options: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = options;
    const where: any = {};
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.escrow.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, displayName: true } },
          contest: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit, skip: (page - 1) * limit,
      }),
      prisma.escrow.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async releaseEscrow(adminId: string, escrowId: string, ip?: string, ua?: string) {
    const escrow = await prisma.escrow.findUniqueOrThrow({ where: { id: escrowId } });
    if (escrow.status !== 'held') throw new Error('Escrow not in held status');

    await prisma.$transaction(async (tx) => {
      await tx.escrow.update({ where: { id: escrowId }, data: { status: 'released' } });
      await tx.wallet.update({
        where: { userId: escrow.userId },
        data: { krBalance: { increment: escrow.prizeAmountKr } }
      });
    });

    await AuditService.log(adminId, ADMIN_ACTIONS.ESCROW_RELEASE, 'escrow', escrowId, {
      amountKr: escrow.prizeAmountKr.toString()
    }, ip, ua);
    return { success: true, message: 'Escrow released' };
  }

  static async refundEscrow(adminId: string, escrowId: string, ip?: string, ua?: string) {
    const escrow = await prisma.escrow.findUniqueOrThrow({ where: { id: escrowId } });
    if (escrow.status !== 'held') throw new Error('Escrow not in held status');

    await prisma.$transaction(async (tx) => {
      await tx.escrow.update({ where: { id: escrowId }, data: { status: 'refunded' } });
      const totalRefund = escrow.prizeAmountKr.add(escrow.feeAmountKr);
      await tx.wallet.update({
        where: { userId: escrow.userId },
        data: { krBalance: { increment: totalRefund } }
      });
    });

    await AuditService.log(adminId, ADMIN_ACTIONS.ESCROW_REFUND, 'escrow', escrowId, {}, ip, ua);
    return { success: true, message: 'Escrow refunded' };
  }

  // ─── FEE CONFIG ─────────────────────────────────────────

  static async getFeeConfig() {
    const config = await prisma.platformConfig.findUnique({ where: { key: 'fee_structure' } });
    return config?.value ?? {
      tipFeePercent: 15,
      contestFeePercent: 10,
      shopFeePercent: 8,
      subscriptionFeePercent: 15,
      withdrawalFeePercent: 2,
    };
  }

  static async updateFeeConfig(adminId: string, fees: Record<string, number>, ip?: string, ua?: string) {
    await prisma.platformConfig.upsert({
      where: { key: 'fee_structure' },
      create: { key: 'fee_structure', value: fees, updatedBy: adminId },
      update: { value: fees, updatedBy: adminId },
    });
    await AuditService.log(adminId, ADMIN_ACTIONS.FEE_UPDATE, 'config', 'fee_structure', fees, ip, ua);
    return { success: true, fees };
  }

  // ─── BULK CURRENCY DEDUCTION ────────────────────────────
  /**
   * Super Admin enters a fiat amount + currency code (e.g. $1 USD, Tsh 1 TZS).
   * All users whose wallet currency matches get that fiat amount silently
   * deducted from their Kr balance. The total is credited to the platform revenue wallet.
   */
  static async bulkCurrencyDeduction(
    adminId: string,
    data: { fiatAmount: number; currency: string; reason: string },
    ip?: string, ua?: string
  ) {
    const { fiatAmount, currency, reason } = data;

    // Convert fiat amount → USD → Kr
    const usdToFiatRate = await ExchangeService.getRate(currency);
    const fiatInUsd = fiatAmount / usdToFiatRate;
    const krAmount = ExchangeService.getKrFromUSD(fiatInUsd);
    const krDecimal = new Prisma.Decimal(krAmount);

    if (krAmount <= 0) throw new Error('Deduction amount too small to convert');

    // Find all users with matching currency who have sufficient balance
    const matchingWallets = await prisma.wallet.findMany({
      where: {
        user: { currency: { equals: currency, mode: 'insensitive' } },
        krBalance: { gte: krDecimal }
      },
      select: { userId: true, krBalance: true }
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
        batch.map(w =>
          prisma.wallet.update({
            where: { userId: w.userId },
            data: { krBalance: { decrement: krDecimal } }
          })
        )
      );
      totalDeducted = totalDeducted.add(krDecimal.mul(batch.length));
    }

    // Credit total deducted to @JohnOyugi's operational wallet
    const opsUser = await prisma.user.findFirst({ where: { username: 'JohnOyugi' } });
    if (opsUser) {
      await prisma.wallet.upsert({
        where: { userId: opsUser.id },
        create: { userId: opsUser.id, krBalance: totalDeducted },
        update: { krBalance: { increment: totalDeducted } },
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
