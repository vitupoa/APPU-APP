import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

export class NicheAdTargetingService {
  async tagContentWithNiche(
    contentId: string,
    contentType: 'SHORT' | 'POST',
    niche: string,
    confidence: number = 1.0
  ) {
    return prisma.contentNicheTag.upsert({
      where: {
        contentId_contentType_niche: {
          contentId,
          contentType,
          niche: niche as any,
        },
      },
      create: {
        contentId,
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
    const nicheTags = await prisma.contentNicheTag.findMany({
      where: {
        contentId,
        contentType,
      },
      orderBy: { confidence: 'desc' },
    });

    if (nicheTags.length === 0) {
      return this.getGeneralAds(userId, placement);
    }

    const targetNiches = nicheTags.map((tag) => tag.niche);

    const campaigns = await prisma.displayAdCampaign.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
        placements: {
          has: placement as any,
        },
        OR: [
          { targetContentNiches: { hasSome: targetNiches as any[] } },
          { targetContentNiches: { isEmpty: true } },
        ],
      },
      include: {
        locations: true,
      },
    });

    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });

    const eligibleCampaigns = campaigns.filter((campaign) => {
      if (campaign.locations.length === 0) return true;

      return campaign.locations.some(
        (loc) =>
          !loc.isExcluded &&
          (loc.country === userProfile?.country || loc.scope === 'GLOBAL')
      );
    });

    const recentImpressions = await prisma.adImpression.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: { campaignId: true },
    });

    const impressionCounts = recentImpressions.reduce((acc, imp) => {
      acc[imp.campaignId] = (acc[imp.campaignId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedCampaigns = eligibleCampaigns
      .filter((c) => (impressionCounts[c.id] || 0) < 3)
      .sort((a, b) => {
        const aNicheMatch = a.targetContentNiches.some((n) =>
          targetNiches.includes(n as any)
        );
        const bNicheMatch = b.targetContentNiches.some((n) =>
          targetNiches.includes(n as any)
        );

        if (aNicheMatch && !bNicheMatch) return -1;
        if (!aNicheMatch && bNicheMatch) return 1;

        const aBid = parseFloat(a.targetCpm?.toString() || '0');
        const bBid = parseFloat(b.targetCpm?.toString() || '0');
        return bBid - aBid;
      });

    return sortedCampaigns.slice(0, 3);
  }

  async getGeneralAds(userId: string, placement: string) {
    const campaigns = await prisma.displayAdCampaign.findMany({
      where: {
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } },
        ],
        placements: {
          has: placement as any,
        },
        targetContentNiches: { isEmpty: true },
      },
      include: {
        locations: true,
      },
      take: 10,
    });

    const recentImpressions = await prisma.adImpression.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: { campaignId: true },
    });

    const impressionCounts = recentImpressions.reduce((acc, imp) => {
      acc[imp.campaignId] = (acc[imp.campaignId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return campaigns
      .filter((c) => (impressionCounts[c.id] || 0) < 3)
      .sort((a, b) => {
        const aBid = parseFloat(a.targetCpm?.toString() || '0');
        const bBid = parseFloat(b.targetCpm?.toString() || '0');
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
    const campaign = await prisma.displayAdCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');

    const cpm = parseFloat(campaign.targetCpm?.toString() || '50');
    const costKes = cpm / 1000;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });

    await prisma.adImpression.create({
      data: {
        campaignId,
        userId,
        placement: placement as any,
        contentId,
        contentType,
        contentNiche: contentNiche as any,
        chatId,
        chatNiche: chatNiche as any,
        costKes,
        userCountry: user?.country,
      },
    });

    await prisma.displayAdCampaign.update({
      where: { id: campaignId },
      data: {
        impressions: { increment: 1 },
        totalSpentKes: { increment: costKes },
      },
    });
  }

  async recordAdClick(impressionId: string) {
    const impression = await prisma.adImpression.update({
      where: { id: impressionId },
      data: { wasClicked: true },
    });

    await prisma.displayAdCampaign.update({
      where: { id: impression.campaignId },
      data: { clicks: { increment: 1 } },
    });
  }
}
