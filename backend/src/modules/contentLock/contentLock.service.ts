import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { ExchangeService } from '../../services/exchange/exchange.service.js';
import { lockWalletsForUpdate, withDeadlockRetry } from '../../utils/databaseLocks.js';
import crypto from 'crypto';

type ContentType = 'SHORT' | 'POST' | 'LIVE';

export class ContentLockService {
  /**
   * Check if user has access to locked content
   */
  static async checkAccess(
    userId: string,
    contentId: string,
    contentType: ContentType,
    creatorId: string,
    isLocked: boolean,
    requiredTier?: string,
    unlockAmountKr?: number
  ): Promise<{
    hasAccess: boolean;
    reason?: 'creator' | 'subscribed' | 'unlocked' | 'not_locked';
    requiresSubscription?: boolean;
    requiresUnlock?: boolean;
    unlockAmountKr?: number;
  }> {
    if (!isLocked) {
      return { hasAccess: true, reason: 'not_locked' };
    }

    if (userId === creatorId) {
      return { hasAccess: true, reason: 'creator' };
    }

    if (requiredTier) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          subscriberId: userId,
          creatorId,
          status: 'active',
          tier: requiredTier as any
        }
      });

      if (subscription) {
        return { hasAccess: true, reason: 'subscribed' };
      }
    }

    const unlock = await prisma.$queryRaw<any[]>`
      SELECT * FROM "content_unlocks"
      WHERE "user_id" = ${userId}
      AND "content_id" = ${contentId}
      AND "content_type" = ${contentType}
      LIMIT 1
    `;

    if (unlock && unlock.length > 0) {
      return { hasAccess: true, reason: 'unlocked' };
    }

    return {
      hasAccess: false,
      requiresSubscription: !!requiredTier,
      requiresUnlock: !!unlockAmountKr,
      unlockAmountKr: unlockAmountKr ? Number(unlockAmountKr) : undefined
    };
  }

  /**
   * Unlock content by paying the unlock amount
   */
  static async unlockContent(
    userId: string,
    contentId: string,
    contentType: ContentType,
    userCurrency: string
  ): Promise<{
    success: boolean;
    unlockAmountKr: number;
    creatorReceivedKr: number;
    platformFeeKr: number;
  }> {
    let content: any;
    let creatorId: string;
    let unlockAmountKr: number;

    type RawContent = { user_id?: string; host_id?: string; is_locked?: boolean; unlock_amount_kr?: string | null };
    let rawRows: RawContent[] = [];
    if (contentType === 'SHORT') {
      rawRows = await prisma.$queryRaw<RawContent[]>`SELECT user_id, is_locked, unlock_amount_kr FROM shorts WHERE id = ${contentId} LIMIT 1`;
    } else if (contentType === 'POST') {
      rawRows = await prisma.$queryRaw<RawContent[]>`SELECT user_id, is_locked, unlock_amount_kr FROM posts WHERE id = ${contentId} LIMIT 1`;
    } else if (contentType === 'LIVE') {
      rawRows = await prisma.$queryRaw<RawContent[]>`SELECT host_id, unlock_amount_kr FROM live_streams WHERE id = ${contentId} LIMIT 1`;
    }
    content = rawRows[0];
    creatorId = (content?.user_id || content?.host_id) as string;

    if (!content) {
      throw new Error('Content not found');
    }

    unlockAmountKr = content.unlock_amount_kr ? Number(content.unlock_amount_kr) : 0;

    if (!unlockAmountKr || unlockAmountKr <= 0) {
      throw new Error('Content does not have an unlock amount set');
    }

    if (userId === creatorId) {
      throw new Error('You cannot unlock your own content');
    }

    const existingUnlock = await prisma.$queryRaw<any[]>`
      SELECT * FROM "content_unlocks"
      WHERE "user_id" = ${userId}
      AND "content_id" = ${contentId}
      AND "content_type" = ${contentType}
      LIMIT 1
    `;

    if (existingUnlock && existingUnlock.length > 0) {
      throw new Error('You have already unlocked this content');
    }

    const PLATFORM_FEE_RATE = 0.15;
    const platformFeeKr = Math.floor(unlockAmountKr * PLATFORM_FEE_RATE);
    const creatorReceiveKr = unlockAmountKr - platformFeeKr;

    const baseUsd = ExchangeService.getUSDFromKr(unlockAmountKr);
    const localRate = await ExchangeService.getTransactionRate(userCurrency, 'sell');
    const fiatAmount = baseUsd * localRate;

    return withDeadlockRetry(async () => {
      return prisma.$transaction(async (tx) => {
        const wallets = await lockWalletsForUpdate(tx, [userId, creatorId]);
        const userWallet = wallets.find((w: any) => w.user_id === userId);

        if (!userWallet || Number(userWallet.kr_balance) < unlockAmountKr) {
          throw new Error('Insufficient Kr balance to unlock content');
        }

        await tx.wallet.update({
          where: { userId },
          data: { krBalance: { decrement: new Prisma.Decimal(unlockAmountKr) } }
        });

        await tx.wallet.upsert({
          where: { userId: creatorId },
          create: { userId: creatorId, krBalance: new Prisma.Decimal(creatorReceiveKr) },
          update: { krBalance: { increment: new Prisma.Decimal(creatorReceiveKr) } }
        });

        await tx.$executeRaw`
          INSERT INTO "content_unlocks" ("id", "user_id", "content_id", "content_type", "amount_kr", "amount_fiat", "currency", "creator_id")
          VALUES (${crypto.randomUUID()}, ${userId}, ${contentId}, ${contentType}, ${unlockAmountKr}, ${fiatAmount}, ${userCurrency}, ${creatorId})
        `;

        await tx.transaction.createMany({
          data: [
            {
              userId,
              counterpartyId: creatorId,
              type: 'content_unlock_paid',
              amountKr: new Prisma.Decimal(unlockAmountKr),
              amountFiat: fiatAmount,
              currency: userCurrency,
              status: 'completed',
              provider: 'platform',
              metadata: { contentId, contentType }
            },
            {
              userId: creatorId,
              counterpartyId: userId,
              type: 'content_unlock_earned',
              amountKr: new Prisma.Decimal(creatorReceiveKr),
              status: 'completed',
              provider: 'platform',
              metadata: { contentId, contentType }
            },
            {
              userId,
              counterpartyId: 'PLATFORM_REVENUE',
              type: 'platform_fee',
              amountKr: new Prisma.Decimal(platformFeeKr),
              status: 'completed',
              provider: 'platform_engine',
              metadata: { contentId, contentType, source: 'content_unlock' }
            }
          ]
        });

        const creatorUser = await tx.user.findUnique({ where: { id: creatorId } });
        if (creatorUser && !creatorUser.isWalletUnlocked) {
          await tx.user.update({
            where: { id: creatorId },
            data: { isWalletUnlocked: true }
          });
        }

        return {
          success: true,
          unlockAmountKr,
          creatorReceivedKr: creatorReceiveKr,
          platformFeeKr
        };
      }, {
        isolationLevel: 'Serializable',
        timeout: 10000
      });
    });
  }

  /**
   * Get unlock price in user's currency with real-time conversion
   */
  static async getUnlockPrice(unlockAmountKr: number, userCurrency: string): Promise<{
    krAmount: number;
    fiatAmount: number;
    currency: string;
    displayText: string;
  }> {
    const baseUsd = ExchangeService.getUSDFromKr(unlockAmountKr);
    const localRate = await ExchangeService.getTransactionRate(userCurrency, 'sell');
    const fiatAmount = baseUsd * localRate;

    return {
      krAmount: unlockAmountKr,
      fiatAmount: Math.ceil(fiatAmount),
      currency: userCurrency,
      displayText: `${unlockAmountKr} Kr (≈ ${Math.ceil(fiatAmount)} ${userCurrency})`
    };
  }

  /**
   * Convert creator's fiat input to Kr in real-time
   */
  static async convertFiatToKr(fiatAmount: number, creatorCurrency: string): Promise<number> {
    const localRate = await ExchangeService.getTransactionRate(creatorCurrency, 'sell');
    const baseUsd = fiatAmount / localRate;
    const krAmount = ExchangeService.getKrFromUSD(baseUsd);
    return Math.floor(krAmount);
  }

  /**
   * Check if user has unlocked specific content
   */
  static async hasUnlocked(userId: string, contentId: string, contentType: ContentType): Promise<boolean> {
    const unlock = await prisma.$queryRaw<any[]>`
      SELECT 1 FROM "content_unlocks"
      WHERE "user_id" = ${userId}
      AND "content_id" = ${contentId}
      AND "content_type" = ${contentType}
      LIMIT 1
    `;
    return unlock && unlock.length > 0;
  }
}
