import { prisma } from '../../config/database.js';
import crypto from 'crypto';

export class NicheAdTargetingService {
  async tagContentWithNiche(
    contentId: string,
    contentType: 'SHORT' | 'POST',
    niche: string,
    confidence: number = 1.0
  ) {
    return prisma.content_niche_tags.upsert({
      where: {
        content_id_contentType_niche: {
          content_id: contentId,
          contentType,
          niche: niche as any,
        },
      },
      create: {
        content_id: contentId,
        contentType,
        niche: niche as any,
        confidence,
      },
      update: {
        confidence,
      },
    });
  }

  async getRelevantAdsForContent(
    contentId: string,
    contentType: 'SHORT' | 'POST',
    userId: string,
    placement: string
  ) {
    const nicheTags = await prisma.content_niche_tags.findMany({
      where: {
        content_id: contentId,
        contentType,
      },
      orderBy: { confidence: 'desc' },
    });

    if (nicheTags.length === 0) {
      return this.getGeneralAds(userId, placement);
    }

    const targetNiches = nicheTags.map((tag: any) => tag.niche);

    const campaigns = await prisma.display_ad_campaigns.findMany({
      where: {
        status: 'ACTIVE',
        start_date: { lte: new Date() },
        OR: [
          { end_date: null },
          { end_date: { gte: new Date() } },
          { target_content_niches: { hasSome: targetNiches as any[] } },
          { target_content_niches: { isEmpty: true } },
        ],
        placements: {
          has: placement as any,
        },
      },
      include: {
        ad_campaign_locations: true,
      },
    });

    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });

    const eligibleCampaigns = campaigns.filter((campaign: any) => {
      if (campaign.ad_campaign_locations.length === 0) return true;

      return campaign.ad_campaign_locations.some(
        (loc: any) =>
          !loc.is_excluded &&
          (loc.country === userProfile?.country || loc.scope === 'GLOBAL')
      );
    });

    const recentImpressions = await prisma.ad_impressions.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: { campaign_id: true },
    });

    const impressionCounts = recentImpressions.reduce((acc: any, imp: any) => {
      acc[imp.campaign_id] = (acc[imp.campaign_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedCampaigns = eligibleCampaigns
      .filter((c: any) => (impressionCounts[c.id] || 0) < 3)
      .sort((a: any, b: any) => {
        const aNicheMatch = a.target_content_niches.some((n: any) =>
          targetNiches.includes(n as any)
        );
        const bNicheMatch = b.target_content_niches.some((n: any) =>
          targetNiches.includes(n as any)
        );

        if (aNicheMatch && !bNicheMatch) return -1;
        if (!aNicheMatch && bNicheMatch) return 1;

        const aBid = parseFloat(a.target_cpm?.toString() || '0');
        const bBid = parseFloat(b.target_cpm?.toString() || '0');
        return bBid - aBid;
      });

    return sortedCampaigns.slice(0, 3);
  }

  async getGeneralAds(userId: string, placement: string) {
    const campaigns = await prisma.display_ad_campaigns.findMany({
      where: {
        status: 'ACTIVE',
        start_date: { lte: new Date() },
        OR: [
          { end_date: null },
          { end_date: { gte: new Date() } },
        ],
        placements: {
          has: placement as any,
        },
        target_content_niches: { isEmpty: true },
      },
      include: {
        ad_campaign_locations: true,
      },
      take: 10,
    });

    const recentImpressions = await prisma.ad_impressions.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: { campaign_id: true },
    });

    const impressionCounts = recentImpressions.reduce((acc: any, imp: any) => {
      acc[imp.campaign_id] = (acc[imp.campaign_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return campaigns
      .filter((c: any) => (impressionCounts[c.id] || 0) < 3)
      .sort((a: any, b: any) => {
        const aBid = parseFloat(a.target_cpm?.toString() || '0');
        const bBid = parseFloat(b.target_cpm?.toString() || '0');
        return bBid - aBid;
      })
      .slice(0, 3);
  }

  async recordAdImpression(
    campaignId: string,
    userId: string,
    placement: string,
    contentId?: string,
    contentType?: string,
    contentNiche?: string,
    chatId?: string,
    chatNiche?: string
  ) {
    const campaign = await prisma.display_ad_campaigns.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');

    const cpm = parseFloat(campaign.target_cpm?.toString() || '50');
    const costKes = cpm / 1000;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });

    await prisma.ad_impressions.create({
      data: {
        campaign_id: campaignId,
        user_id: userId,
        placement: placement as any,
        content_id: contentId,
        content_type: contentType,
        content_niche: contentNiche,
        chat_id: chatId,
        chat_niche: chatNiche as any,
        cost_kes: costKes,
        user_country: user?.country,
      },
    });

    await prisma.display_ad_campaigns.update({
      where: { id: campaignId },
      data: {
        impressions: { increment: 1 },
        total_spent_kes: { increment: costKes },
      },
    });
  }

  async recordAdClick(impressionId: string) {
    const impression = await prisma.ad_impressions.update({
      where: { id: impressionId },
      data: { was_clicked: true },
    });

    await prisma.display_ad_campaigns.update({
      where: { id: impression.campaign_id },
      data: { clicks: { increment: 1 } },
    });
  }
}
