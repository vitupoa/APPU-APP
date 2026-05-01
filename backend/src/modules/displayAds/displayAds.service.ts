import { prisma } from '../../config/database.js';

export class DisplayAdCampaignService {
  async createCampaign(brandId: string, data: any) {
    const {
      campaignName,
      campaignObjective,
      adTitle,
      adDescription,
      primaryImageUrl,
      ctaText,
      ctaUrl,
      budgetType,
      dailyBudgetKes,
      lifetimeBudgetKes,
      biddingStrategy,
      targetCpm,
      targetAgeMin,
      targetAgeMax,
      targetGenders,
      targetInterests,
      placements,
      chatNiches,
      locations,
      startDate,
      endDate,
    } = data;

    const minBudget = await this.calculateMinimumBudget(locations, budgetType);
    const budget = budgetType === 'DAILY' ? dailyBudgetKes : lifetimeBudgetKes;

    if (budget < minBudget) {
      throw new Error(`Minimum budget for selected targeting is KES ${minBudget}`);
    }

    const cpmRanges = await this.calculateCpmRanges(locations, placements);
    if (targetCpm && (targetCpm < cpmRanges.min || targetCpm > cpmRanges.max)) {
      throw new Error(`Target CPM must be between KES ${cpmRanges.min} and KES ${cpmRanges.max}`);
    }

    const campaign = await prisma.displayAdCampaign.create({
      data: {
        brandId,
        campaignName,
        campaignObjective,
        adTitle,
        adDescription,
        primaryImageUrl,
        ctaText,
        ctaUrl,
        budgetType,
        dailyBudgetKes: budgetType === 'DAILY' ? dailyBudgetKes : null,
        lifetimeBudgetKes: budgetType === 'LIFETIME' ? lifetimeBudgetKes : null,
        biddingStrategy,
        targetCpm,
        targetAgeMin,
        targetAgeMax,
        targetGenders,
        targetInterests,
        placements,
        chatNiches,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'PENDING',
        locations: {
          create: locations.map((loc: any) => ({
            scope: loc.scope,
            scopeValue: loc.scopeValue,
            scopeDisplayName: loc.displayName,
            continent: loc.continent,
            country: loc.country,
            region: loc.region,
            city: loc.city,
            town: loc.town,
            road: loc.road,
            landmark: loc.landmark,
            shoppingCenter: loc.shoppingCenter,
            latitude: loc.latitude,
            longitude: loc.longitude,
            radiusKm: loc.radiusKm,
            isExcluded: loc.isExcluded || false,
          })),
        },
      },
      include: {
        locations: true,
      },
    });

    return campaign;
  }

