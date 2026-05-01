import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * Sales Funnel & Conversion Service
 * Handles: Post-Contest Conversion, ROI Tracking, Sales Funnel Analytics
 * Ensures contests become sales engines, not gambling
 */
export class SalesFunnelService {
  
  // ═══════════════════════════════════════════════════════════
  // PURCHASE-TO-ENTER MECHANICS (NON-GAMBLING)
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Track purchase that qualifies for contest entry
   * LEGAL: Purchase is for product, contest entry is bonus (not primary value)
   */
  static async trackPurchaseEntry(data: {
    contestId: string;
    userId: string;
    orderId: string;
    purchaseAmount: number;
    productIds: string[];
  }) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: data.contestId }
    });

    // Verify contest allows purchase entries
    if (!contest.entryFeeKr || contest.entryFeeKr.equals(0)) {
      throw new Error('Contest does not have purchase-to-enter enabled');
    }

    // Check if purchase meets minimum
    const minPurchase = Number(contest.entryFeeKr);
    if (data.purchaseAmount < minPurchase) {
      throw new Error(`Purchase must be at least Kr.${minPurchase}`);
    }

    return prisma.$transaction(async (tx) => {
      // Record purchase entry
      const entry = await tx.contestPurchaseEntry.create({
        data: {
          contestId: data.contestId,
          userId: data.userId,
          orderId: data.orderId,
          purchaseAmount: new Prisma.Decimal(data.purchaseAmount),
          productIds: data.productIds,
          isEligible: true,
          autoEntered: true
        }
      });

      // Auto-join contest if not already joined
      const participant = await tx.contestParticipant.findUnique({
        where: {
          contestId_userId: {
            contestId: data.contestId,
            userId: data.userId
          }
        }
      });

      if (!participant) {
        await tx.contestParticipant.create({
          data: {
            contestId: data.contestId,
            userId: data.userId
          }
        });

        await tx.contest.update({
          where: { id: data.contestId },
          data: { totalParticipants: { increment: 1 } }
        });
      }

      // Track funnel event
      await this.trackFunnelEvent({
        userId: data.userId,
        contestId: data.contestId,
        stage: 'CONVERSION',
        eventType: 'purchase_to_enter',
        sourceType: 'contest',
        sourceId: data.contestId,
        metadata: {
          orderId: data.orderId,
          amount: data.purchaseAmount
        }
      });

      return entry;
    });
  }

  /**
   * Track engagement actions (non-purchase)
   * Examples: Follow brand, visit shop, watch video
   */
  static async trackEngagementAction(data: {
    contestId: string;
    userId: string;
    actionType: string;
    targetUrl?: string;
    proofUrl?: string;
    metadata?: any;
  }) {
    const action = await prisma.contestEngagementAction.create({
      data: {
        contestId: data.contestId,
        userId: data.userId,
        actionType: data.actionType,
        targetUrl: data.targetUrl,
        proofUrl: data.proofUrl,
        metadata: data.metadata,
        isCompleted: true,
        completedAt: new Date()
      }
    });

    // Track funnel event
    await this.trackFunnelEvent({
      userId: data.userId,
      contestId: data.contestId,
      stage: 'ENGAGEMENT',
      eventType: data.actionType,
      sourceType: 'contest',
      sourceId: data.contestId,
      metadata: data.metadata
    });

    return action;
  }

  // ═══════════════════════════════════════════════════════════
  // POST-CONTEST CONVERSION CAMPAIGNS
  // ═══════════════════════════════════════════════════════════

  /**
   * Create conversion campaign targeting contest participants
   * Winners → Advocates, Losers → Customers
   */
  static async createConversionCampaign(data: {
    contestId: string;
    brandId?: string;
    type: string;
    title: string;
    description?: string;
    targetSegment: 'LOSERS' | 'WINNERS' | 'ALL_PARTICIPANTS' | 'HIGH_ENGAGERS';
    discountPercent?: number;
    discountCode?: string;
    offerExpiresAt?: Date;
  }) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: data.contestId }
    });

    if (contest.status !== 'COMPLETED' && contest.status !== 'JUDGING') {
      throw new Error('Contest must be completed to create conversion campaign');
    }

    const campaign = await prisma.conversionCampaign.create({
      data: {
        contestId: data.contestId,
        brandId: data.brandId,
        type: data.type as any,
        title: data.title,
        description: data.description,
        targetSegment: data.targetSegment,
        discountPercent: data.discountPercent ? new Prisma.Decimal(data.discountPercent) : null,
        discountCode: data.discountCode,
        offerExpiresAt: data.offerExpiresAt,
        isActive: true
      }
    });

    // Get target users based on segment
    const targetUsers = await this.getTargetSegment(data.contestId, data.targetSegment);

    // Create recipients
    const recipients = await prisma.conversionCampaignRecipient.createMany({
      data: targetUsers.map((userId: any) => ({
        campaignId: campaign.id,
        userId
      }))
    });

    // Update total sent count
    await prisma.conversionCampaign.update({
      where: { id: campaign.id },
      data: { totalSent: targetUsers.length }
    });

    return {
      ...campaign,
      recipientsCount: targetUsers.length
    };
  }

  /**
   * Get target users for conversion campaign
   */
  private static async getTargetSegment(
    contestId: string,
    segment: string
  ): Promise<string[]> {
    switch (segment) {
      case 'LOSERS': {
        // All participants who didn't win
        const winners = await prisma.contestWinner.findMany({
          where: { contestId },
          select: { userId: true }
        });
        const winnerIds = winners.map((w: any) => w.userId);

        const participants = await prisma.contestParticipant.findMany({
          where: {
            contestId,
            userId: { notIn: winnerIds }
          },
          select: { userId: true }
        });

        return participants.map((p: any) => p.userId);
      }

      case 'WINNERS': {
        const winners = await prisma.contestWinner.findMany({
          where: { contestId },
          select: { userId: true }
        });
        return winners.map((w: any) => w.userId);
      }

      case 'HIGH_ENGAGERS': {
        // Users who voted, shared, or completed actions
        const engagers = await prisma.contestEngagementAction.findMany({
          where: { contestId, isCompleted: true },
          select: { userId: true },
          distinct: ['userId']
        });
        return engagers.map((e: any) => e.userId);
      }

      case 'ALL_PARTICIPANTS':
      default: {
        const participants = await prisma.contestParticipant.findMany({
          where: { contestId },
          select: { userId: true }
        });
        return participants.map((p: any) => p.userId);
      }
    }
  }

  /**
   * Track conversion campaign interaction
   */
  static async trackCampaignInteraction(data: {
    campaignId: string;
    userId: string;
    action: 'OPENED' | 'CLICKED' | 'CONVERTED';
    orderId?: string;
    revenueKr?: number;
  }) {
    const recipient = await prisma.conversionCampaignRecipient.findUniqueOrThrow({
      where: {
        campaignId_userId: {
          campaignId: data.campaignId,
          userId: data.userId
        }
      }
    });

    const updateData: any = {};
    const campaignUpdate: any = {};

    switch (data.action) {
      case 'OPENED':
        updateData.openedAt = new Date();
        campaignUpdate.totalOpened = { increment: 1 };
        break;
      case 'CLICKED':
        updateData.clickedAt = new Date();
        campaignUpdate.totalClicked = { increment: 1 };
        break;
      case 'CONVERTED':
        updateData.convertedAt = new Date();
        updateData.orderId = data.orderId;
        updateData.revenueKr = data.revenueKr ? new Prisma.Decimal(data.revenueKr) : null;
        campaignUpdate.totalConverted = { increment: 1 };
        if (data.revenueKr) {
          campaignUpdate.revenueGenerated = {
            increment: new Prisma.Decimal(data.revenueKr)
          };
        }
        break;
    }

    await prisma.$transaction([
      prisma.conversionCampaignRecipient.update({
        where: {
          campaignId_userId: {
            campaignId: data.campaignId,
            userId: data.userId
          }
        },
        data: updateData
      }),
      prisma.conversionCampaign.update({
        where: { id: data.campaignId },
        data: campaignUpdate
      })
    ]);
  }

  // ═══════════════════════════════════════════════════════════
  // SALES FUNNEL TRACKING
  // ═══════════════════════════════════════════════════════════

  /**
   * Track user journey through sales funnel
   * Stages: AWARENESS → INTEREST → CONSIDERATION → CONVERSION → RETENTION → ADVOCACY
   */
  static async trackFunnelEvent(data: {
    userId: string;
    contestId?: string;
    campaignId?: string;
    stage: string;
    eventType: string;
    sourceType?: string;
    sourceId?: string;
    metadata?: any;
  }) {
    return prisma.salesFunnelEvent.create({
      data: {
        userId: data.userId,
        contestId: data.contestId,
        campaignId: data.campaignId,
        stage: data.stage as any,
        eventType: data.eventType,
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        metadata: data.metadata
      }
    });
  }

  /**
   * Get funnel analytics for contest
   */
  static async getContestFunnelAnalytics(contestId: string) {
    const events = await prisma.salesFunnelEvent.groupBy({
      by: ['stage'],
      where: { contestId },
      _count: { userId: true }
    });

    const stages = {
      AWARENESS: 0,
      INTEREST: 0,
      CONSIDERATION: 0,
      CONVERSION: 0,
      RETENTION: 0,
      ADVOCACY: 0
    };

    events.forEach((e: any) => {
      stages[e.stage as keyof typeof stages] = e._count.userId;
    });

    // Calculate conversion rates
    const conversionRates = {
      awarenessToInterest: stages.AWARENESS > 0 ? (stages.INTEREST / stages.AWARENESS) * 100 : 0,
      interestToConsideration: stages.INTEREST > 0 ? (stages.CONSIDERATION / stages.INTEREST) * 100 : 0,
      considerationToConversion: stages.CONSIDERATION > 0 ? (stages.CONVERSION / stages.CONSIDERATION) * 100 : 0,
      conversionToRetention: stages.CONVERSION > 0 ? (stages.RETENTION / stages.CONVERSION) * 100 : 0,
      retentionToAdvocacy: stages.RETENTION > 0 ? (stages.ADVOCACY / stages.RETENTION) * 100 : 0
    };

    return {
      stages,
      conversionRates,
      totalUsers: stages.AWARENESS,
      finalConversions: stages.CONVERSION
    };
  }

  /**
   * Get ROI metrics for contest
   */
  static async getContestROI(contestId: string) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: contestId },
      include: {
        sponsorships: true,
        purchaseEntries: true
      }
    });

    // Calculate total investment
    const prizeCost = Number(contest.prizeTotalKr);
    const platformFee = Number(contest.platformFeeKr);
    const sponsorshipRevenue = contest.sponsorships.reduce(
      (sum, s) => sum + Number(s.sponsorshipKr),
      0
    );

    // Calculate revenue from purchases
    const purchaseRevenue = contest.purchaseEntries.reduce(
      (sum, p) => sum + Number(p.purchaseAmount),
      0
    );

    // Get conversion campaign revenue
    const conversionCampaigns = await prisma.conversionCampaign.findMany({
      where: { contestId }
    });
    const conversionRevenue = conversionCampaigns.reduce(
      (sum, c) => sum + Number(c.revenueGenerated),
      0
    );

    const totalRevenue = purchaseRevenue + conversionRevenue + sponsorshipRevenue;
    const totalCost = prizeCost + platformFee;
    const netProfit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? ((netProfit / totalCost) * 100) : 0;

    return {
      investment: {
        prizeCost,
        platformFee,
        totalCost
      },
      revenue: {
        purchaseRevenue,
        conversionRevenue,
        sponsorshipRevenue,
        totalRevenue
      },
      metrics: {
        netProfit,
        roi: roi.toFixed(2),
        participants: contest.totalParticipants,
        submissions: contest.totalSubmissions,
        revenuePerParticipant: contest.totalParticipants > 0 
          ? (totalRevenue / contest.totalParticipants).toFixed(2) 
          : 0
      }
    };
  }

  // ═══════════════════════════════════════════════════════════
  // GAMIFICATION INTEGRATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Award gamification points for activities
   */
  static async awardPoints(data: {
    userId: string;
    activityType: string;
    category: 'ENGAGEMENT' | 'MARKETING' | 'SALES';
    pointsEarned: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Record activity
      await tx.gamificationActivity.create({
        data: {
          userId: data.userId,
          activityType: data.activityType,
          category: data.category,
          pointsEarned: data.pointsEarned,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          description: data.description
        }
      });

      // Update user points
      const points = await tx.gamificationPoints.upsert({
        where: { userId: data.userId },
        create: {
          userId: data.userId,
          engagementPoints: data.category === 'ENGAGEMENT' ? data.pointsEarned : 0,
          marketingPoints: data.category === 'MARKETING' ? data.pointsEarned : 0,
          salesPoints: data.category === 'SALES' ? data.pointsEarned : 0,
          totalPoints: data.pointsEarned,
          currentLevel: 1,
          nextLevelAt: 1000
        },
        update: {
          engagementPoints: data.category === 'ENGAGEMENT' 
            ? { increment: data.pointsEarned } 
            : undefined,
          marketingPoints: data.category === 'MARKETING' 
            ? { increment: data.pointsEarned } 
            : undefined,
          salesPoints: data.category === 'SALES' 
            ? { increment: data.pointsEarned } 
            : undefined,
          totalPoints: { increment: data.pointsEarned }
        }
      });

      // Check for level up
      if (points.totalPoints >= points.nextLevelAt) {
        const newLevel = points.currentLevel + 1;
        const nextLevelAt = newLevel * 1000; // Simple progression

        await tx.gamificationPoints.update({
          where: { userId: data.userId },
          data: {
            currentLevel: newLevel,
            nextLevelAt
          }
        });
      }

      return points;
    });
  }

  /**
   * Get user gamification stats
   */
  static async getUserGamificationStats(userId: string) {
    const points = await prisma.gamificationPoints.findUnique({
      where: { userId }
    });

    if (!points) {
      return {
        totalPoints: 0,
        currentLevel: 1,
        nextLevelAt: 1000,
        breakdown: {
          engagement: 0,
          marketing: 0,
          sales: 0
        }
      };
    }

    const recentActivities = await prisma.gamificationActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return {
      totalPoints: points.totalPoints,
      currentLevel: points.currentLevel,
      nextLevelAt: points.nextLevelAt,
      progressToNextLevel: ((points.totalPoints / points.nextLevelAt) * 100).toFixed(2),
      breakdown: {
        engagement: points.engagementPoints,
        marketing: points.marketingPoints,
        sales: points.salesPoints
      },
      recentActivities: recentActivities.map((a: any) => ({
        type: a.activityType,
        category: a.category,
        points: a.pointsEarned,
        description: a.description,
        createdAt: a.createdAt.toISOString()
      }))
    };
  }

  /**
   * Transition contest winner to influencer
   * Winners with multiple wins get invited to influencer program
   */
  static async checkInfluencerTransition(userId: string) {
    const winCount = await prisma.contestWinner.count({
      where: { userId }
    });

    // If user has 3+ wins, invite to influencer program
    if (winCount >= 3) {
      const existingProfile = await prisma.influencerProfile.findUnique({
        where: { userId }
      });

      if (!existingProfile) {
        // Create basic influencer profile
        await prisma.influencerProfile.create({
          data: {
            userId,
            tier: 'NANO',
            categories: [],
            isAvailable: true,
            isVerified: false
          }
        });

        // Award points for becoming influencer
        await this.awardPoints({
          userId,
          activityType: 'INFLUENCER_TRANSITION',
          category: 'MARKETING',
          pointsEarned: 500,
          description: 'Transitioned to influencer after multiple contest wins'
        });

        return true;
      }
    }

    return false;
  }
}
