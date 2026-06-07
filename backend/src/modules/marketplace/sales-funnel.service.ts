import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

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
    contest_id: string;
    userId: string;
    orderId: string;
    purchaseAmount: number;
    productIds: string[];
  }) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: data.contest_id }
    });

    // Verify contest allows purchase entries
    if (!contest.entry_fee_kr || contest.entry_fee_kr.equals(0)) {
      throw new Error('Contest does not have purchase-to-enter enabled');
    }

    // Check if purchase meets minimum
    const minPurchase = Number(contest.entry_fee_kr);
    if (data.purchaseAmount < minPurchase) {
      throw new Error(`Purchase must be at least Kr.${minPurchase}`);
    }

    return prisma.$transaction(async (tx) => {
      // Record purchase entry
      const entry = await tx.contest_purchase_entries.create({
        data: {
          contest_id: data.contest_id,
          user_id: data.userId,
          order_id: data.orderId,
          purchase_amount: new Prisma.Decimal(data.purchaseAmount),
          product_ids: data.productIds,
          is_eligible: true,
          auto_entered: true
        }
      });

      // Auto-join contest if not already joined
      const participant = await tx.contest_participants.findUnique({
        where: {
          contest_id_user_id: {
            contest_id: data.contest_id,
            user_id: data.userId
          }
        }
      });

      if (!participant) {
        await tx.contest_participants.create({
          data: {
            contest_id: data.contest_id,
            user_id: data.userId
          }
        });

        await tx.contest.update({
          where: { id: data.contest_id },
          data: { total_participants: { increment: 1 } }
        });
      }

      // Track funnel event
      await this.trackFunnelEvent({
        user_id: data.userId,
        contestId: data.contest_id,
        stage: 'CONVERSION',
        eventType: 'purchase_to_enter',
        sourceType: 'contest',
        sourceId: data.contest_id,
        metadata: {
          order_id: data.orderId,
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
    contest_id: string;
    userId: string;
    actionType: string;
    targetUrl?: string;
    proofUrl?: string;
    metadata?: any;
  }) {
    const action = await prisma.contest_engagement_actions.create({
      data: {
        contest_id: data.contest_id,
        user_id: data.userId,
        action_type: data.actionType,
        target_url: data.targetUrl,
        proof_url: data.proofUrl,
        metadata: data.metadata,
        is_completed: true,
        completed_at: new Date()
      }
    } as any);

    // Track funnel event
    await this.trackFunnelEvent({
      user_id: data.userId,
      contestId: data.contest_id,
      stage: 'ENGAGEMENT',
      eventType: data.actionType,
      sourceType: 'contest',
      sourceId: data.contest_id,
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
    contest_id: string;
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
      where: { id: data.contest_id }
    });

    if (contest.status !== 'COMPLETED' && contest.status !== 'JUDGING') {
      throw new Error('Contest must be completed to create conversion campaign');
    }

    const campaign = await prisma.conversion_campaigns.create({
      data: {
        contest_id: data.contest_id,
        brand_id: data.brandId,
        type: data.type as any,
        title: data.title,
        description: data.description,
        target_segment: data.targetSegment,
        discount_percent: data.discountPercent ? new Prisma.Decimal(data.discountPercent) : null,
        discount_code: data.discountCode,
        offer_expires_at: data.offerExpiresAt,
        is_active: true
      }
    });

    // Get target users based on segment
    const targetUsers = await this.getTargetSegment(data.contest_id, data.targetSegment);

    // Create recipients
    const recipients = await prisma.conversion_campaign_recipients.createMany({
      data: targetUsers.map((userId: any) => ({
        campaign_id: campaign.id,
        user_id: userId
      }))
    });

    // Update total sent count
    await prisma.conversion_campaigns.update({
      where: { id: campaign.id },
      data: { total_sent: targetUsers.length }
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
        const winners = await prisma.contest_winners.findMany({
          where: { contest_id: contestId },
          select: { user_id: true }
        });
        const winnerIds = winners.map((w: any) => w.user_id);

        const participants = await prisma.contest_participants.findMany({
          where: {
            contest_id: contestId,
            user_id: { notIn: winnerIds }
          },
          select: { user_id: true }
        });

        return participants.map((p: any) => p.user_id);
      }

      case 'WINNERS': {
        const winners = await prisma.contest_winners.findMany({
          where: { contest_id: contestId },
          select: { user_id: true }
        });
        return winners.map((w: any) => w.user_id);
      }

      case 'HIGH_ENGAGERS': {
        // Users who voted, shared, or completed actions
        const engagers = await prisma.contest_engagement_actions.findMany({
          where: { contest_id: contestId, is_completed: true },
          select: { user_id: true },
          distinct: ['user_id']
        });
        return engagers.map((e: any) => e.user_id);
      }

      case 'ALL_PARTICIPANTS':
      default: {
        const participants = await prisma.contest_participants.findMany({
          where: { contest_id: contestId },
          select: { user_id: true }
        });
        return participants.map((p: any) => p.user_id);
      }
    }
  }

  /**
   * Track conversion campaign interaction
   */
  static async trackCampaignInteraction(data: {
    campaign_id: string;
    userId: string;
    action: 'OPENED' | 'CLICKED' | 'CONVERTED';
    orderId?: string;
    revenueKr?: number;
  }) {
    const recipient = await prisma.conversion_campaign_recipients.findUniqueOrThrow({
      where: {
        campaign_id_user_id: {
          campaign_id: data.campaign_id,
          user_id: data.userId
        }
      }
    });

    const updateData: any = {};
    const campaignUpdate: any = {};

    switch (data.action) {
      case 'OPENED':
        updateData.opened_at = new Date();
        campaignUpdate.total_opened = { increment: 1 };
        break;
      case 'CLICKED':
        updateData.clicked_at = new Date();
        campaignUpdate.total_clicked = { increment: 1 };
        break;
      case 'CONVERTED':
        updateData.converted_at = new Date();
        updateData.order_id = data.orderId;
        updateData.revenue_kr = data.revenueKr ? new Prisma.Decimal(data.revenueKr) : null;
        campaignUpdate.total_converted = { increment: 1 };
        if (data.revenueKr) {
          campaignUpdate.revenue_generated = {
            increment: new Prisma.Decimal(data.revenueKr)
          };
        }
        break;
    }

    await prisma.$transaction([
      prisma.conversion_campaign_recipients.update({
        where: {
          campaign_id_user_id: {
            campaign_id: data.campaign_id,
            user_id: data.userId
          }
        },
        data: updateData
      }),
      prisma.conversion_campaigns.update({
        where: { id: data.campaign_id },
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
    user_id: string;
    contestId?: string;
    campaignId?: string;
    stage: string;
    eventType: string;
    sourceType?: string;
    sourceId?: string;
    metadata?: any;
  }) {
    return prisma.sales_funnel_events.create({
      data: {
        user_id: data.user_id,
        contest_id: data.contestId,
        campaign_id: data.campaignId,
        stage: data.stage as any,
        event_type: data.eventType,
        source_type: data.sourceType,
        source_id: data.sourceId,
        metadata: data.metadata
      }
    });
  }

  /**
   * Get funnel analytics for contest
   */
  static async getContestFunnelAnalytics(contestId: string) {
    const events = await prisma.sales_funnel_events.groupBy({
      by: ['stage'],
      where: { contest_id: contestId },
      _count: { user_id: true }
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
      stages[e.stage as keyof typeof stages] = e._count.user_id;
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
        contest_sponsorships: true,
        contest_purchase_entries: true
      }
    });

    // Calculate total investment
    const prizeCost = Number(contest.prize_total_kr);
    const platformFee = Number(contest.platform_fee_kr);
    const sponsorshipRevenue = contest.contest_sponsorships.reduce(
      (sum, s) => sum + Number(s.sponsorship_kr),
      0
    );

    // Calculate revenue from purchases
    const purchaseRevenue = contest.contest_purchase_entries.reduce(
      (sum, p) => sum + Number(p.purchase_amount),
      0
    );

    // Get conversion campaign revenue
    const conversionCampaigns = await prisma.conversion_campaigns.findMany({
      where: { contest_id: contestId }
    });
    const conversionRevenue = conversionCampaigns.reduce(
      (sum, c) => sum + Number(c.revenue_generated),
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
        participants: contest.total_participants,
        submissions: contest.total_submissions,
        revenuePerParticipant: contest.total_participants > 0 
          ? (totalRevenue / contest.total_participants).toFixed(2) 
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
    user_id: string;
    activityType: string;
    category: 'ENGAGEMENT' | 'MARKETING' | 'SALES';
    pointsEarned: number;
    referenceType?: string;
    referenceId?: string;
    description?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Record activity
      await tx.gamification_activities.create({
        data: {
          user_id: data.user_id,
          activity_type: data.activityType,
          category: data.category,
          points_earned: data.pointsEarned,
          reference_type: data.referenceType,
          reference_id: data.referenceId,
          description: data.description
        }
      });

      // Update user points
      const points = await tx.gamification_points.upsert({
        where: { user_id: data.user_id },
        create: {
          user_id: data.user_id,
          engagement_points: data.category === 'ENGAGEMENT' ? data.pointsEarned : 0,
          marketing_points: data.category === 'MARKETING' ? data.pointsEarned : 0,
          sales_points: data.category === 'SALES' ? data.pointsEarned : 0,
          total_points: data.pointsEarned,
          current_level: 1,
          next_level_at: 1000,
          updated_at: new Date()
        },
        update: {
          engagement_points: data.category === 'ENGAGEMENT' 
            ? { increment: data.pointsEarned } 
            : undefined,
          marketing_points: data.category === 'MARKETING' 
            ? { increment: data.pointsEarned } 
            : undefined,
          sales_points: data.category === 'SALES' 
            ? { increment: data.pointsEarned } 
            : undefined,
          total_points: { increment: data.pointsEarned },
          updated_at: new Date()
        }
      });

      // Check for level up
      if (points.total_points >= points.next_level_at) {
        const newLevel = points.current_level + 1;
        const nextLevelAt = newLevel * 1000; // Simple progression

        await tx.gamification_points.update({
          where: { user_id: data.user_id },
          data: {
            current_level: newLevel,
            next_level_at: nextLevelAt,
            updated_at: new Date()
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
    const points = await prisma.gamification_points.findUnique({
      where: { user_id: userId }
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

    const recentActivities = await prisma.gamification_activities.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    return {
      totalPoints: points.total_points,
      currentLevel: points.current_level,
      nextLevelAt: points.next_level_at,
      progressToNextLevel: ((points.total_points / points.next_level_at) * 100).toFixed(2),
      breakdown: {
        engagement: points.engagement_points,
        marketing: points.marketing_points,
        sales: points.sales_points
      },
      recentActivities: recentActivities.map((a: any) => ({
        type: a.activity_type,
        category: a.category,
        points: a.points_earned,
        description: a.description,
        created_at: a.created_at.toISOString()
      }))
    };
  }

  /**
   * Transition contest winner to influencer
   * Winners with multiple wins get invited to influencer program
   */
  static async checkInfluencerTransition(userId: string) {
    const winCount = await prisma.contest_winners.count({
      where: { user_id: userId }
    });

    // If user has 3+ wins, invite to influencer program
    if (winCount >= 3) {
      const existingProfile = await prisma.influencer_profiles.findUnique({
        where: { user_id: userId }
      });

      if (!existingProfile) {
        // Create basic influencer profile
        await prisma.influencer_profiles.create({
          data: {
            user_id: userId,
            tier: 'NANO',
            categories: [],
            is_available: true,
            is_verified: false,
            updated_at: new Date()
          }
        } as any);

        // Award points for becoming influencer
        await this.awardPoints({
          user_id: userId,
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
