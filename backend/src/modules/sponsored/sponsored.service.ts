import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import { CreateSponsoredContentRequest, SponsoredContentStatus, PricingModel, SponsoredContentType } from './sponsored.types.js';

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
    const wallet = await prisma.wallets.findUnique({ where: { user_id: brandUserId } });
    if (!wallet || wallet.kr_balance.lt(budget)) {
      throw new Error('Insufficient balance');
    }

    // Create campaign and escrow funds atomically
    const campaign = await prisma.$transaction(async (tx) => {
      // Deduct budget from wallet
      await tx.wallets.update({
        where: { user_id: brandUserId },
        data: { kr_balance: { decrement: new Prisma.Decimal(budget) } }
      });

      // Create escrow
      const escrow = await tx.escrows.create({
        data: {
          user_id: brandUserId,
          contest_id: contentId, // Reuse contestId field temporarily
          prize_amount_kr: new Prisma.Decimal(budget),
          fee_amount_kr: new Prisma.Decimal(0),
          status: 'held'
        }
      });

      // Create sponsored campaign
      return await tx.sponsored_content.create({
        data: {
          brand_user_id: brandUserId,
          content_type: contentType,
          content_id: contentId,
          campaign_name: campaignName,
          budget: new Prisma.Decimal(budget),
          spent: new Prisma.Decimal(0),
          pricing_model: pricingModel,
          bid_amount: new Prisma.Decimal(bidAmount),
          start_date: new Date(startDate),
          end_date: new Date(endDate),
          targeting: targeting || {},
          status: SponsoredContentStatus.PENDING_REVIEW,
          escrow_id: escrow.id,
          updated_at: new Date()
        }
      });
    });

    return campaign;
  }

  /**
   * Get sponsored content for feed insertion
   * Returns sponsored shorts that match user's profile
   */
  static async getSponsoredContentForUser(userId: string, contentType: SponsoredContentType = SponsoredContentType.SHORT) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const now = new Date();

    // Find active campaigns matching user profile
    const campaigns = await prisma.sponsored_content.findMany({
      where: {
        content_type: contentType,
        status: SponsoredContentStatus.ACTIVE,
        start_date: { lte: now },
        end_date: { gte: now },
        spent: { lt: prisma.sponsored_content.fields.budget }
      },
      take: 5
    });

    // Filter by targeting criteria
    const matched = campaigns.filter((campaign: any) => {
      const targeting = campaign.targeting as any;
      if (!targeting) return true;

      if (targeting.countries && targeting.countries.length > 0) {
        if (!targeting.countries.includes(user.country)) return false;
      }

      return true;
    });

    // Return highest bidder
    return matched.sort((a: any, b: any) => b.bid_amount.toNumber() - a.bid_amount.toNumber())[0] || null;
  }

  /**
   * Record impression when sponsored content is shown
   */
  static async recordImpression(campaignId: string, user_id: string) {
    await prisma.$transaction([
      prisma.sponsored_content.update({
        where: { id: campaignId },
        data: { impressions: { increment: 1 } }
      }),
      prisma.sponsored_impressions.create({
        data: {
          campaign_id: campaignId,
          user_id,
          type: 'impression'
        }
      })
    ]);
  }

  /**
   * Record view (3+ seconds watch time)
   */
  static async recordView(campaignId: string, user_id: string, _watchTimeSeconds: number) {
    const campaign = await prisma.sponsored_content.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.pricing_model !== PricingModel.CPV) return;

    const cost = campaign.bid_amount;

    await prisma.$transaction([
      prisma.sponsored_content.update({
        where: { id: campaignId },
        data: {
          views: { increment: 1 },
          spent: { increment: cost }
        }
      }),
      prisma.sponsored_impressions.create({
        data: {
          campaign_id: campaignId,
          user_id,
          type: 'view',
          cost
        }
      })
    ]);
  }

  /**
   * Record engagement (like/comment/share)
   */
  static async recordEngagement(campaignId: string, user_id: string, engagementType: string) {
    const campaign = await prisma.sponsored_content.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.pricing_model !== PricingModel.CPE) return;

    const cost = campaign.bid_amount;

    await prisma.$transaction([
      prisma.sponsored_content.update({
        where: { id: campaignId },
        data: {
          engagements: { increment: 1 },
          spent: { increment: cost }
        }
      }),
      prisma.sponsored_impressions.create({
        data: {
          campaign_id: campaignId,
          user_id,
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
    const campaign = await prisma.sponsored_content.findUnique({
      where: { id: campaignId },
      include: {
        sponsored_impressions: {
          select: {
            type: true,
            cost: true,
            created_at: true
          }
        }
      }
    });

    if (!campaign) throw new Error('Campaign not found');

    const impressions = campaign.sponsored_impressions.filter((i: any) => i.type === 'impression').length;
    const views = campaign.sponsored_impressions.filter((i: any) => i.type === 'view').length;
    const engagements = campaign.sponsored_impressions.filter((i: any) => ['like', 'comment', 'share'].includes(i.type)).length;
    const clicks = campaign.sponsored_impressions.filter((i: any) => i.type === 'click').length;

    return {
      campaignName: campaign.campaign_name,
      status: campaign.status,
      budget: campaign.budget.toNumber(),
      spent: campaign.spent.toNumber(),
      impressions,
      views,
      engagements,
      clicks,
      cpm: impressions > 0 ? (campaign.spent.toNumber() / impressions) * 1000 : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      engagement_rate: views > 0 ? (engagements / views) * 100 : 0
    };
  }

  /**
   * Approve campaign (admin action)
   */
  static async approveCampaign(campaignId: string) {
    return await prisma.sponsored_content.update({
      where: { id: campaignId },
      data: { status: SponsoredContentStatus.ACTIVE }
    });
  }

  /**
   * Pause/Resume campaign
   */
  static async toggleCampaign(campaignId: string, brandUserId: string) {
    const campaign = await prisma.sponsored_content.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.brand_user_id !== brandUserId) {
      throw new Error('Unauthorized');
    }

    const newStatus = campaign.status === SponsoredContentStatus.ACTIVE
      ? SponsoredContentStatus.PAUSED
      : SponsoredContentStatus.ACTIVE;

    return await prisma.sponsored_content.update({
      where: { id: campaignId },
      data: { status: newStatus }
    });
  }

  /**
   * Get my campaigns
   */
  static async getMyCampaigns(brandUserId: string) {
    return await prisma.sponsored_content.findMany({
      where: { brand_user_id: brandUserId },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Get pending campaigns (admin)
   */
  static async getPendingCampaigns() {
    return await prisma.sponsored_content.findMany({
      where: { status: SponsoredContentStatus.PENDING_REVIEW },
      include: { User: { select: { username: true, display_name: true } } },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Get all campaigns (admin)
   */
  static async getAllCampaigns() {
    return await prisma.sponsored_content.findMany({
      include: { User: { select: { username: true, display_name: true } } },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Reject campaign (admin)
   */
  static async rejectCampaign(campaignId: string) {
    return await prisma.sponsored_content.update({
      where: { id: campaignId },
      data: { status: SponsoredContentStatus.REJECTED }
    });
  }
}
