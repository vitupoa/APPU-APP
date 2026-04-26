import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';
import { WalletService } from '../wallet/wallet.service.js';
import { v4 as uuidv4 } from 'uuid';

// Banned words filter for live chat moderation
const BANNED_WORDS = [
  'scam', 'fraud', 'hack', 'kill', 'porn', 'nude', 'xxx',
  'nigger', 'faggot', 'retard', 'whore', 'slut',
];

function containsBannedWords(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_WORDS.some(word => lower.includes(word));
}

function filterMessage(text: string): string {
  let filtered = text;
  const lower = text.toLowerCase();
  BANNED_WORDS.forEach(word => {
    if (lower.includes(word)) {
      filtered = filtered.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
    }
  });
  return filtered;
}

export class LiveService {
  /**
   * Start a new live stream
   */
  static async startStream(
    hostId: string,
    data: {
      title: string;
      description?: string;
      type?: string;
      chamaId?: string;
      contestId?: string;
      orderId?: string;
      isCoHostEnabled?: boolean;
      maxCoHosts?: number;
      scheduledStart?: string;
    }
  ) {
    // Check for existing active stream
    const existing = await prisma.liveStream.findFirst({
      where: { hostId, status: 'LIVE' },
    });
    if (existing) {
      throw new Error('You already have an active live stream');
    }

    // For CHAMA type, verify user is a chama member/admin
    if (data.type === 'CHAMA' && data.chamaId) {
      const membership = await prisma.chamaMember.findFirst({
        where: { chamaId: data.chamaId, userId: hostId, status: 'ACTIVE' },
      });
      if (!membership || !['ADMIN', 'CHAIRPERSON'].includes(membership.role)) {
        throw new Error('Only Chama leaders can start a Chama Live');
      }
    }

    const streamKey = `live_${uuidv4().replace(/-/g, '')}`;

    const stream = await prisma.liveStream.create({
      data: {
        hostId,
        title: data.title,
        description: data.description,
        type: (data.type as any) || 'NORMAL',
        status: data.scheduledStart ? 'SCHEDULED' : 'LIVE',
        streamKey,
        isCoHostEnabled: data.isCoHostEnabled || false,
        maxCoHosts: data.maxCoHosts || 1,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : null,
        actualStart: data.scheduledStart ? null : new Date(),
        chamaId: data.chamaId,
        contestId: data.contestId,
        orderId: data.orderId,
      },
      include: {
        host: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
        },
      },
    });

