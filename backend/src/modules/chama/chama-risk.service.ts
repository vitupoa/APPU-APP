import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';
import { io } from '../../shared/gateway/socket.js';

export class ChamaRiskService {
  /**
   * Scan all active chamas for overdue contributions and flag defaulters.
   * This would typically be called by a CRON job.
   */
  static async checkDefaults() {
    const activeCycles = await prisma.chamaCycle.findMany({
      where: {
        status: { in: ['COLLECTING', 'OPEN'] },
        endDate: { lt: new Date() } // Past due
      },
      include: {
        chama: { include: { members: { where: { status: 'ACTIVE' } } } }
      }
    });

    const results = [];

    for (const cycle of activeCycles) {
      const chama = cycle.chama;

      for (const member of chama.members) {
        // Did they contribute this cycle?
        const contribution = await prisma.chamaContribution.findFirst({
          where: {
            chamaId: chama.id,
            userId: member.userId,
            cycleNumber: cycle.cycleNumber
          }
        });

        if (!contribution || Number(contribution.amountKr) < Number(chama.contributionAmountKr)) {
          // Flag as defaulter
          const owed = Number(chama.contributionAmountKr) - (contribution ? Number(contribution.amountKr) : 0);
          const penalty = chama.penaltyAmountKr ? Number(chama.penaltyAmountKr) : 0;

          const defaulter = await prisma.chamaDefaulter.create({
            data: {
              userId: member.userId,
              chamaId: chama.id,
              chamaName: chama.name,
              amountOwedKr: new Prisma.Decimal(owed),
              fineAmountKr: new Prisma.Decimal(penalty),
            }
          });

          // Mark member
          await prisma.chamaMember.update({
            where: { id: member.id },
            data: { isDefaulter: true }
          });

          // System message
          await prisma.message.create({
            data: {
              chatId: chama.chatId,
              senderId: member.userId,
              payload: `⚠️ System Notice: Member has been flagged as a defaulter for missing Cycle #${cycle.cycleNumber} contribution. Owed: ${owed} Kr. Penalty: ${penalty} Kr.`,
              isSystemEvent: true,
              status: 'sent',
            },
          });

          results.push(defaulter);
        }
      }

      // Mark cycle as overdue/disbursing
      await prisma.chamaCycle.update({
        where: { id: cycle.id },
        data: { status: 'DISBURSING' }
      });
    }

    return { processed: activeCycles.length, newDefaulters: results.length };
  }

