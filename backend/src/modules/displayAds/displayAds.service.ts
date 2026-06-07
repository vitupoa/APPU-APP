import { prisma } from '../../config/database.js';
import crypto from 'crypto';

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
      start_date,
      end_date,
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

    const campaign = await prisma.display_ad_campaigns.create({
      data: {
        brand_id: brandId,
        campaign_name: campaignName,
        campaign_objective: campaignObjective,
        ad_title: adTitle,
        ad_description: adDescription,
        primary_image_url: primaryImageUrl,
        cta_text: ctaText,
        cta_url: ctaUrl,
        budget_type: budgetType,
        daily_budget_kes: budgetType === 'DAILY' ? dailyBudgetKes : null,
        lifetime_budget_kes: budgetType === 'LIFETIME' ? lifetimeBudgetKes : null,
        bidding_strategy: biddingStrategy,
        target_cpm: targetCpm,
        target_age_min: targetAgeMin,
        target_age_max: targetAgeMax,
        target_genders: targetGenders,
        target_interests: targetInterests,
        placements,
        chat_niches: chatNiches,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        status: 'PENDING',
        ad_campaign_locations: {
          create: locations.map((loc: any) => ({
            scope: loc.scope,
            scope_value: loc.scopeValue,
            scope_display_name: loc.display_name,
            continent: loc.continent,
            country: loc.country,
            region: loc.region,
            city: loc.city,
            town: loc.town,
            road: loc.road,
            landmark: loc.landmark,
            shopping_center: loc.shoppingCenter,
            latitude: loc.latitude,
            longitude: loc.longitude,
            radius_km: loc.radiusKm,
            is_excluded: loc.isExcluded || false,
          })),
        },
      },
      include: {
        ad_campaign_locations: true,
      },
    });

    return campaign;
  }

  async getBrandCampaigns(brandId: string) {
    return prisma.display_ad_campaigns.findMany({
      where: { brand_id: brandId },
      include: {
        ad_campaign_locations: true,
        display_ad_analytics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getCampaignById(campaignId: string) {
    return prisma.display_ad_campaigns.findUnique({
      where: { id: campaignId },
      include: {
        ad_campaign_locations: true,
        display_ad_analytics: {
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  async updateCampaign(campaignId: string, data: any) {
    return prisma.display_ad_campaigns.update({
      where: { id: campaignId },
      data,
    });
  }

  async toggleCampaign(campaignId: string) {
    const campaign = await prisma.display_ad_campaigns.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');

    const newStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    return prisma.display_ad_campaigns.update({
      where: { id: campaignId },
      data: { status: newStatus },
    });
  }

  async getCampaignAnalytics(campaignId: string, start_date: string, end_date: string) {
    return prisma.display_ad_analytics.findMany({
      where: {
        campaign_id: campaignId,
        date: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async searchLocations(query: string, scope?: string) {
    return prisma.location_master.findMany({
      where: {
        display_name: {
          contains: query,
          mode: 'insensitive',
        },
        scope: scope as any,
        is_active: true,
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
    return prisma.display_ad_campaigns.findMany({
      where: { status: 'PENDING' },
      include: {
        ad_campaign_locations: true,
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async approveCampaign(campaignId: string, adminId: string) {
    return prisma.display_ad_campaigns.update({
      where: { id: campaignId },
      data: {
        status: 'APPROVED',
        approved_by: adminId,
        approved_at: new Date(),
      },
    });
  }

  async rejectCampaign(campaignId: string, adminId: string, reason: string) {
    return prisma.display_ad_campaigns.update({
      where: { id: campaignId },
      data: {
        status: 'REJECTED',
        rejection_reason: reason,
        approved_by: adminId,
        approved_at: new Date(),
      },
    });
  }

  async getPlatformSettings(scope?: string, scopeValue?: string) {
    if (scope && scopeValue) {
      return prisma.ad_platform_settings.findUnique({
        where: {
          scope_scope_value: {
            scope: scope as any,
            scope_value: scopeValue,
          },
        },
      });
    }

    return prisma.ad_platform_settings.findMany({
      where: { is_active: true },
      orderBy: { priority: 'desc' },
    });
  }

  async updatePlatformSettings(data: any, adminId: string) {
    const {
      scope,
      scopeValue,
      minDailyBudgetKes,
      minLifetimeBudgetKes,
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

    return prisma.ad_platform_settings.upsert({
      where: {
        scope_scope_value: {
          scope,
          scope_value: scopeValue || '',
        },
      },
      create: {
        scope,
        scope_value: scopeValue,
        min_daily_budget_kes: minDailyBudgetKes,
        min_lifetime_budget_kes: minLifetimeBudgetKes,
        contest_min_cpm: contestMinCpm,
        contest_max_cpm: contestMaxCpm,
        discover_min_cpm: discoverMinCpm,
        discover_max_cpm: discoverMaxCpm,
        admiring_min_cpm: admiringMinCpm,
        admiring_max_cpm: admiringMaxCpm,
        drips_min_cpm: dripsMinCpm,
        drips_max_cpm: dripsMaxCpm,
        stories_min_cpm: storiesMinCpm,
        stories_max_cpm: storiesMaxCpm,
        group_chat_min_cpm: groupChatMinCpm,
        group_chat_max_cpm: groupChatMaxCpm,
        chama_chat_min_cpm: chamaChatMinCpm,
        chama_chat_max_cpm: chamaChatMaxCpm,
        targeting_multiplier: targetingMultiplier,
        priority,
        created_by: adminId,
        updated_by: adminId,
      },
      update: {
        min_daily_budget_kes: minDailyBudgetKes,
        min_lifetime_budget_kes: minLifetimeBudgetKes,
        contest_min_cpm: contestMinCpm,
        contest_max_cpm: contestMaxCpm,
        discover_min_cpm: discoverMinCpm,
        discover_max_cpm: discoverMaxCpm,
        admiring_min_cpm: admiringMinCpm,
        admiring_max_cpm: admiringMaxCpm,
        drips_min_cpm: dripsMinCpm,
        drips_max_cpm: dripsMaxCpm,
        stories_min_cpm: storiesMinCpm,
        stories_max_cpm: storiesMaxCpm,
        group_chat_min_cpm: groupChatMinCpm,
        group_chat_max_cpm: groupChatMaxCpm,
        chama_chat_min_cpm: chamaChatMinCpm,
        chama_chat_max_cpm: chamaChatMaxCpm,
        targeting_multiplier: targetingMultiplier,
        priority,
        updated_by: adminId,
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
        const min = setting[`${placementKey}_min_cpm`];
        const max = setting[`${placementKey}_max_cpm`];
        if (min < minCpm) minCpm = min;
        if (max > maxCpm) maxCpm = max;
      });
    });

    return { min: minCpm, max: maxCpm };
  }

  private async calculateMinimumBudget(locations: any[], budgetType: string) {
    const settings = await this.getApplicableSettings(locations);
    
    let maxMinBudget = 0;
    const budgetKey = budgetType === 'DAILY' ? 'min_daily_budget_kes' : 'min_lifetime_budget_kes';

    settings.forEach((setting: any) => {
      const minBudget = parseFloat(setting[budgetKey]);
      if (minBudget > maxMinBudget) maxMinBudget = minBudget;
    });

    return maxMinBudget || 1000;
  }

  private async getApplicableSettings(locations: any[]) {
    const scopes = locations.map((loc) => loc.scope);
    const scopeValues = locations.map((loc) => loc.scopeValue);

    const settings = await prisma.ad_platform_settings.findMany({
      where: {
        OR: [
          { scope: 'GLOBAL' },
          {
            scope: { in: scopes as any[] },
            scope_value: { in: scopeValues },
          },
        ],
        is_active: true,
      },
      orderBy: { priority: 'desc' },
    });

    return settings.length > 0 ? settings : [await this.getGlobalSettings()];
  }

  private async getGlobalSettings() {
    let global = await prisma.ad_platform_settings.findFirst({
      where: { scope: 'GLOBAL' },
    });

    if (!global) {
      global = await prisma.ad_platform_settings.create({ data: { id: crypto.randomUUID(), scope: 'GLOBAL',
          scope_value: null,
          min_daily_budget_kes: 1000,
          min_lifetime_budget_kes: 5000,
          contest_min_cpm: 50,
          contest_max_cpm: 180,
          discover_min_cpm: 45,
          discover_max_cpm: 160,
          admiring_min_cpm: 45,
          admiring_max_cpm: 160,
          drips_min_cpm: 40,
          drips_max_cpm: 150,
          stories_min_cpm: 80,
          stories_max_cpm: 200,
          group_chat_min_cpm: 60,
          group_chat_max_cpm: 180,
          chama_chat_min_cpm: 70,
          chama_chat_max_cpm: 200,
          targeting_multiplier: 1.0,
          priority: 0,},
      });
    }

    return global;
  }

  private getPlacementKey(placement: string): string {
    const map: Record<string, string> = {
      CONTESTS: 'contest',
      DISCOVER_SHORTS: 'discover',
      ADMIRING_SHORTS: 'admiring',
      DRIPS_FEED: 'drips',
      STORIES: 'stories',
      GROUP_CHATS: 'group_chat',
      CHAMA_CHATS: 'chama_chat',
    };
    return map[placement] || 'contest';
  }
}
