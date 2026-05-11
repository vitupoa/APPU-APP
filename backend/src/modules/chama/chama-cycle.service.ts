import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';

export class ChamaCycleService {
  /**
   * Start the first cycle or a new cycle manually.
   */
  static async openCycle(adminId: string, chamaId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify admin
      const adminMember = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: adminId } },
      });
      if (!adminMember || adminMember.role !== 'ADMIN') {
        throw new Error('Only Admin can open cycles');
      }

      const chama = await tx.chama.findUnique({ where: { id: chamaId } });
      if (!chama) throw new Error('Chama not found');
      if (chama.type !== 'ROTATING') {
        throw new Error('Cycles are only applicable to ROTATING chamas');
      }
      if (chama.status !== 'ACTIVE') {
        throw new Error('Chama must be ACTIVE to start a cycle');
      }

      // 2. Check for existing OPEN or COLLECTING cycle
      const activeCycle = await tx.chamaCycle.findFirst({
        where: {
          chamaId,
          status: { in: ['OPEN', 'COLLECTING', 'DISBURSING'] }
        }
      });
      if (activeCycle) {
        throw new Error(`Cycle #${activeCycle.cycleNumber} is still active (${activeCycle.status})`);
      }

      // 3. Determine next cycle number
      const nextCycleNumber = (chama.currentCycleNumber || 0) + 1;

      // 4. Identify recipient for this cycle based on rotation number
      // We cycle through members ordered by rotationNumber
      const members = await tx.chamaMember.findMany({
        where: { chamaId, status: 'ACTIVE' },
        orderBy: { rotationNumber: 'asc' },
      });

      if (members.length === 0) throw new Error('No active members to assign recipient');

      // The recipient is the member whose rotationNumber matches (nextCycleNumber % memberCount),
      // with a slight adjustment for 1-based indexing.
      // If cycle is 1, index is 0. If cycle is 2, index is 1.
      const recipientIndex = (nextCycleNumber - 1) % members.length;
      const recipient = members[recipientIndex];

      // 5. Calculate target amount
      // Total amount expected = contributionAmountKr * (members.length)
      const targetAmountKr = new Prisma.Decimal(Number(chama.contributionAmountKr) * members.length);

      // 6. Set dates
      const startDate = new Date();
      const endDate = new Date();
      // Add days based on frequency
      if (chama.contributionFrequency === 'DAILY') endDate.setDate(endDate.getDate() + 1);
      else if (chama.contributionFrequency === 'WEEKLY') endDate.setDate(endDate.getDate() + 7);
      else if (chama.contributionFrequency === 'BIWEEKLY') endDate.setDate(endDate.getDate() + 14);
      else if (chama.contributionFrequency === 'MONTHLY') endDate.setMonth(endDate.getMonth() + 1);
      else endDate.setMonth(endDate.getMonth() + 1); // fallback

      // 7. Create cycle
      const cycle = await tx.chamaCycle.create({
        data: {
          chamaId,
          cycleNumber: nextCycleNumber,
          recipientId: recipient.userId,
          targetAmountKr,
          startDate,
          endDate,
          status: 'COLLECTING' // Start collecting immediately
        }
      });

      // 8. Update chama's current cycle number
      await tx.chama.update({
        where: { id: chamaId },
        data: { currentCycleNumber: nextCycleNumber }
      });

      // 9. Send system message
      const recipientUser = await tx.user.findUnique({ select: { displayName: true }, where: { id: recipient.userId } });
      await tx.message.create({
        data: {
          chatId: chama.chatId,
          senderId: adminId,
          payload: `🔄 Cycle #${nextCycleNumber} has started! The recipient for this cycle is ${recipientUser?.displayName}. Target: ${targetAmountKr} Kr.`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      return cycle;
    });
  }

  /**
   * Disburse funds for the current cycle to the recipient.
   */
  static async disburseCycle(adminId: string, chamaId: string, cycleId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify admin
      const adminMember = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: adminId } },
      });
      if (!adminMember || adminMember.role !== 'ADMIN') {
        throw new Error('Only Admin can disburse cycle funds');
      }

      const cycle = await tx.chamaCycle.findUnique({ where: { id: cycleId } });
      if (!cycle || cycle.chamaId !== chamaId) throw new Error('Cycle not found');
      if (cycle.status !== 'COLLECTING' && cycle.status !== 'OPEN') {
        throw new Error(`Cycle is not in a disbursable state (current: ${cycle.status})`);
      }
      if (!cycle.recipientId) throw new Error('No recipient assigned to this cycle');

      const chama = await tx.chama.findUnique({ where: { id: chamaId }, include: { chamaWallet: true } });
      if (!chama || !chama.chamaWallet) throw new Error('Chama wallet not found');

      // Allow partial disbursements, but normally we check if collectedAmount >= targetAmount
      // For flexibility, we just take the currently collected amount or wallet balance.
      const amountToDisburse = cycle.collectedAmountKr;
      if (Number(amountToDisburse) <= 0) throw new Error('No funds collected for this cycle yet');
      if (Number(chama.chamaWallet.krBalance) < Number(amountToDisburse)) {
        throw new Error('Chama wallet has insufficient funds to cover the collected amount');
      }

      // 2. Transfer funds: Chama Wallet -> Recipient Wallet
      await tx.chamaWallet.update({
        where: { chamaId },
        data: { krBalance: { decrement: amountToDisburse } }
      });

      await tx.wallet.update({
        where: { userId: cycle.recipientId },
        data: { krBalance: { increment: amountToDisburse } }
      });

      // 3. Record transaction
      await tx.chamaTransaction.create({
        data: {
          chamaId,
          userId: cycle.recipientId,
          type: 'PAYOUT',
          amountKr: amountToDisburse,
          description: `Cycle #${cycle.cycleNumber} payout`,
        }
      });

      // 4. Update member stats
      await tx.chamaMember.updateMany({
        where: { chamaId, userId: cycle.recipientId },
        data: { totalReceived: { increment: amountToDisburse } }
      });

      // 5. Mark cycle completed
      const updatedCycle = await tx.chamaCycle.update({
        where: { id: cycleId },
        data: { status: 'COMPLETED' }
      });

      // 6. Send system message
      const recipientUser = await tx.user.findUnique({ select: { displayName: true }, where: { id: cycle.recipientId } });
      await tx.message.create({
        data: {
          chatId: chama.chatId,
          senderId: adminId,
          payload: `💰 Payout of ${amountToDisburse} Kr for Cycle #${cycle.cycleNumber} has been disbursed to ${recipientUser?.displayName}.`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      return updatedCycle;
    });
  }

  /**
   * Get cycle history for a chama
   */
  static async getCycles(chamaId: string) {
    return prisma.chamaCycle.findMany({
      where: { chamaId },
      orderBy: { cycleNumber: 'desc' },
      include: {
        chama: { select: { name: true } }
      }
    });
  }
}
