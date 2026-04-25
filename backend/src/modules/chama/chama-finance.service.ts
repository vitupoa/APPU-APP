import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';
import { io } from '../../shared/gateway/socket.js';

export class ChamaFinanceService {
  /**
   * Make a contribution to the chama from user's Kr wallet.
   * Posts a system message with name, amount, and time.
   */
  static async contribute(userId: string, chamaId: string, amountKr: number) {
    return prisma.$transaction(async (tx) => {
      const chama = await tx.chama.findUnique({
        where: { id: chamaId },
        include: { chamaWallet: true },
      });
      if (!chama) throw new Error('Chama not found');
      if (chama.status !== 'ACTIVE') throw new Error('Chama is not active');

      const member = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId } },
      });
      if (!member || member.status !== 'ACTIVE') {
        throw new Error('You are not an active member of this Chama');
      }

      // Enforce minimum contribution
      if (amountKr < Number(chama.contributionAmountKr)) {
        throw new Error(`Minimum contribution is ${chama.contributionAmountKr} Kr`);
      }

      // Check wallet balance
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || Number(wallet.krBalance) < amountKr) {
        throw new Error('Insufficient Kr balance');
      }

      const amountDecimal = new Prisma.Decimal(amountKr);

      // Debit user wallet
      await tx.wallet.update({
        where: { userId },
        data: { krBalance: { decrement: amountDecimal } },
      });

      // Credit chama wallet
      await tx.chamaWallet.update({
        where: { chamaId },
        data: { krBalance: { increment: amountDecimal } },
      });

      // Record contribution
      const contribution = await tx.chamaContribution.create({
        data: {
          chamaId,
          memberId: member.id,
          userId,
          cycleNumber: chama.currentCycleNumber,
          amountKr: amountDecimal,
        },
      });

      // Update member totals
      await tx.chamaMember.update({
        where: { id: member.id },
        data: { totalContributed: { increment: amountDecimal } },
      });

      // Update cycle collected amount if a cycle is active
      const activeCycle = await tx.chamaCycle.findFirst({
        where: { chamaId, status: { in: ['OPEN', 'COLLECTING'] } },
      });
      if (activeCycle) {
        await tx.chamaCycle.update({
          where: { id: activeCycle.id },
          data: { collectedAmountKr: { increment: amountDecimal } },
        });
      }

      // Record transaction
      await tx.chamaTransaction.create({
        data: {
          chamaId,
          userId,
          type: 'CONTRIBUTION',
          amountKr: amountDecimal,
          description: `Contribution for cycle ${chama.currentCycleNumber}`,
        },
      });

      // System message with name, amount, and time
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { displayName: true },
      });
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      await tx.message.create({
        data: {
          chatId: chama.chatId,
          senderId: userId,
          payload: `💰 ${user?.displayName} contributed ${amountKr} Kr at ${timeStr}`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      // Broadcast real-time wallet update
      io.to(`chama:${chamaId}`).emit('chama:contribution', {
        chamaId,
        userId,
        displayName: user?.displayName,
        amountKr,
        newBalance: Number(chama.chamaWallet!.krBalance) + amountKr,
        cycleNumber: chama.currentCycleNumber,
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
    chamaId: string,
    recipientUserId: string,
    amountKr: number,
    cycleId?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Verify requester is TREASURER
      const requester = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: requesterId } },
      });
      if (!requester || requester.role !== 'TREASURER') {
        throw new Error('Only the Treasurer can request payouts');
      }

      const chama = await tx.chama.findUnique({
        where: { id: chamaId },
        include: { chamaWallet: true },
      });
      if (!chama) throw new Error('Chama not found');

      // Check chama wallet has enough
      if (Number(chama.chamaWallet!.krBalance) < amountKr) {
        throw new Error('Insufficient Chama funds');
      }

      // Find recipient member
      const recipientMember = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: recipientUserId } },
      });
      if (!recipientMember || recipientMember.status !== 'ACTIVE') {
        throw new Error('Recipient is not an active member');
      }

      const payout = await tx.chamaPayout.create({
        data: {
          chamaId,
          recipientId: recipientUserId,
          memberId: recipientMember.id,
          cycleId,
          amountKr: new Prisma.Decimal(amountKr),
          status: 'PENDING_APPROVAL',
        },
      });

      // System message
      const recipientUser = await tx.user.findUnique({
        where: { id: recipientUserId },
        select: { displayName: true },
      });
      await tx.message.create({
        data: {
          chatId: chama.chatId,
          senderId: requesterId,
          payload: `📋 Payout of ${amountKr} Kr to ${recipientUser?.displayName} has been requested by the Treasurer. Awaiting ${chama.minApprovals} official approvals.`,
          isSystemEvent: true,
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
    chamaId: string,
    payoutId: string,
    decision: 'APPROVED' | 'REJECTED',
    reason?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Verify approver is an official (ADMIN, CHAIRPERSON, TREASURER, SECRETARY)
      const approver = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: approverId } },
      });
      if (!approver || approver.role === 'MEMBER') {
        throw new Error('Only officials can approve/reject payouts');
      }

      const payout = await tx.chamaPayout.findUnique({
        where: { id: payoutId },
        include: { approvals: true },
      });
      if (!payout || payout.chamaId !== chamaId) throw new Error('Payout not found');
      if (payout.status !== 'PENDING_APPROVAL') throw new Error('Payout is no longer pending');

      // Record approval
      const approval = await tx.chamaPayoutApproval.create({
        data: {
          payoutId,
          approverId,
          decision,
          reason,
        },
      });

      const chama = await tx.chama.findUnique({ where: { id: chamaId } });
      if (!chama) throw new Error('Chama not found');

      if (decision === 'REJECTED') {
        await tx.chamaPayout.update({
          where: { id: payoutId },
          data: { status: 'REJECTED' },
        });

        await tx.message.create({
          data: {
            chatId: chama.chatId,
            senderId: approverId,
            payload: `❌ Payout of ${payout.amountKr} Kr was REJECTED. ${reason ? `Reason: ${reason}` : ''}`,
            isSystemEvent: true,
            status: 'sent',
          },
        });

        return { success: true, status: 'REJECTED' };
      }

      // Count approvals
      const totalApprovals = payout.approvals.filter(a => a.decision === 'APPROVED').length + 1;

      if (totalApprovals >= chama.minApprovals) {
        // Auto-disburse
        return ChamaFinanceService.disbursePayout(tx, chama, payout);
      }

      // Still pending
      const approverUser = await tx.user.findUnique({
        where: { id: approverId },
        select: { displayName: true },
      });
      await tx.message.create({
        data: {
          chatId: chama.chatId,
          senderId: approverId,
          payload: `✅ ${approverUser?.displayName} approved the payout (${totalApprovals}/${chama.minApprovals} approvals).`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      return { success: true, status: 'PENDING_APPROVAL', approvals: totalApprovals, required: chama.minApprovals };
    });
  }

  /**
   * Internal: disburse an approved payout.
   */
  private static async disbursePayout(tx: any, chama: any, payout: any) {
    const amountDecimal = new Prisma.Decimal(Number(payout.amountKr));

    // Debit chama wallet
    await tx.chamaWallet.update({
      where: { chamaId: chama.id },
      data: { krBalance: { decrement: amountDecimal } },
    });

    // Credit recipient wallet
    await tx.wallet.upsert({
      where: { userId: payout.recipientId },
      create: { userId: payout.recipientId, krBalance: amountDecimal },
      update: { krBalance: { increment: amountDecimal } },
    });

    // Update member totals
    await tx.chamaMember.update({
      where: { id: payout.memberId },
      data: { totalReceived: { increment: amountDecimal } },
    });

    // Mark payout as disbursed
    await tx.chamaPayout.update({
      where: { id: payout.id },
      data: { status: 'DISBURSED', disbursedAt: new Date() },
    });

    // Record transaction
    await tx.chamaTransaction.create({
      data: {
        chamaId: chama.id,
        userId: payout.recipientId,
        type: 'PAYOUT',
        amountKr: amountDecimal,
        description: `Payout disbursed`,
      },
    });

    // Record in user's personal transaction history
    await tx.transaction.create({
      data: {
        userId: payout.recipientId,
        type: 'chama_payout',
        amountKr: amountDecimal,
        status: 'completed',
        reference: `chama:${chama.id}:payout:${payout.id}`,
        metadata: { chamaName: chama.name },
      },
    });

    // System message
    const recipientUser = await tx.user.findUnique({
      where: { id: payout.recipientId },
      select: { displayName: true },
    });
    await tx.message.create({
      data: {
        chatId: chama.chatId,
        senderId: payout.recipientId,
        payload: `🎉 ${Number(payout.amountKr)} Kr has been disbursed to ${recipientUser?.displayName ?? 'member'}'s wallet!`,
        isSystemEvent: true,
        status: 'sent',
      },
    });

    // Broadcast
    io.to(`chama:${chama.id}`).emit('chama:payout_disbursed', {
      chamaId: chama.id,
      recipientId: payout.recipientId,
      amountKr: Number(payout.amountKr),
    });

    return { success: true, status: 'DISBURSED' };
  }

  /**
   * Get chama wallet balance (real-time).
   */
  static async getBalance(chamaId: string) {
    const wallet = await prisma.chamaWallet.findUnique({ where: { chamaId } });
    if (!wallet) throw new Error('Chama wallet not found');
    return { krBalance: wallet.krBalance };
  }

  /**
   * Get full transaction history for a chama.
   */
  static async getTransactions(chamaId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.chamaTransaction.findMany({
        where: { chamaId },
        include: {
          user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.chamaTransaction.count({ where: { chamaId } }),
    ]);
    return { transactions, total, page, limit };
  }

  /**
   * Upload external receipt (for accountability of off-platform transactions).
   */
  static async uploadReceipt(
    userId: string,
    chamaId: string,
    description: string,
    receiptUrl: string,
    amountKr?: number
  ) {
    // Verify membership
    const member = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId } },
    });
    if (!member || member.status !== 'ACTIVE') {
      throw new Error('Not a member of this Chama');
    }

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    if (!chama) throw new Error('Chama not found');

    const transaction = await prisma.chamaTransaction.create({
      data: {
        chamaId,
        userId,
        type: 'EXTERNAL',
        amountKr: new Prisma.Decimal(amountKr ?? 0),
        description,
        receiptUrl,
      },
    });

    // System message
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    });
    await prisma.message.create({
      data: {
        chatId: chama.chatId,
        senderId: userId,
        payload: `📎 ${user?.displayName} uploaded a receipt: ${description}${amountKr ? ` (${amountKr} Kr)` : ''}`,
        isSystemEvent: true,
        status: 'sent',
      },
    });

    return { success: true, transaction };
  }
}
