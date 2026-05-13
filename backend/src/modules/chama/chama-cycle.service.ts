import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';

export class ChamaCycleService {
  /**
   * Start the first cycle or a new cycle manually.
   */
  static async openCycle(adminId: string, chamaId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Verify admin
      const adminMember = await tx.chamaMember.findUnique({
        where: { chama_id_user_id: { chama_id: chamaId, user_id: adminId } },
      });
      if (!adminMember || adminMember.role !== 'ADMIN') {
        throw new Error('Only Admin can open cycles');
      }

      const chama = await tx.chama.findUnique({ where: { id: chamaId } });
      if (!chama) throw new Error('Chama not found');
      if (chama.status !== 'ACTIVE') {
        throw new Error('Chama must be ACTIVE to start a cycle');
      }

      // 2. Check for existing OPEN or COLLECTING cycle
      const activeCycle = await tx.chamaCycle.findFirst({
        where: {
          chama_id: chamaId,
          status: { in: ['OPEN', 'COLLECTING'] }
        }
      });
      if (activeCycle) {
        throw new Error(`Cycle #${activeCycle.cycle_number} is still active (${activeCycle.status})`);
      }

      // 3. Determine next cycle number
      const nextCycleNumber = (chama.current_cycle_number || 0) + 1;

      // 4. Identify recipient for this cycle based on member order
      // We cycle through members ordered by created_at
      const members = await tx.chamaMember.findMany({
        where: { chama_id: chamaId, status: 'ACTIVE' },
        orderBy: { created_at: 'asc' },
      });

      if (members.length === 0) throw new Error('No active members to assign recipient');

      // The recipient is the member whose index matches (nextCycleNumber % memberCount)
      // If cycle is 1, index is 0. If cycle is 2, index is 1.
      const recipientIndex = (nextCycleNumber - 1) % members.length;
      const recipient = members[recipientIndex];

      // 5. Calculate target amount
      // Total amount expected = contributionAmountKr * (members.length)
      const targetAmountKr = new Prisma.Decimal(Number(chama.contribution_amount_kr) * members.length);

      // 6. Set dates
      const startDate = new Date();
      const endDate = new Date();
      // Default to monthly cycle
      endDate.setMonth(endDate.getMonth() + 1);

      // 7. Create cycle
      const cycle = await tx.chamaCycle.create({
        data: {
          id: randomUUID(),
          chama_id: chamaId,
          cycle_number: nextCycleNumber,
          target_amount_kr: targetAmountKr,
          start_date: startDate,
          end_date: endDate,
          status: 'COLLECTING', // Start collecting immediately
          updated_at: new Date()
        }
      });

      // 8. Update chama's current cycle number
      await tx.chama.update({
        where: { id: chamaId },
        data: { current_cycle_number: nextCycleNumber }
      });

      // 9. Send system message
      const recipientUser = await tx.user.findUnique({ select: { display_name: true }, where: { id: recipient.user_id } });
      await tx.messages.create({
        data: {
          id: randomUUID(),
          chat_id: chama.chat_id,
          sender_id: adminId,
          payload: `🔄 Cycle #${nextCycleNumber} has started! The recipient for this cycle is ${recipientUser?.display_name}. Target: ${targetAmountKr} Kr.`,
          is_system_event: true,
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
        where: { chama_id_user_id: { chama_id: chamaId, user_id: adminId } },
      });
      if (!adminMember || adminMember.role !== 'ADMIN') {
        throw new Error('Only Admin can disburse cycle funds');
      }

      const cycle = await tx.chamaCycle.findUnique({ where: { id: cycleId } });
      if (!cycle || cycle.chama_id !== chamaId) throw new Error('Cycle not found');
      if (cycle.status !== 'COLLECTING' && cycle.status !== 'OPEN') {
        throw new Error(`Cycle is not in a disbursable state (current: ${cycle.status})`);
      }

      const chama = await tx.chama.findUnique({ where: { id: chamaId }, include: { chama_wallet: true } });
      if (!chama || !chama.chama_wallet) throw new Error('Chama wallet not found');

      // Allow partial disbursements, but normally we check if collectedAmount >= targetAmount
      // For flexibility, we just take the currently collected amount or wallet balance.
      const amountToDisburse = cycle.collected_amount_kr;
      if (Number(amountToDisburse) <= 0) throw new Error('No funds collected for this cycle yet');
      if (Number(chama.chama_wallet.kr_balance) < Number(amountToDisburse)) {
        throw new Error('Chama wallet has insufficient funds to cover the collected amount');
      }

      // 2. Get the next member in rotation to receive payout
      const members = await tx.chamaMember.findMany({
        where: { chama_id: chamaId, status: 'ACTIVE' },
        orderBy: { created_at: 'asc' },
      });

      if (members.length === 0) throw new Error('No active members for payout');

      const recipientIndex = (cycle.cycle_number - 1) % members.length;
      const recipient = members[recipientIndex];

      // 3. Transfer funds: Chama Wallet -> Recipient Wallet
      await tx.chamaWallet.update({
        where: { chama_id: chamaId },
        data: { kr_balance: { decrement: amountToDisburse } }
      });

      await tx.wallets.update({
        where: { user_id: recipient.user_id },
        data: { kr_balance: { increment: amountToDisburse } }
      });

      // 4. Record transaction
      await tx.chamaTransaction.create({
        data: {
          id: randomUUID(),
          chama_id: chamaId,
          user_id: recipient.user_id,
          type: 'PAYOUT',
          amount_kr: amountToDisburse,
          description: `Cycle #${cycle.cycle_number} payout`,
        }
      });

      // 5. Update member stats
      await tx.chamaMember.updateMany({
        where: { chama_id: chamaId, user_id: recipient.user_id },
        data: { total_received: { increment: amountToDisburse } }
      });

      // 6. Mark cycle as OPEN (completed collection, ready for next cycle)
      const updatedCycle = await tx.chamaCycle.update({
        where: { id: cycleId },
        data: { status: 'OPEN' }
      });

      // 7. Send system message
      const recipientUser = await tx.user.findUnique({ select: { display_name: true }, where: { id: recipient.user_id } });
      await tx.messages.create({
        data: {
          id: randomUUID(),
          chat_id: chama.chat_id,
          sender_id: adminId,
          payload: `💰 Payout of ${amountToDisburse} Kr for Cycle #${cycle.cycle_number} has been disbursed to ${recipientUser?.display_name}.`,
          is_system_event: true,
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
      where: { chama_id: chamaId },
      orderBy: { cycle_number: 'desc' },
      include: {
        chama: { select: { name: true } }
      }
    });
  }
}
