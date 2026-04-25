import { prisma } from '../../config/database.js';
import { Prisma, ChamaType, ChamaStatus, ContributionFrequency } from '../../generated/prisma/client.js';
import { io } from '../../shared/gateway/socket.js';

export class ChamaService {
  /**
   * Create a new Chama with its linked Group Chat and ChamaWallet.
   * Creator automatically becomes ADMIN.
   */
  static async createChama(
    creatorId: string,
    data: {
      name: string;
      type: ChamaType;
      description?: string;
      reason?: string;
      maxMembers?: number;
      autoLockOnFull?: boolean;
      contributionAmountKr: number;
      contributionFrequency: ContributionFrequency;
      membershipFeeKr?: number;
      lockPeriodDays?: number;
      penaltyAmountKr?: number;
      gracePeriodDays?: number;
      minApprovals?: number;
      allowMidTermVoteOut?: boolean;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Create the GROUP chat
      const chat = await tx.chat.create({
        data: {
          type: 'GROUP',
          name: data.name,
          description: data.description,
          participants: {
            create: [{ userId: creatorId, role: 'admin' }],
          },
        },
      });

      // 2. Create the Chama linked to the chat
      const chama = await tx.chama.create({
        data: {
          name: data.name,
          type: data.type,
          description: data.description,
          reason: data.reason,
          chatId: chat.id,
          creatorId,
          maxMembers: data.maxMembers,
          autoLockOnFull: data.autoLockOnFull ?? false,
          contributionAmountKr: new Prisma.Decimal(data.contributionAmountKr),
          contributionFrequency: data.contributionFrequency,
          membershipFeeKr: data.membershipFeeKr ? new Prisma.Decimal(data.membershipFeeKr) : null,
          lockPeriodDays: data.lockPeriodDays,
          penaltyAmountKr: data.penaltyAmountKr ? new Prisma.Decimal(data.penaltyAmountKr) : null,
          gracePeriodDays: data.gracePeriodDays ?? 3,
          minApprovals: data.minApprovals ?? 2,
          allowMidTermVoteOut: data.allowMidTermVoteOut ?? true,
          status: 'SETUP',
        },
      });

      // 3. Create ChamaWallet
      await tx.chamaWallet.create({
        data: { chamaId: chama.id },
      });

      // 4. Add creator as ADMIN member
      await tx.chamaMember.create({
        data: {
          chamaId: chama.id,
          userId: creatorId,
          role: 'ADMIN',
          rotationNumber: data.type === 'ROTATING' ? 1 : null,
        },
      });

      // 5. Send system message to chat
      await tx.message.create({
        data: {
          chatId: chat.id,
          senderId: creatorId,
          payload: `🏦 Chama "${data.name}" has been created. Welcome!`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      return ChamaService.getChamaById(chama.id, tx);
    });
  }

  /**
   * Get a single chama with full details.
   */
  static async getChamaById(chamaId: string, txClient?: any) {
    const db = txClient || prisma;
    return db.chama.findUnique({
      where: { id: chamaId },
      include: {
        chamaWallet: true,
        members: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, username: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { rotationNumber: 'asc' },
        },
        _count: {
          select: {
            members: { where: { status: 'ACTIVE' } },
            contributions: true,
          },
        },
      },
    });
  }

  /**
   * Get all chamas for a user.
   */
  static async getMyChamas(userId: string) {
    return prisma.chama.findMany({
      where: {
        members: { some: { userId, status: 'ACTIVE' } },
      },
      include: {
        chamaWallet: true,
        _count: {
          select: { members: { where: { status: 'ACTIVE' } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Discover public/joinable chamas.
   */
  static async discoverChamas(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    return prisma.chama.findMany({
      where: {
        status: { in: ['SETUP', 'ACTIVE'] },
        isLocked: false,
        members: { none: { userId, status: 'ACTIVE' } },
      },
      include: {
        _count: {
          select: { members: { where: { status: 'ACTIVE' } } },
        },
        creator: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  /**
   * Join a chama. Charges membership fee if applicable.
   * For ROTATING chamas, assigns the next rotation number.
   */
  static async joinChama(userId: string, chamaId: string) {
    return prisma.$transaction(async (tx) => {
      const chama = await tx.chama.findUnique({
        where: { id: chamaId },
        include: {
          _count: { select: { members: { where: { status: 'ACTIVE' } } } },
          chamaWallet: true,
        },
      });

      if (!chama) throw new Error('Chama not found');
      if (chama.isLocked) throw new Error('This Chama is locked and not accepting new members');
      if (chama.status === 'DISSOLVED' || chama.status === 'COMPLETED') {
        throw new Error('This Chama is no longer active');
      }

      // Check max members
      if (chama.maxMembers && chama._count.members >= chama.maxMembers) {
        throw new Error('Chama has reached maximum members');
      }

      // Check if already a member
      const existing = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId } },
      });
      if (existing && existing.status === 'ACTIVE') {
        throw new Error('You are already a member of this Chama');
      }

      // Check defaulter status — warn joining chama
      const activeDefaults = await tx.chamaDefaulter.findMany({
        where: { userId, isResolved: false },
      });
      // We don't block joining but the chama members will see the warning

      // Charge membership fee if applicable
      if (chama.membershipFeeKr && Number(chama.membershipFeeKr) > 0) {
        const wallet = await tx.wallet.findUnique({ where: { userId } });
        if (!wallet || wallet.krBalance.lessThan(chama.membershipFeeKr)) {
          throw new Error('Insufficient Kr balance for membership fee');
        }

        // Debit user wallet
        await tx.wallet.update({
          where: { userId },
          data: { krBalance: { decrement: chama.membershipFeeKr } },
        });

        // Credit chama wallet
        await tx.chamaWallet.update({
          where: { chamaId },
          data: { krBalance: { increment: chama.membershipFeeKr } },
        });

        // Record transaction
        await tx.chamaTransaction.create({
          data: {
            chamaId,
            userId,
            type: 'MEMBERSHIP_FEE',
            amountKr: chama.membershipFeeKr,
            description: `Membership fee paid by user`,
          },
        });
      }

      // Get next rotation number for ROTATING chamas
      let rotationNumber: number | null = null;
      if (chama.type === 'ROTATING') {
        const maxRotation = await tx.chamaMember.aggregate({
          where: { chamaId, status: 'ACTIVE' },
          _max: { rotationNumber: true },
        });
        rotationNumber = (maxRotation._max.rotationNumber ?? 0) + 1;

        // Lock user's personal wallet for rotation
        await tx.user.update({
          where: { id: userId },
          data: { isRotationLocked: true },
        });
      }

      // Create or reactivate member
      let member;
      if (existing) {
        member = await tx.chamaMember.update({
          where: { id: existing.id },
          data: {
            status: 'ACTIVE',
            role: 'MEMBER',
            rotationNumber,
            leftAt: null,
          },
        });
      } else {
        member = await tx.chamaMember.create({
          data: {
            chamaId,
            userId,
            role: 'MEMBER',
            rotationNumber,
          },
        });
      }

      // Add to chat participants
      await tx.chatParticipant.upsert({
        where: { chatId_userId: { chatId: chama.chatId, userId } },
        create: { chatId: chama.chatId, userId, role: 'member' },
        update: {},
      });

      // System message
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { displayName: true },
      });
      await tx.message.create({
        data: {
          chatId: chama.chatId,
          senderId: userId,
          payload: `👋 ${user?.displayName ?? 'A new member'} joined the Chama${rotationNumber ? ` (Rotation #${rotationNumber})` : ''}.`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      // Warn about defaulter history
      if (activeDefaults.length > 0) {
        await tx.message.create({
          data: {
            chatId: chama.chatId,
            senderId: userId,
            payload: `⚠️ Warning: ${user?.displayName} has ${activeDefaults.length} unresolved default(s) in other Chamas.`,
            isSystemEvent: true,
            status: 'sent',
          },
        });
      }

      // Auto-lock if full
      if (chama.autoLockOnFull && chama.maxMembers) {
        const newCount = chama._count.members + 1;
        if (newCount >= chama.maxMembers) {
          await tx.chama.update({
            where: { id: chamaId },
            data: { isLocked: true },
          });
        }
      }

      return ChamaService.getChamaById(chamaId, tx);
    });
  }

  /**
   * Leave a chama. Blocked for ROTATING type if rotation is active.
   */
  static async leaveChama(userId: string, chamaId: string) {
    return prisma.$transaction(async (tx) => {
      const chama = await tx.chama.findUnique({ where: { id: chamaId } });
      if (!chama) throw new Error('Chama not found');

      const member = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId } },
      });
      if (!member || member.status !== 'ACTIVE') {
        throw new Error('You are not an active member of this Chama');
      }

      // Block admin from leaving when chama is active with members
      if (member.role === 'ADMIN') {
        const activeCount = await tx.chamaMember.count({
          where: { chamaId, status: 'ACTIVE' },
        });
        if (activeCount > 1) {
          throw new Error('Admin cannot leave while other members are active. Transfer admin role first or dissolve the Chama.');
        }
      }

      // For ROTATING chamas: block if rotation is active and user hasn't completed their obligation
      if (chama.type === 'ROTATING' && chama.status === 'ACTIVE') {
        if (Number(member.totalReceived) > 0 && Number(member.totalContributed) < Number(member.totalReceived)) {
          // They received more than contributed — can't leave, must be flagged
          await tx.chamaDefaulter.create({
            data: {
              userId,
              chamaId,
              chamaName: chama.name,
              amountOwedKr: new Prisma.Decimal(Number(member.totalReceived) - Number(member.totalContributed)),
            },
          });

          throw new Error('You cannot leave this Chama until you fulfil your rotation obligations. You have been flagged as a defaulter.');
        }
      }

      // Mark member as LEFT
      await tx.chamaMember.update({
        where: { id: member.id },
        data: { status: 'LEFT', leftAt: new Date() },
      });

      // Check if user is in any other active rotating chamas
      const otherRotating = await tx.chamaMember.count({
        where: {
          userId,
          status: 'ACTIVE',
          chama: { type: 'ROTATING', status: 'ACTIVE' },
        },
      });
      if (otherRotating === 0) {
        await tx.user.update({
          where: { id: userId },
          data: { isRotationLocked: false },
        });
      }

      // System message
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { displayName: true },
      });
      await tx.message.create({
        data: {
          chatId: chama.chatId,
          senderId: userId,
          payload: `📤 ${user?.displayName ?? 'A member'} has left the Chama.`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      return { success: true, message: 'You have left the Chama' };
    });
  }

  /**
   * Admin removes a member with reason.
   */
  static async removeMember(adminId: string, chamaId: string, targetUserId: string, reason: string) {
    return prisma.$transaction(async (tx) => {
      // Verify admin
      const adminMember = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: adminId } },
      });
      if (!adminMember || adminMember.role !== 'ADMIN') {
        throw new Error('Only the Admin can remove members');
      }

      const targetMember = await tx.chamaMember.findUnique({
        where: { chamaId_userId: { chamaId, userId: targetUserId } },
      });
      if (!targetMember || targetMember.status !== 'ACTIVE') {
        throw new Error('Target is not an active member');
      }

      const chama = await tx.chama.findUnique({ where: { id: chamaId } });
      if (!chama) throw new Error('Chama not found');

      // Mark as REMOVED
      await tx.chamaMember.update({
        where: { id: targetMember.id },
        data: { status: 'REMOVED', leftAt: new Date() },
      });

      // For rotating chamas, check outstanding obligations
      if (chama.type === 'ROTATING' && Number(targetMember.totalReceived) > Number(targetMember.totalContributed)) {
        await tx.chamaDefaulter.create({
          data: {
            userId: targetUserId,
            chamaId,
            chamaName: chama.name,
            amountOwedKr: new Prisma.Decimal(Number(targetMember.totalReceived) - Number(targetMember.totalContributed)),
          },
        });
      }

      // System message
      const targetUser = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { displayName: true },
      });
      await tx.message.create({
        data: {
          chatId: chama.chatId,
          senderId: adminId,
          payload: `🚫 ${targetUser?.displayName ?? 'A member'} has been removed from the Chama. Reason: ${reason}`,
          isSystemEvent: true,
          status: 'sent',
        },
      });

      return { success: true };
    });
  }

  /**
   * Update chama settings (admin only).
   */
  static async updateChama(
    adminId: string,
    chamaId: string,
    data: {
      name?: string;
      description?: string;
      avatarUrl?: string;
      maxMembers?: number;
      isLocked?: boolean;
      autoLockOnFull?: boolean;
      penaltyAmountKr?: number;
      gracePeriodDays?: number;
      minApprovals?: number;
      allowMidTermVoteOut?: boolean;
      status?: ChamaStatus;
    }
  ) {
    const adminMember = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId: adminId } },
    });
    if (!adminMember || adminMember.role !== 'ADMIN') {
      throw new Error('Only the Admin can update Chama settings');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
    if (data.maxMembers !== undefined) updateData.maxMembers = data.maxMembers;
    if (data.isLocked !== undefined) updateData.isLocked = data.isLocked;
    if (data.autoLockOnFull !== undefined) updateData.autoLockOnFull = data.autoLockOnFull;
    if (data.penaltyAmountKr !== undefined) updateData.penaltyAmountKr = new Prisma.Decimal(data.penaltyAmountKr);
    if (data.gracePeriodDays !== undefined) updateData.gracePeriodDays = data.gracePeriodDays;
    if (data.minApprovals !== undefined) updateData.minApprovals = data.minApprovals;
    if (data.allowMidTermVoteOut !== undefined) updateData.allowMidTermVoteOut = data.allowMidTermVoteOut;
    if (data.status !== undefined) {
      // Block dissolving when members are active
      if (data.status === 'DISSOLVED') {
        const activeCount = await prisma.chamaMember.count({
          where: { chamaId, status: 'ACTIVE' },
        });
        if (activeCount > 1) {
          throw new Error('Cannot dissolve Chama while members are still active');
        }
      }
      updateData.status = data.status;
    }

    return prisma.chama.update({
      where: { id: chamaId },
      data: updateData,
      include: {
        chamaWallet: true,
        _count: { select: { members: { where: { status: 'ACTIVE' } } } },
      },
    });
  }

  /**
   * Activate a chama (move from SETUP to ACTIVE).
   */
  static async activateChama(adminId: string, chamaId: string) {
    const adminMember = await prisma.chamaMember.findUnique({
      where: { chamaId_userId: { chamaId, userId: adminId } },
    });
    if (!adminMember || adminMember.role !== 'ADMIN') {
      throw new Error('Only the Admin can activate the Chama');
    }

    const chama = await prisma.chama.findUnique({ where: { id: chamaId } });
    if (!chama || chama.status !== 'SETUP') {
      throw new Error('Chama must be in SETUP status to activate');
    }

    return prisma.chama.update({
      where: { id: chamaId },
      data: { status: 'ACTIVE' },
    });
  }

  /**
   * Get the global List of Shame (defaulters).
   */
  static async getDefaultersList(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    return prisma.chamaDefaulter.findMany({
      where: { isResolved: false },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  /**
   * Resolve a default (user pays what they owe).
   */
  static async resolveDefault(userId: string, defaultId: string) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.chamaDefaulter.findUnique({ where: { id: defaultId } });
      if (!record || record.userId !== userId) throw new Error('Default record not found');
      if (record.isResolved) throw new Error('Already resolved');

      const totalOwed = Number(record.amountOwedKr) + Number(record.fineAmountKr);

      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || Number(wallet.krBalance) < totalOwed) {
        throw new Error('Insufficient Kr balance to resolve default');
      }

      // Debit user wallet
      await tx.wallet.update({
        where: { userId },
        data: { krBalance: { decrement: new Prisma.Decimal(totalOwed) } },
      });

      // Credit chama wallet
      await tx.chamaWallet.update({
        where: { chamaId: record.chamaId },
        data: { krBalance: { increment: new Prisma.Decimal(totalOwed) } },
      });

      // Mark resolved
      await tx.chamaDefaulter.update({
        where: { id: defaultId },
        data: { isResolved: true, resolvedAt: new Date() },
      });

      // Record transaction
      await tx.chamaTransaction.create({
        data: {
          chamaId: record.chamaId,
          userId,
          type: 'PENALTY',
          amountKr: new Prisma.Decimal(totalOwed),
          description: 'Default resolution payment (owed + fines)',
        },
      });

      return { success: true, message: 'Default resolved. You have been removed from the List of Shame.' };
    });
  }
}