    return stream;
  }

  /**
   * End a live stream
   */
  static async endStream(streamId: string, hostId: string) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new Error('Stream not found');
    if (stream.hostId !== hostId) throw new Error('Only the host can end the stream');
    if (stream.status !== 'LIVE') throw new Error('Stream is not live');

    const updated = await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        status: 'ENDED',
        endedAt: new Date(),
      },
    });

    // If Proof of Task, mark order as delivered and release escrow
    if (stream.type === 'PROOF_OF_TASK' && stream.orderId) {
      try {
        await prisma.order.update({
          where: { id: stream.orderId },
          data: { status: 'DELIVERED' },
        });
        // Release escrow for all items in order
        await prisma.orderItem.updateMany({
          where: { orderId: stream.orderId },
          data: { escrowStatus: 'released', deliveredAt: new Date() },
        });
      } catch {
        // Order may not exist, non-fatal
      }
    }

    return updated;
  }

  /**
   * Get all active live streams for discovery
   */
  static async getActiveStreams(page: number = 1, limit: number = 20, chamaId?: string) {
    const skip = (page - 1) * limit;
    const where: any = { status: 'LIVE' };

    if (chamaId) {
      where.chamaId = chamaId;
    } else {
      // Public streams only (exclude chama-exclusive)
      where.OR = [
        { type: { not: 'CHAMA' } },
        { chamaId: null },
      ];
    }

    const [streams, total] = await Promise.all([
      prisma.liveStream.findMany({
        where,
        include: {
          host: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
          },
        },
        orderBy: { viewerCount: 'desc' },
        skip,
        take: limit,
      }),
      prisma.liveStream.count({ where }),
    ]);

    return { streams, total, page, limit };
  }

  /**
   * Get stream details
   */
  static async getStream(streamId: string) {
    const stream = await prisma.liveStream.findUnique({
      where: { id: streamId },
      include: {
        host: {
          select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true },
        },
        coHosts: true,
        pinnedProducts: {
          include: {
            product: {
              select: {
                id: true, title: true, priceKr: true, imageUrls: true,
                category: true, contactMethod: true, whatsappNumber: true,
                purchaseUrl: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!stream) throw new Error('Stream not found');
    return stream;
  }

  /**
   * Join a live stream as viewer
   */
  static async joinStream(streamId: string, userId: string) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream) throw new Error('Stream not found');
    if (stream.status !== 'LIVE') throw new Error('Stream is not live');

    // Check if banned
    const banned = await prisma.liveBannedViewer.findUnique({
      where: { streamId_userId: { streamId, userId } },
    });
    if (banned) throw new Error('You have been banned from this stream');

    // Check chama access
    if (stream.type === 'CHAMA' && stream.chamaId) {
      const membership = await prisma.chamaMember.findFirst({
        where: { chamaId: stream.chamaId, userId, status: 'ACTIVE' },
      });
      if (!membership) throw new Error('Only Chama members can view this stream');
    }

    // Upsert viewer record
    await prisma.liveViewer.upsert({
      where: { streamId_userId: { streamId, userId } },
      create: { streamId, userId },
      update: { leftAt: null, joinedAt: new Date() },
    });

    // Increment viewer count
    const updated = await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        viewerCount: { increment: 1 },
        peakViewers: { set: Math.max(stream.peakViewers, stream.viewerCount + 1) },
      },
    });

    // Get user info for join announcement
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, displayName: true, avatarUrl: true },
    });

    return { viewerCount: updated.viewerCount, user };
  }

  /**
   * Leave a live stream
   */
  static async leaveStream(streamId: string, userId: string) {
    await prisma.liveViewer.updateMany({
      where: { streamId, userId, leftAt: null },
      data: { leftAt: new Date() },
    });

    await prisma.liveStream.update({
      where: { id: streamId },
      data: { viewerCount: { decrement: 1 } },
    });
  }

  /**
   * Send tip in live stream (uses universal 15% platform cut)
   */
  static async sendTip(
    streamId: string,
    senderId: string,
    recipientId: string,
    amountKr: number,
    giftType?: string,
    message?: string,
    senderCurrency: string = 'USD'
  ) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream || stream.status !== 'LIVE') throw new Error('Stream is not live');

    // Use universal WalletService.sendTip (15% platform cut)
    const tipResult = await WalletService.sendTip(senderId, recipientId, amountKr, senderCurrency);

    // Record live tip
    await prisma.liveTip.create({
      data: { streamId, senderId, recipientId, amountKr, giftType, message },
    });

    // Update stream totals
    await prisma.liveStream.update({
      where: { id: streamId },
      data: {
        totalTipsKr: { increment: amountKr },
        giftGoalCurrent: stream.giftGoalTarget ? { increment: amountKr } : undefined,
      },
    });

    // Update viewer leaderboard
    await prisma.liveViewer.updateMany({
      where: { streamId, userId: senderId },
      data: { totalTipsKr: { increment: amountKr } },
    });

    // If battle is active, update battle score
    const activeBattle = await prisma.liveBattle.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [{ streamId }, { opponentStreamId: streamId }],
      },
    });

    if (activeBattle) {
      const isHost = activeBattle.streamId === streamId;
      await prisma.liveBattle.update({
        where: { id: activeBattle.id },
        data: isHost
          ? { hostScore: { increment: amountKr } }
          : { opponentScore: { increment: amountKr } },
      });
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { username: true, displayName: true, avatarUrl: true },
    });

    return { ...tipResult, sender, giftType, message };
  }

  /**
   * Send likes (tap-to-like)
   */
  static async sendLikes(streamId: string, userId: string, count: number = 1) {
    await prisma.liveStream.update({
      where: { id: streamId },
      data: { likesCount: { increment: count } },
    });

    await prisma.liveViewer.updateMany({
      where: { streamId, userId },
      data: { likesGiven: { increment: count } },
    });

    return { count };
  }

  /**
   * Send chat message with word filter
   */
  static async sendMessage(streamId: string, userId: string, text: string) {
    // Check if banned
    const banned = await prisma.liveBannedViewer.findUnique({
      where: { streamId_userId: { streamId, userId } },
    });
    if (banned) throw new Error('You are banned from this stream');

    // Filter banned words
    const filteredText = filterMessage(text);

    const message = await prisma.liveMessage.create({
      data: { streamId, userId, text: filteredText },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    return { ...message, user };
  }

  /**
   * Get top gifters leaderboard
   */
  static async getLeaderboard(streamId: string, limit: number = 5) {
    const viewers = await prisma.liveViewer.findMany({
      where: { streamId, totalTipsKr: { gt: 0 } },
      orderBy: { totalTipsKr: 'desc' },
      take: limit,
    });

    // Fetch user details for each viewer
    const userIds = viewers.map(v => v.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, displayName: true, avatarUrl: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return viewers.map(v => ({
      userId: v.userId,
      totalTipsKr: v.totalTipsKr,
      user: userMap.get(v.userId),
    }));
  }

  /**
   * Pin product to stream
   */
  static async pinProduct(streamId: string, hostId: string, productId: string, salePrice?: number) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream || stream.hostId !== hostId) throw new Error('Not authorized');

    // Unpin all currently pinned
    await prisma.livePinnedProduct.updateMany({
      where: { streamId, isPinned: true },
      data: { isPinned: false },
    });

    const pinned = await prisma.livePinnedProduct.upsert({
      where: { streamId_productId: { streamId, productId } },
      create: {
        streamId,
        productId,
        salePrice: salePrice || null,
        isPinned: true,
        pinnedAt: new Date(),
      },
      update: { isPinned: true, pinnedAt: new Date(), salePrice: salePrice || undefined },
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true, title: true, priceKr: true, imageUrls: true,
        category: true, contactMethod: true, whatsappNumber: true,
        purchaseUrl: true,
      },
    });

    return { ...pinned, product };
  }

  /**
   * Unpin product from stream
   */
  static async unpinProduct(streamId: string, hostId: string, productId: string) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream || stream.hostId !== hostId) throw new Error('Not authorized');

    await prisma.livePinnedProduct.updateMany({
      where: { streamId, productId },
      data: { isPinned: false },
    });
  }

  /**
   * Set gift goal
   */
  static async setGiftGoal(streamId: string, hostId: string, title: string, targetKr: number) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream || stream.hostId !== hostId) throw new Error('Not authorized');

    return prisma.liveStream.update({
      where: { id: streamId },
      data: { giftGoalTitle: title, giftGoalTarget: targetKr, giftGoalCurrent: 0 },
    });
  }

  /**
   * Ban viewer from stream (moderation)
   */
  static async banViewer(streamId: string, hostId: string, userId: string, reason?: string) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream || stream.hostId !== hostId) throw new Error('Not authorized');
    if (userId === hostId) throw new Error('Cannot ban yourself');

    await prisma.liveBannedViewer.create({
      data: { streamId, userId, reason },
    });

    // Remove from viewers
    await prisma.liveViewer.updateMany({
      where: { streamId, userId },
      data: { leftAt: new Date() },
    });

    await prisma.liveStream.update({
      where: { id: streamId },
      data: { viewerCount: { decrement: 1 } },
    });

    return { banned: true };
  }

  /**
   * Mute viewer (delete their messages for this stream)
   */
  static async muteViewer(streamId: string, hostId: string, userId: string) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream || stream.hostId !== hostId) throw new Error('Not authorized');

    // We ban them from chat but they can still watch
    await prisma.liveBannedViewer.upsert({
      where: { streamId_userId: { streamId, userId } },
      create: { streamId, userId, reason: 'muted' },
      update: { reason: 'muted' },
    });

    return { muted: true };
  }

  /**
   * Start a PK Battle
   */
  static async startBattle(
    streamId: string,
    hostId: string,
    opponentStreamId: string,
    contestId?: string,
    durationSecs: number = 300
  ) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream || stream.hostId !== hostId) throw new Error('Not authorized');

    const opponentStream = await prisma.liveStream.findUnique({ where: { id: opponentStreamId } });
    if (!opponentStream || opponentStream.status !== 'LIVE') throw new Error('Opponent stream not live');

    const battle = await prisma.liveBattle.create({
      data: {
        streamId,
        opponentStreamId,
        contestId,
        durationSecs,
        status: 'PENDING',
      },
    });

    return battle;
  }

  /**
   * Accept a PK Battle
   */
  static async acceptBattle(battleId: string, userId: string) {
    const battle = await prisma.liveBattle.findUnique({
      where: { id: battleId },
      include: { opponentStream: true },
    });
    if (!battle) throw new Error('Battle not found');
    if (battle.opponentStream.hostId !== userId) throw new Error('Not authorized');

    return prisma.liveBattle.update({
      where: { id: battleId },
      data: { status: 'ACTIVE', startedAt: new Date() },
    });
  }

  /**
   * End a PK Battle (called by timer or manually)
   */
  static async endBattle(battleId: string) {
    const battle = await prisma.liveBattle.findUnique({ where: { id: battleId } });
    if (!battle || battle.status !== 'ACTIVE') throw new Error('Battle not active');

    const winnerId = Number(battle.hostScore) >= Number(battle.opponentScore)
      ? (await prisma.liveStream.findUnique({ where: { id: battle.streamId } }))?.hostId
      : (await prisma.liveStream.findUnique({ where: { id: battle.opponentStreamId } }))?.hostId;

    return prisma.liveBattle.update({
      where: { id: battleId },
      data: { status: 'COMPLETED', endedAt: new Date(), winnerId },
    });
  }

  /**
   * Invite co-host
   */
  static async inviteCoHost(streamId: string, hostId: string, userId: string) {
    const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
    if (!stream || stream.hostId !== hostId) throw new Error('Not authorized');
    if (!stream.isCoHostEnabled) throw new Error('Co-hosting is not enabled');

    const coHostCount = await prisma.liveCoHost.count({
      where: { streamId, leftAt: null },
    });
    if (coHostCount >= stream.maxCoHosts) throw new Error('Max co-hosts reached');

    return prisma.liveCoHost.create({
      data: { streamId, userId },
    });
  }
}
