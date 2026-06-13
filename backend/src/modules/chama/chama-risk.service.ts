import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { io } from '../../shared/gateway/socket.js';
import { randomUUID } from 'crypto';
import crypto from 'crypto';

export class ChamaRiskService {
  /**
   * Scan all active chamas for overdue contributions and flag defaulters.
   * This would typically be called by a CRON job.
   */
  static async checkDefaults() {
    const activeCycles = await prisma.chama_cycle.findMany({
      where: {
        status: { in: ['COLLECTING', 'OPEN'] },
        end_date: { lt: new Date() } // Past due
      },
      include: {
        chama: { include: { chama_member: { where: { status: 'ACTIVE' } } } }
      }
    });

    const results = [];

    for (const cycle of activeCycles) {
      const chama = cycle.chama;

      for (const member of chama.chama_member) {
        // Did they contribute this cycle?
        const contribution = await prisma.chama_contribution.findFirst({
          where: {
            chama_id: chama.id,
            user_id: member.user_id,
            cycle_number: cycle.cycle_number
          }
        });

        if (!contribution || Number(contribution.amount_kr) < Number(chama.contribution_amount_kr)) {
          // Flag as defaulter
          const owed = Number(chama.contribution_amount_kr) - (contribution ? Number(contribution.amount_kr) : 0);
          const penalty = chama.penalty_amount_kr ? Number(chama.penalty_amount_kr) : 0;

          const defaulter = await prisma.chamaDefaulter.create({
            data: {
              id: randomUUID(),
              user_id: member.user_id,
              chama_id: chama.id,
              chama_name: chama.name,
              amount_owed_kr: new Prisma.Decimal(owed),
              fine_amount_kr: new Prisma.Decimal(penalty),
            }
          } as any);

          // Mark member
          await prisma.chama_member.update({
            where: { id: member.id },
            data: { is_defaulter: true }
          });

          // System message
          await prisma.messages.create({
            data: {
              id: randomUUID(),
              chat_id: chama.chat_id,
              sender_id: member.user_id,
              payload: `⚠️ System Notice: Member has been flagged as a defaulter for missing Cycle #${cycle.cycle_number} contribution. Owed: ${owed} Kr. Penalty: ${penalty} Kr.`,
              is_system_event: true,
              status: 'sent',
            },
          });

          results.push(defaulter);
        }
      }

      // Mark cycle as disbursing
      await prisma.chama_cycle.update({
        where: { id: cycle.id },
        data: { status: 'DISBURSING' }
      });
    }

    return { processed: activeCycles.length, newDefaulters: results.length };
  }

  /**
   * Flag a member as a defaulter manually (Admin only).
   */
  static async flagDefaulter(adminId: string, chama_id: string, targetUserId: string, amountOwed: number) {
    return prisma.$transaction(async (tx) => {
      const admin = await tx.chama_member.findUnique({
        where: { chama_id_user_id: { chama_id, user_id: adminId } },
      });
      if (!admin || admin.role !== 'ADMIN') throw new Error('Only Admin can flag defaulters');

      const target = await tx.chama_member.findUnique({
        where: { chama_id_user_id: { chama_id, user_id: targetUserId } },
      });
      if (!target || target.status !== 'ACTIVE') throw new Error('Target is not an active member');

      const chama = await tx.chama.findUnique({ where: { id: chama_id } });
      if (!chama) throw new Error('Chama not found');

      const defaulter = await tx.chamaDefaulter.create({
        data: {
          id: randomUUID(),
          user_id: targetUserId,
          chama_id,
          chama_name: chama.name,
          amount_owed_kr: new Prisma.Decimal(amountOwed),
          fine_amount_kr: chama.penalty_amount_kr || 0,
        }
      });

      await tx.chama_member.update({
        where: { id: target.id },
        data: { is_defaulter: true }
      });

      // System message
      const targetUser = await tx.user.findUnique({ select: { display_name: true }, where: { id: targetUserId } });
      await tx.messages.create({
        data: {
          id: randomUUID(),
          chat_id: chama.chat_id,
          sender_id: adminId,
          payload: `⚠️ System Notice: ${targetUser?.display_name} has been flagged as a defaulter by Admin.`,
          is_system_event: true,
          status: 'sent',
        },
      });

      return defaulter;
    });
  }