  /**
   * Flag a member as a defaulter manually (Admin only).
   */
  static async flagDefaulter(adminId: string, chamaId: string, targetUserId: string, amountOwed: number) {
    return prisma.$transaction(async (tx) => {
      const admin = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: adminId } },
      });
      if (!admin || admin.role !== 'ADMIN') throw new Error('Only Admin can flag defaulters');

      const target = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: targetUserId } },
      });
      if (!target || target.status !== 'ACTIVE') throw new Error('Target is not an active member');

      const chama = await tx.chama.findUnique({ where: { id: chamaId } });
      if (!chama) throw new Error('Chama not found');

      const defaulter = await tx.chamaDefaulter.create({
        data: {
          userId: targetUserId,
          chamaId,
          chamaName: chama.name,
          amountOwedKr: new Prisma.Decimal(amountOwed),
          fineAmountKr: chama.penaltyAmountKr || 0,
        }
      });

      await tx.chamaMember.update({
        where: { id: target.id },
        data: { isDefaulter: true }
      });

      // System message
      const targetUser = await tx.user.findUnique({ select: { displayName: true }, where: { id: targetUserId } });
      await tx.message.create({
        data: {
          chatId: chama.chatId,
          senderId: adminId,
          payload: `⚠️ System Notice: ${targetUser?.displayName} has been flagged as a defaulter by Admin.`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      return defaulter;
    });
  }

  /**
   * Send payment reminder to a member (push notification + system message).
   */
  static async sendReminder(chamaId: string, userId: string, cycleNumber: number) {
    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    if (!chama) throw new Error('Chama not found');

    const member = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId } },
    });
    if (!member || member.status !== 'ACTIVE') throw new Error('Member not found');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });

    // System message in chat
    await prisma.message.create({
      data: {
        chatId: chama.chatId,
        senderId: userId,
        payload: `⏰ Reminder: ${user?.displayName}, your contribution for Cycle #${cycleNumber} is due. Amount: ${chama.contributionAmountKr} Kr.`,
        isSystemEvent: true,
        status: 'sent',
      },
    });

    // Emit push notification event (to be handled by notification service)
    io.to(`user:${userId}`).emit('notification:payment_reminder', {
      chamaId,
      chamaName: chama.name,
      cycleNumber,
      amountKr: Number(chama.contributionAmountKr),
      message: `Your contribution for ${chama.name} is due!`,
    });

    return { success: true, message: 'Reminder sent' };
  }

  /**
   * Warn other chamas about a defaulter when they try to join.
   */
  static async warnGroups(userId: string, targetChamaId: string) {
    const activeDefaults = await prisma.chamaDefaulter.findMany({
      where: { userId, isResolved: false },
      include: { chama: { select: { name: true } } },
    });

    if (activeDefaults.length === 0) return { warnings: 0 };

    const targetChama = await prisma.chama.findUnique({ where: { id: targetChamaId } });
    if (!targetChama) throw new Error('Target chama not found');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });

    // Send warning message to target chama
    const warningText = activeDefaults
      .map((d: any) => `${d.chama.name} (${Number(d.amountOwedKr)} Kr owed)`)
      .join(', ');

    await prisma.message.create({
      data: {
        chatId: targetChama.chatId,
        senderId: userId,
        payload: `⚠️ DEFAULTER WARNING: ${user?.displayName} has ${activeDefaults.length} unresolved default(s) in: ${warningText}`,
        isSystemEvent: true,
        status: 'sent',
      },
    });

    return { warnings: activeDefaults.length, chamas: activeDefaults.map((d: any) => d.chamaName) };
  }

  /**
   * Apply penalty to a defaulting member.
   */
  static async applyPenalty(adminId: string, chamaId: string, targetUserId: string) {
    return prisma.$transaction(async (tx) => {
      const admin = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: adminId } },
      });
      if (!admin || admin.role !== 'ADMIN') throw new Error('Only Admin can apply penalties');

      const chama = await tx.chama.findUnique({ where: { id: chamaId } });
      if (!chama || !chama.penaltyAmountKr) throw new Error('No penalty configured for this Chama');

      const target = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: targetUserId } },
      });
      if (!target || target.status !== 'ACTIVE') throw new Error('Target is not an active member');

      // Check if user has wallet balance
      const wallet = await tx.wallet.findUnique({ where: { userId: targetUserId } });
      if (!wallet || Number(wallet.krBalance) < Number(chama.penaltyAmountKr)) {
        // Flag as defaulter if can't pay penalty
        await tx.chamaDefaulter.create({
          data: {
            userId: targetUserId,
            chamaId,
            chamaName: chama.name,
            amountOwedKr: 0,
            fineAmountKr: chama.penaltyAmountKr,
          },
        });

        throw new Error('Member has insufficient balance to pay penalty. Flagged as defaulter.');
      }

      // Debit user wallet
      await tx.wallet.update({
        where: { userId: targetUserId },
        data: { krBalance: { decrement: chama.penaltyAmountKr } },
      });

      // Credit chama wallet
      await tx.chamaWallet.update({
        where: { chamaId },
        data: { krBalance: { increment: chama.penaltyAmountKr } },
      });

      // Record transaction
      await tx.chamaTransaction.create({
        data: {
          chamaId,
          userId: targetUserId,
          type: 'PENALTY',
          amountKr: chama.penaltyAmountKr,
          description: 'Late payment penalty',
        },
      });

      // System message
      const targetUser = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { displayName: true },
      });
      await tx.message.create({
        data: {
          chatId: chama.chatId,
          senderId: adminId,
          payload: `💸 Penalty of ${chama.penaltyAmountKr} Kr applied to ${targetUser?.displayName} for late payment.`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      return { success: true, penaltyAmount: Number(chama.penaltyAmountKr) };
    });
  }

  /**
   * Get defaulter status for a specific user.
   */
  static async getUserDefaultStatus(userId: string) {
    const defaults = await prisma.chamaDefaulter.findMany({
      where: { userId, isResolved: false },
      include: {
        chama: { select: { name: true, avatarUrl: true } },
      },
    });

    const totalOwed = defaults.reduce(
      (sum, d) => sum + Number(d.amountOwedKr) + Number(d.fineAmountKr),
      0
    );

    return {
      isDefaulter: defaults.length > 0,
      defaultCount: defaults.length,
      totalOwed,
      defaults,
    };
  }
}
