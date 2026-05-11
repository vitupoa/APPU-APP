import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { CreateSponsoredContentRequest, SponsoredContentStatus, PricingModel } from './sponsored.types.js';

/**
 * Sponsored Content Service - Native Ad Marketplace
 * Brands pay to promote their shorts/posts as sponsored content
 */
export class SponsoredContentService {
  
  /**
   * Create a sponsored content campaign
   */
  static async createCampaign(brandUserId: string, data: CreateSponsoredContentRequest) {
    const { contentType, contentId, campaignName, budget, pricingModel, bidAmount, startDate, endDate, targeting } = data;

    // Verify brand has sufficient balance
    const wallet = await prisma.wallet.findUnique({ where: { userId: brandUserId } });
    if (!wallet || wallet.krBalance.lt(budget)) {
      throw new Error('Insufficient balance');
    }

    // Create campaign and escrow funds atomically
    const campaign = await prisma.$transaction(async (tx) => {
      // Deduct budget from wallet
      await tx.wallet.update({
        where: { userId: brandUserId },
        data: { krBalance: { decrement: new Prisma.Decimal(budget) } }
      });

      // Create escrow
      const escrow = await tx.escrow.create({
        data: {
          userId: brandUserId,
          contestId: contentId, // Reuse contestId field temporarily
          prizeAmountKr: new Prisma.Decimal(budget),
          feeAmountKr: new Prisma.Decimal(0),
          status: 'held'
        }
      });

      // Create sponsored campaign
      return await tx.sponsoredContent.create({
        data: {
          brandUserId,
          contentType,
          contentId,
          campaignName,
          budget: new Prisma.Decimal(budget),
          spent: new Prisma.Decimal(0),
          pricingModel,
          bidAmount: new Prisma.Decimal(bidAmount),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          targeting: targeting || {},
          status: SponsoredContentStatus.PENDING_REVIEW,
          escrowId: escrow.id
        }
      });
    });

    return campaign;
  }

  /**
   * Get sponsored content for feed insertion
   * Returns sponsored shorts that match user's profile
   */
  static async getSponsoredContentForUser(userId: string, contentType: string = 'short') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const now = new Date();

    // Find active campaigns matching user profile
    const campaigns = await prisma.sponsoredContent.findMany({
      where: {
        contentType,
        status: SponsoredContentStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gte: now },
        spent: { lt: prisma.sponsoredContent.fields.budget }
      },
      take: 5
    });

    // Filter by targeting criteria
    const matched = campaigns.filter(campaign => {
      const targeting = campaign.targeting as any;
      if (!targeting) return true;

      if (targeting.countries && targeting.countries.length > 0) {
        if (!targeting.countries.includes(user.country)) return false;
      }

      return true;
    });

    // Return highest bidder
    return matched.sort((a, b) => b.bidAmount.toNumber() - a.bidAmount.toNumber())[0] || null;
  }

  /**
   * Record impression when sponsored content is shown
   */
  static async recordImpression(campaignId: string, userId: string) {
    await prisma.$transaction([
      prisma.sponsoredContent.update({
        where: { id: campaignId },
        data: { impressions: { increment: 1 } }
      }),
      prisma.sponsoredImpression.create({
        data: {
          campaignId,
          userId,
          type: 'impression'
        }
      })
    ]);
  }

  /**
   * Record view (3+ seconds watch time)
   */
  static async recordView(campaignId: string, userId: string, watchTimeSeconds: number) {
    const campaign = await prisma.sponsoredContent.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.pricingModel !== PricingModel.CPV) return;

    const cost = campaign.bidAmount;

    await prisma.$transaction([
      prisma.sponsoredContent.update({
        where: { id: campaignId },
        data: {
          views: { increment: 1 },
          spent: { increment: cost }
        }
      }),
      prisma.sponsoredImpression.create({
        data: {
          campaignId,
          userId,
          type: 'view',
          cost
        }
      })
    ]);
  }

  /**
   * Record engagement (like/comment/share)
   */
  static async recordEngagement(campaignId: string, userId: string, engagementType: string) {
    const campaign = await prisma.sponsoredContent.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.pricingModel !== PricingModel.CPE) return;

    const cost = campaign.bidAmount;

    await prisma.$transaction([
      prisma.sponsoredContent.update({
        where: { id: campaignId },
        data: {
          engagements: { increment: 1 },
          spent: { increment: cost }
        }
      }),
      prisma.sponsoredImpression.create({
        data: {
          campaignId,
          userId,
          type: engagementType,
          cost
        }
      })
    ]);
  }

  /**
   * Get campaign analytics
   */
  static async getCampaignAnalytics(campaignId: string) {
    const campaign = await prisma.sponsoredContent.findUnique({
      where: { id: campaignId },
      include: {
        impressionLog: {
          select: {
            type: true,
            cost: true,
            createdAt: true
          }
        }
      }
    });

    if (!campaign) throw new Error('Campaign not found');

    const impressions = campaign.impressionLog.filter(i => i.type === 'impression').length;
    const views = campaign.impressionLog.filter(i => i.type === 'view').length;
    const engagements = campaign.impressionLog.filter(i => ['like', 'comment', 'share'].includes(i.type)).length;
    const clicks = campaign.impressionLog.filter(i => i.type === 'click').length;

    return {
      campaignName: campaign.campaignName,
      status: campaign.status,
      budget: campaign.budget.toNumber(),
      spent: campaign.spent.toNumber(),
      impressions,
      views,
      engagements,
      clicks,
      cpm: impressions > 0 ? (campaign.spent.toNumber() / impressions) * 1000 : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      engagementRate: views > 0 ? (engagements / views) * 100 : 0
    };
  }

  /**
   * Approve campaign (admin action)
   */
  static async approveCampaign(campaignId: string) {
    return await prisma.sponsoredContent.update({
      where: { id: campaignId },
      data: { status: SponsoredContentStatus.ACTIVE }
    });
  }

  /**
   * Pause/Resume campaign
   */
  static async toggleCampaign(campaignId: string, brandUserId: string) {
    const campaign = await prisma.sponsoredContent.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.brandUserId !== brandUserId) {
      throw new Error('Unauthorized');
    }

    const newStatus = campaign.status === SponsoredContentStatus.ACTIVE
      ? SponsoredContentStatus.PAUSED
      : SponsoredContentStatus.ACTIVE;

    return await prisma.sponsoredContent.update({
      where: { id: campaignId },
      data: { status: newStatus }
    });
  }

  /**
   * Get my campaigns
   */
  static async getMyCampaigns(brandUserId: string) {
    return await prisma.sponsoredContent.findMany({
      where: { brandUserId },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get pending campaigns (admin)
   */
  static async getPendingCampaigns() {
    return await prisma.sponsoredContent.findMany({
      where: { status: SponsoredContentStatus.PENDING_REVIEW },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Reject campaign (admin)
   */
  static async rejectCampaign(campaignId: string) {
    return await prisma.sponsoredContent.update({
      where: { id: campaignId },
      data: { status: SponsoredContentStatus.REJECTED }
    });
  }
}