  /**
   * Send payment reminder to a member (push notification + system message).
   */
  static async sendReminder(chamaId: string, user_id: string, cycle_number: number) {
    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    if (!chama) throw new Error('Chama not found');

    const member = await prisma.chama_member.findUnique({
      where: { chama_id_user_id: { chama_id: chamaId, user_id } },
    });
    if (!member || member.status !== 'ACTIVE') throw new Error('Member not found');

    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { display_name: true },
    });

    // System message in chat
    await prisma.messages.create({
      data: {
        id: randomUUID(),
        chat_id: chama.chat_id,
        sender_id: user_id,
        payload: `⏰ Reminder: ${user?.display_name}, your contribution for Cycle #${cycle_number} is due. Amount: ${chama.contribution_amount_kr} Kr.`,
        is_system_event: true,
        status: 'sent',
      },
    });

    // Emit push notification event (to be handled by notification service)
    io.to(`user:${user_id}`).emit('notification:payment_reminder', {
      chama_id: chamaId,
      chamaName: chama.name,
      cycle_number,
      amount_kr: Number(chama.contribution_amount_kr),
      message: `Your contribution for ${chama.name} is due!`,
    });

    return { success: true, message: 'Reminder sent' };
  }

  /**
   * Warn other chamas about a defaulter when they try to join.
   */
  static async warnGroups(userId: string, targetChamaId: string) {
    const activeDefaults = await prisma.chamaDefaulter.findMany({
      where: { user_id: userId, is_resolved: false },
      include: { chama: { select: { name: true } } },
    });

    if (activeDefaults.length === 0) return { warnings: 0 };

    const targetChama = await prisma.chama.findUnique({ where: { id: targetChamaId } });
    if (!targetChama) throw new Error('Target chama not found');

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { display_name: true },
    });

    // Send warning message to target chama
    const warningText = activeDefaults
      .map((d) => `${d.chama.name} (${Number(d.amount_owed_kr)} Kr owed)`)
      .join(', ');

    await prisma.messages.create({
      data: {
        id: randomUUID(),
        chat_id: targetChama.chat_id,
        sender_id: userId,
        payload: `⚠️ DEFAULTER WARNING: ${user?.display_name} has ${activeDefaults.length} unresolved default(s) in: ${warningText}`,
        is_system_event: true,
        status: 'sent',
      },
    });

    return { warnings: activeDefaults.length, chamas: activeDefaults.map((d) => d.chama_name) };
  }

  /**
   * Apply penalty to a defaulting member.
   */
  static async applyPenalty(adminId: string, chama_id: string, targetUserId: string) {
    return prisma.$transaction(async (tx) => {
      const admin = await tx.chama_member.findUnique({
        where: { chama_id_user_id: { chama_id, user_id: adminId } },
      });
      if (!admin || admin.role !== 'ADMIN') throw new Error('Only Admin can apply penalties');

      const chama = await tx.chama.findUnique({ where: { id: chama_id } });
      if (!chama || !chama.penalty_amount_kr) throw new Error('No penalty configured for this Chama');

      const target = await tx.chama_member.findUnique({
        where: { chama_id_user_id: { chama_id, user_id: targetUserId } },
      });
      if (!target || target.status !== 'ACTIVE') throw new Error('Target is not an active member');

      // Check if user has wallet balance
      const wallet = await tx.wallets.findUnique({ where: { user_id: targetUserId } });
      if (!wallet || Number(wallet.kr_balance) < Number(chama.penalty_amount_kr)) {
        // Flag as defaulter if can't pay penalty
        await tx.chamaDefaulter.create({
          data: {
            id: randomUUID(),
            user_id: targetUserId,
            chama_id,
            chama_name: chama.name,
            amount_owed_kr: 0,
            fine_amount_kr: chama.penalty_amount_kr,
          },
        });

        throw new Error('Member has insufficient balance to pay penalty. Flagged as defaulter.');
      }

      // Debit user wallet
      await tx.wallets.update({
        where: { user_id: targetUserId },
        data: { kr_balance: { decrement: chama.penalty_amount_kr } },
      });

      // Credit chama wallet
      await tx.chamaWallet.update({
        where: { chama_id },
        data: { kr_balance: { increment: chama.penalty_amount_kr } },
      });

      // Record transaction
      await tx.chama_transaction.create({
        data: {
          id: randomUUID(),
          chama_id,
          user_id: targetUserId,
          type: 'PENALTY',
          amount_kr: chama.penalty_amount_kr,
          description: 'Late payment penalty',
        },
      });

      // System message
      const targetUser = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { display_name: true },
      });
      await tx.messages.create({
        data: {
          id: randomUUID(),
          chat_id: chama.chat_id,
          sender_id: adminId,
          payload: `💸 Penalty of ${chama.penalty_amount_kr} Kr applied to ${targetUser?.display_name} for late payment.`,
          is_system_event: true,
          status: 'sent',
        },
      });

      return { success: true, penaltyAmount: Number(chama.penalty_amount_kr) };
    });
  }

  /**
   * Get defaulter status for a specific user.
   */
  static async getUserDefaultStatus(userId: string) {
    const defaults = await prisma.chamaDefaulter.findMany({
      where: { user_id: userId, is_resolved: false },
      include: {
        chama: { select: { name: true } },
      },
    });

    const totalOwed = defaults.reduce(
      (sum: number, d) => sum + Number(d.amount_owed_kr) + Number(d.fine_amount_kr),
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
