import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { io } from '../../shared/gateway/socket.js';
import { randomUUID } from 'crypto';

export class ChamaFinanceService {
  /**
   * Make a contribution to the chama from user's Kr wallet.
   * Posts a system message with name, amount, and time.
   */
  static async contribute(userId: string, chama_id: string, amount_kr: number) {
    return prisma.$transaction(async (tx) => {
      const chama = await tx.chama.findUnique({
        where: { id: chama_id },
        include: { chama_wallet: true },
      });
      if (!chama) throw new Error('Chama not found');
      if (chama.status !== 'ACTIVE') throw new Error('Chama is not active');

      const member = await tx.chamaMember.findUnique({
        where: { chama_id_user_id: { chama_id, user_id: userId } },
      });
      if (!member || member.status !== 'ACTIVE') {
        throw new Error('You are not an active member of this Chama');
      }

      // Enforce minimum contribution
      if (amount_kr < Number(chama.contribution_amount_kr)) {
        throw new Error(`Minimum contribution is ${chama.contribution_amount_kr} Kr`);
      }

      // Check wallet balance
      const wallet = await tx.wallets.findUnique({ where: { user_id: userId } });
      if (!wallet || Number(wallet.kr_balance) < amount_kr) {
        throw new Error('Insufficient Kr balance');
      }

      const amountDecimal = new Prisma.Decimal(amount_kr);

      // Debit user wallet
      await tx.wallets.update({
        where: { user_id: userId },
        data: { kr_balance: { decrement: amountDecimal } },
      });

      // Credit chama wallet
      await tx.chamaWallet.update({
        where: { chama_id },
        data: { kr_balance: { increment: amountDecimal } },
      });

      // Record contribution
      const contribution = await tx.chamaContribution.create({
        data: {
          id: randomUUID(),
          chama_id,
          member_id: member.id,
          user_id: userId,
          cycle_number: chama.current_cycle_number,
          amount_kr: amountDecimal,
        },
      });

      // Update member totals
      await tx.chamaMember.update({
        where: { id: member.id },
        data: { total_contributed: { increment: amountDecimal } },
      });

      // Update cycle collected amount if a cycle is active
      const activeCycle = await tx.chamaCycle.findFirst({
        where: { chama_id, status: { in: ['OPEN', 'COLLECTING'] } },
      });
      if (activeCycle) {
        await tx.chamaCycle.update({
          where: { id: activeCycle.id },
          data: { collected_amount_kr: { increment: amountDecimal } },
        });
      }

      // Record transaction
      await tx.chamaTransaction.create({
        data: {
          id: randomUUID(),
          chama_id,
          user_id: userId,
          type: 'CONTRIBUTION',
          amount_kr: amountDecimal,
          description: `Contribution for cycle ${chama.current_cycle_number}`,
        },
      });

      // System message with name, amount, and time
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { display_name: true },
      });
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      await tx.messages.create({
        data: {
          id: randomUUID(),
          chat_id: chama.chat_id,
          sender_id: userId,
          payload: `💰 ${user?.display_name} contributed ${amount_kr} Kr at ${timeStr}`,
          is_system_event: true,
          status: 'sent',
        },
      });

      // Broadcast real-time wallet update
      io.to(`chama:${chama_id}`).emit('chama:contribution', {
        chama_id,
        user_id: userId,
        display_name: user?.display_name,
        amount_kr,
        newBalance: Number(chama.chama_wallet!.kr_balance) + amount_kr,
        cycle_number: chama.current_cycle_number,
      });

      return { success: true, contribution };
    });
  }

  /**
   * Treasurer requests a payout to a member.
   * Requires minimum number of official approvals before disbursement.
   */
  static async requestPayout(
    requesterId: string,
    chama_id: string,
    recipientUserId: string,
    amount_kr: number,
    cycleId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Verify requester is TREASURER
      const requester = await tx.chamaMember.findUnique({
        where: { chama_id_user_id: { chama_id, user_id: requesterId } },
      });
      if (!requester || requester.role !== 'TREASURER') {
        throw new Error('Only the Treasurer can request payouts');
      }

      const chama = await tx.chama.findUnique({
        where: { id: chama_id },
        include: { chama_wallet: true },
      });
      if (!chama) throw new Error('Chama not found');

      // Check chama wallet has enough
      if (Number(chama.chama_wallet!.kr_balance) < amount_kr) {
        throw new Error('Insufficient Chama funds');
      }

      // Find recipient member
      const recipientMember = await tx.chamaMember.findUnique({
        where: { chama_id_user_id: { chama_id, user_id: recipientUserId } },
      });
      if (!recipientMember || recipientMember.status !== 'ACTIVE') {
        throw new Error('Recipient is not an active member');
      }

      const payout = await tx.chamaPayout.create({
        data: {
          id: randomUUID(),
          chama_id,
          recipient_id: recipientUserId,
          member_id: recipientMember.id,
          cycle_id: cycleId,
          amount_kr: new Prisma.Decimal(amount_kr),
          status: 'PENDING_APPROVAL',
        },
      });

      // System message
      const recipientUser = await tx.user.findUnique({
        where: { id: recipientUserId },
        select: { display_name: true },
      });
      await tx.messages.create({
        data: {
          id: randomUUID(),
          chat_id: chama.chat_id,
          sender_id: requesterId,
          payload: `📋 Payout of ${amount_kr} Kr to ${recipientUser?.display_name} has been requested by the Treasurer. Awaiting ${chama.min_approvals} official approvals.`,
          is_system_event: true,
          status: 'sent',
        },
      });

      return { success: true, payout };
    });
  }

  /**
   * Official approves or rejects a payout.
   * When min approvals are met, auto-disburses.
   */
  static async approvePayout(
    approverId: string,
    chama_id: string,
    payout_id: string,
    decision: 'APPROVED' | 'REJECTED',
    reason?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Verify approver is an official (ADMIN, CHAIRPERSON, TREASURER, SECRETARY)
      const approver = await tx.chamaMember.findUnique({
        where: { chama_id_user_id: { chama_id, user_id: approverId } },
      });
      if (!approver || approver.role === 'MEMBER') {
        throw new Error('Only officials can approve/reject payouts');
      }

      const payout = await tx.chamaPayout.findUnique({
        where: { id: payout_id },
        include: { approvals: true },
      });
      if (!payout || payout.chama_id !== chama_id) throw new Error('Payout not found');
      if (payout.status !== 'PENDING_APPROVAL') throw new Error('Payout is no longer pending');

      // Record approval
      const approval = await tx.chamaPayoutApproval.create({
        data: {
          id: randomUUID(),
          payout_id,
          approver_id: approverId,
          decision,
          reason,
        },
      });

      const chama = await tx.chama.findUnique({ where: { id: chama_id } });
      if (!chama) throw new Error('Chama not found');

      if (decision === 'REJECTED') {
        await tx.chamaPayout.update({
          where: { id: payout_id },
          data: { status: 'REJECTED' },
        });

        await tx.messages.create({
          data: {
            id: randomUUID(),
            chat_id: chama.chat_id,
            sender_id: approverId,
            payload: `❌ Payout of ${payout.amount_kr} Kr was REJECTED. ${reason ? `Reason: ${reason}` : ''}`,
            is_system_event: true,
            status: 'sent',
          },
        });

        return { success: true, status: 'REJECTED' };
      }

      // Count approvals
      const totalApprovals = payout.approvals.filter((a: any) => a.decision === 'APPROVED').length + 1;

      if (totalApprovals >= chama.min_approvals) {
        // Auto-disburse
        return ChamaFinanceService.disbursePayout(tx, chama, payout);
      }

      // Still pending
      const approverUser = await tx.user.findUnique({
        where: { id: approverId },
        select: { display_name: true },
      });
      await tx.messages.create({
        data: {
          id: randomUUID(),
          chat_id: chama.chat_id,
          sender_id: approverId,
          payload: `✅ ${approverUser?.display_name} approved the payout (${totalApprovals}/${chama.min_approvals} approvals).`,
          is_system_event: true,
          status: 'sent',
        },
      });

      return { success: true, status: 'PENDING_APPROVAL', approvals: totalApprovals, required: chama.min_approvals };
    });
  }

  /**
   * Internal: disburse an approved payout.
   */
  private static async disbursePayout(tx: any, chama: any, payout: any) {
    const amountDecimal = new Prisma.Decimal(Number(payout.amount_kr));

    // Debit chama wallet
    await tx.chamaWallet.update({
      where: { chama_id: chama.id },
      data: { kr_balance: { decrement: amountDecimal } },
    });

    // Credit recipient wallet
    await tx.wallets.upsert({
      where: { user_id: payout.recipient_id },
      create: { user_id: payout.recipient_id, kr_balance: amountDecimal },
      update: { kr_balance: { increment: amountDecimal } },
    });

    // Update member totals
    await tx.chamaMember.update({
      where: { id: payout.member_id },
      data: { total_received: { increment: amountDecimal } },
    });

    // Mark payout as disbursed
    await tx.chamaPayout.update({
      where: { id: payout.id },
      data: { status: 'DISBURSED', disbursed_at: new Date() },
    });

    // Record transaction
    await tx.chamaTransaction.create({
      data: {
        id: randomUUID(),
        chama_id: chama.id,
        user_id: payout.recipient_id,
        type: 'PAYOUT',
        amount_kr: amountDecimal,
        description: `Payout disbursed`,
      },
    });

    // Record in user's personal transaction history
    await tx.transaction.create({
      data: {
        user_id: payout.recipient_id,
        type: 'chama_payout',
        amount_kr: amountDecimal,
        status: 'completed',
        reference: `chama:${chama.id}:payout:${payout.id}`,
        metadata: { chamaName: chama.name },
      },
    });

    // System message
    const recipientUser = await tx.user.findUnique({
      where: { id: payout.recipient_id },
      select: { display_name: true },
    });
    await tx.messages.create({
      data: {
        id: randomUUID(),
        chat_id: chama.chat_id,
        sender_id: payout.recipient_id,
        payload: `🎉 ${Number(payout.amount_kr)} Kr has been disbursed to ${recipientUser?.display_name ?? 'member'}'s wallet!`,
        is_system_event: true,
        status: 'sent',
      },
    });

    // Broadcast
    io.to(`chama:${chama.id}`).emit('chama:payout_disbursed', {
      chama_id: chama.id,
      recipient_id: payout.recipient_id,
      amount_kr: Number(payout.amount_kr),
    });

    return { success: true, status: 'DISBURSED' };
  }

  /**
   * Get chama wallet balance (real-time).
   */
  static async getBalance(chama_id: string) {
    const wallet = await prisma.chamaWallet.findUnique({ where: { chama_id } });
    if (!wallet) throw new Error('Chama wallet not found');
    return { kr_balance: wallet.kr_balance };
  }

  /**
   * Get full transaction history for a chama.
   */
  static async getTransactions(chamaId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.chamaTransaction.findMany({
        where: { chama_id: chamaId },
        include: {
          user: { select: { id: true, username: true, display_name: true, avatar_url: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chamaTransaction.count({ where: { chama_id: chamaId } }),
    ]);
    return { transactions, total, page, limit };
  }

  /**
   * Upload external receipt (for accountability of off-platform transactions).
   */
  static async uploadReceipt(
    userId: string,
    chama_id: string,
    description: string,
    receipt_url: string,
    amountKr?: number
  ) {
    // Verify membership
    const member = await prisma.chamaMember.findUnique({
      where: { chama_id_user_id: { chama_id, user_id: userId } },
    });
    if (!member || member.status !== 'ACTIVE') {
      throw new Error('Not a member of this Chama');
    }

    const chama = await prisma.chama.findUnique({ where: { id: chama_id } });
    if (!chama) throw new Error('Chama not found');

    const transaction = await prisma.chamaTransaction.create({
      data: {
        id: randomUUID(),
        chama_id,
        user_id: userId,
        type: 'EXTERNAL',
        amount_kr: new Prisma.Decimal(amountKr ?? 0),
        description,
        receipt_url,
      },
    });

    // System message
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { display_name: true },
    });
    await prisma.messages.create({
      data: {
        id: randomUUID(),
        chat_id: chama.chat_id,
        sender_id: userId,
        payload: `📎 ${user?.display_name} uploaded a receipt: ${description}${amountKr ? ` (${amountKr} Kr)` : ''}`,
        is_system_event: true,
        status: 'sent',
      },
    });

    return { success: true, transaction };
  }
}