  async getBrandCampaigns(brandId: string) {
    return prisma.displayAdCampaign.findMany({
      where: { brandId },
      include: {
        locations: true,
        analytics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaignById(campaignId: string) {
    return prisma.displayAdCampaign.findUnique({
      where: { id: campaignId },
      include: {
        locations: true,
        analytics: {
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  async updateCampaign(campaignId: string, data: any) {
    return prisma.displayAdCampaign.update({
      where: { id: campaignId },
      data,
    });
  }

  async toggleCampaign(campaignId: string) {
    const campaign = await prisma.displayAdCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');

    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    return prisma.displayAdCampaign.update({
      where: { id: campaignId },
      data: { status: newStatus },
    });
  }

  async getCampaignAnalytics(campaignId: string, startDate: string, endDate: string) {
    return prisma.displayAdAnalytics.findMany({
      where: {
        campaignId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async searchLocations(query: string, scope?: string) {
    return prisma.locationMaster.findMany({
      where: {
        displayName: {
          contains: query,
          mode: 'insensitive',
        },
        scope: scope as any,
        isActive: true,
      },
      take: 20,
    });
  }

  async getCpmRanges(locations: any[], placements: string[]) {
    return this.calculateCpmRanges(locations, placements);
  }

  async getMinimumBudget(locations: any[], budgetType: string) {
    return this.calculateMinimumBudget(locations, budgetType);
  }

  async getPendingCampaigns() {
    return prisma.displayAdCampaign.findMany({
      where: { status: 'PENDING' },
      include: {
        locations: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveCampaign(campaignId: string, adminId: string) {
    return prisma.displayAdCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
  }

  async rejectCampaign(campaignId: string, adminId: string, reason: string) {
    return prisma.displayAdCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        approvedBy: adminId,
        approvedAt: new Date(),
      },
    });
  }

  async getPlatformSettings(scope?: string, scopeValue?: string) {
    if (scope && scopeValue) {
      return prisma.adPlatformSettings.findUnique({
        where: {
          scope_scopeValue: {
            scope: scope as any,
            scopeValue,
          },
        },
      });
    }

    return prisma.adPlatformSettings.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });
  }

  async updatePlatformSettings(data: any, adminId: string) {
    const {
      scope,
      scopeValue,
      minDailyBudgetKes,
      minLifetimeBudgetKes,
      liveStreamMinCpm,
      liveStreamMaxCpm,
      contestMinCpm,
      contestMaxCpm,
      discoverMinCpm,
      discoverMaxCpm,
      admiringMinCpm,
      admiringMaxCpm,
      dripsMinCpm,
      dripsMaxCpm,
      storiesMinCpm,
      storiesMaxCpm,
      groupChatMinCpm,
      groupChatMaxCpm,
      chamaChatMinCpm,
      chamaChatMaxCpm,
      targetingMultiplier,
      priority,
    } = data;

    return prisma.adPlatformSettings.upsert({
      where: {
        scope_scopeValue: {
          scope,
          scopeValue: scopeValue || '',
        },
      },
      create: {
        scope,
        scopeValue,
        minDailyBudgetKes,
        minLifetimeBudgetKes,
        liveStreamMinCpm,
        liveStreamMaxCpm,
        contestMinCpm,
        contestMaxCpm,
        discoverMinCpm,
        discoverMaxCpm,
        admiringMinCpm,
        admiringMaxCpm,
        dripsMinCpm,
        dripsMaxCpm,
        storiesMinCpm,
        storiesMaxCpm,
        groupChatMinCpm,
        groupChatMaxCpm,
        chamaChatMinCpm,
        chamaChatMaxCpm,
        targetingMultiplier,
        priority,
        createdBy: adminId,
        updatedBy: adminId,
      },
      update: {
        minDailyBudgetKes,
        minLifetimeBudgetKes,
        liveStreamMinCpm,
        liveStreamMaxCpm,
        contestMinCpm,
        contestMaxCpm,
        discoverMinCpm,
        discoverMaxCpm,
        admiringMinCpm,
        admiringMaxCpm,
        dripsMinCpm,
        dripsMaxCpm,
        storiesMinCpm,
        storiesMaxCpm,
        groupChatMinCpm,
        groupChatMaxCpm,
        chamaChatMinCpm,
        chamaChatMaxCpm,
        targetingMultiplier,
        priority,
        updatedBy: adminId,
      },
    });
  }

  private async calculateCpmRanges(locations: any[], placements: string[]) {
    const settings = await this.getApplicableSettings(locations);
    
    let minCpm = Infinity;
    let maxCpm = 0;

    placements.forEach((placement) => {
      const placementKey = this.getPlacementKey(placement);
      settings.forEach((setting: any) => {
        const min = setting[`${placementKey}MinCpm`];
        const max = setting[`${placementKey}MaxCpm`];
        if (min < minCpm) minCpm = min;
        if (max > maxCpm) maxCpm = max;
      });
    });

    return { min: minCpm, max: maxCpm };
  }

  private async calculateMinimumBudget(locations: any[], budgetType: string) {
    const settings = await this.getApplicableSettings(locations);
    
    let maxMinBudget = 0;
    const budgetKey = budgetType === 'DAILY' ? 'minDailyBudgetKes' : 'minLifetimeBudgetKes';

    settings.forEach((setting: any) => {
      const minBudget = parseFloat(setting[budgetKey]);
      if (minBudget > maxMinBudget) maxMinBudget = minBudget;
    });

    return maxMinBudget || 1000;
  }

  private async getApplicableSettings(locations: any[]) {
    const scopes = locations.map((loc) => loc.scope);
    const scopeValues = locations.map((loc) => loc.scopeValue);

    const settings = await prisma.adPlatformSettings.findMany({
      where: {
        OR: [
          { scope: 'GLOBAL' },
          {
            scope: { in: scopes as any[] },
            scopeValue: { in: scopeValues },
          },
        ],
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    return settings.length > 0 ? settings : [await this.getGlobalSettings()];
  }

  private async getGlobalSettings() {
    let global = await prisma.adPlatformSettings.findFirst({
      where: { scope: 'GLOBAL' },
    });

    if (!global) {
      global = await prisma.adPlatformSettings.create({
        data: {
          scope: 'GLOBAL',
          scopeValue: null,
          minDailyBudgetKes: 1000,
          minLifetimeBudgetKes: 5000,
          liveStreamMinCpm: 40,
          liveStreamMaxCpm: 150,
          contestMinCpm: 50,
          contestMaxCpm: 180,
          discoverMinCpm: 45,
          discoverMaxCpm: 160,
          admiringMinCpm: 45,
          admiringMaxCpm: 160,
          dripsMinCpm: 40,
          dripsMaxCpm: 150,
          storiesMinCpm: 80,
          storiesMaxCpm: 200,
          groupChatMinCpm: 60,
          groupChatMaxCpm: 180,
          chamaChatMinCpm: 70,
          chamaChatMaxCpm: 200,
          targetingMultiplier: 1.0,
          priority: 0,
        },
      });
    }

    return global;
  }

  private getPlacementKey(placement: string): string {
    const map: Record<string, string> = {
      LIVE_STREAMS: 'liveStream',
      CONTESTS: 'contest',
      DISCOVER_SHORTS: 'discover',
      ADMIRING_SHORTS: 'admiring',
      DRIPS_FEED: 'drips',
      STORIES: 'stories',
      GROUP_CHATS: 'groupChat',
      CHAMA_CHATS: 'chamaChat',
    };
    return map[placement] || 'liveStream';
  }
}
