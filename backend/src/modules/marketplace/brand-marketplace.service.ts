import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';

/**
 * Brand Marketplace Service
 * Handles: Influencer Discovery, Campaign Management, Contest Sponsorships
 */
export class BrandMarketplaceService {
  
  // ═══════════════════════════════════════════════════════════
  // INFLUENCER MARKETPLACE - DISCOVERY & RECRUITMENT
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Search and filter influencers
   * Brands use this to find influencers to recruit
   */
  static async searchInfluencers(params: {
    tier?: string[];
    categories?: string[];
    minFollowers?: number;
    maxFollowers?: number;
    minEngagementRate?: number;
    minRating?: number;
    minAdmirers?: number;
    minSubscribers?: number;
    isAvailable?: boolean;
    sortBy?: 'followers' | 'engagement' | 'rating' | 'rate' | 'admirers' | 'subscribers';
    cursor?: string;
    limit?: number;
  }) {
    const {
      tier,
      categories,
      minFollowers,
      maxFollowers,
      minEngagementRate,
      minRating,
      minAdmirers,
      minSubscribers,
      isAvailable = true,
      sortBy = 'engagement',
      cursor,
      limit = 20
    } = params;

    const where: any = { isAvailable };

    if (tier && tier.length > 0) {
      where.tier = { in: tier };
    }

    if (categories && categories.length > 0) {
      where.categories = { hasSome: categories };
    }

    if (minFollowers) {
      where.OR = [
        { instagramFollowers: { gte: minFollowers } },
        { tiktokFollowers: { gte: minFollowers } },
        { youtubeSubscribers: { gte: minFollowers } }
      ];
    }

    if (minEngagementRate) {
      where.avgEngagementRate = { gte: minEngagementRate };
    }

    if (minRating) {
      where.avgRating = { gte: minRating };
    }

    if (minAdmirers) {
      where.user = { admirers: { some: {} } };
    }

    if (minSubscribers) {
      where.user = { subscribers: { some: {} } };
    }

    const orderBy: any = {};
    switch (sortBy) {
      case 'followers':
        orderBy.instagramFollowers = 'desc';
        break;
      case 'engagement':
        orderBy.avgEngagementRate = 'desc';
        break;
      case 'rating':
        orderBy.avgRating = 'desc';
        break;
      case 'rate':
        orderBy.ratePerPost = 'asc';
        break;
      case 'admirers':
        orderBy.user = { admirers: { _count: 'desc' } };
        break;
      case 'subscribers':
        orderBy.user = { subscribers: { _count: 'desc' } };
        break;
    }

    const influencers = await prisma.influencerProfile.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true,
            _count: {
              select: {
                admirers: true,
                subscribers: true
              }
            }
          }
        },
        portfolio: {
          take: 3,
          orderBy: { views: 'desc' }
        }
      }
    });

    const filteredInfluencers = influencers.filter((inf: any) => {
      if (minAdmirers && inf.user._count.admirers < minAdmirers) return false;
      if (minSubscribers && inf.user._count.subscribers < minSubscribers) return false;
      return true;
    });

    const hasMore = filteredInfluencers.length > limit;
    const items = hasMore ? filteredInfluencers.slice(0, limit) : filteredInfluencers;

    return {
      items: items.map((inf: any) => ({
        id: inf.id,
        user: {
          ...inf.user,
          admirersCount: inf.user._count.admirers,
          subscribersCount: inf.user._count.subscribers
        },
        tier: inf.tier,
        bio: inf.bio,
        categories: inf.categories,
        socialStats: {
          instagram: {
            handle: inf.instagramHandle,
            followers: inf.instagramFollowers
          },
          tiktok: {
            handle: inf.tiktokHandle,
            followers: inf.tiktokFollowers
          },
          youtube: {
            handle: inf.youtubeHandle,
            subscribers: inf.youtubeSubscribers
          }
        },
        metrics: {
          avgEngagementRate: Number(inf.avgEngagementRate),
          avgViews: inf.avgViews,
          avgRating: Number(inf.avgRating),
          totalCampaigns: inf.totalCampaigns,
          admirersCount: inf.user._count.admirers,
          subscribersCount: inf.user._count.subscribers
        },
        rates: {
          perPost: inf.ratePerPost ? Number(inf.ratePerPost) : null,
          perVideo: inf.ratePerVideo ? Number(inf.ratePerVideo) : null,
          perStory: inf.ratePerStory ? Number(inf.ratePerStory) : null
        },
        portfolio: inf.portfolio,
        isAvailable: inf.isAvailable,
        isVerified: inf.isVerified
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Get influencer profile details
   */
  static async getInfluencerProfile(influencerId: string) {
    const profile = await prisma.influencerProfile.findUniqueOrThrow({
      where: { id: influencerId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
            isVerified: true
          }
        },
        portfolio: {
          orderBy: { views: 'desc' }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return {
      ...profile,
      avgRating: Number(profile.avgRating),
      avgEngagementRate: Number(profile.avgEngagementRate),
      totalEarningsKr: Number(profile.totalEarningsKr),
      ratePerPost: profile.ratePerPost ? Number(profile.ratePerPost) : null,
      ratePerVideo: profile.ratePerVideo ? Number(profile.ratePerVideo) : null,
      ratePerStory: profile.ratePerStory ? Number(profile.ratePerStory) : null
    };
  }

  // ═══════════════════════════════════════════════════════════
  // BRAND CAMPAIGNS - CREATE & MANAGE
  // ═══════════════════════════════════════════════════════════

  /**
   * Create influencer marketing campaign
   */
  static async createCampaign(data: {
    brandId: string;
    title: string;
    description: string;
    type: string;
    targetTiers: string[];
    targetCategories: string[];
    minFollowers?: number;
    minEngagementRate?: number;
    targetGeos?: string[];
    budgetKr: number;
    compensationPerInfluencer: number;
    maxInfluencers: number;
    requiredPosts?: number;
    requiredVideos?: number;
    requiredStories?: number;
    contentGuidelines?: string;
    hashtags?: string[];
    mentions?: string[];
    contestId?: string;
    applicationDeadline?: Date;
    campaignStartDate: Date;
    campaignEndDate: Date;
  }) {
    // Verify brand has sufficient balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: data.brandId }
    });

    const totalBudget = new Prisma.Decimal(data.budgetKr);
    if (!wallet || wallet.krBalance.lessThan(totalBudget)) {
      throw new Error(`Insufficient balance. Need Kr.${totalBudget.toFixed(2)}`);
    }

    return prisma.$transaction(async (tx) => {
      // Deduct budget from brand wallet (escrow)
      await tx.wallet.update({
        where: { userId: data.brandId },
        data: { krBalance: { decrement: totalBudget } }
      });

      // Create campaign
      const campaign = await tx.brandCampaign.create({
        data: {
          brandId: data.brandId,
          title: data.title,
          description: data.description,
          type: data.type as any,
          status: 'DRAFT',
          targetTiers: data.targetTiers as any[],
          targetCategories: data.targetCategories,
          minFollowers: data.minFollowers,
          minEngagementRate: data.minEngagementRate ? new Prisma.Decimal(data.minEngagementRate) : null,
          targetGeos: data.targetGeos || [],
          budgetKr: totalBudget,
          compensationPerInfluencer: new Prisma.Decimal(data.compensationPerInfluencer),
          maxInfluencers: data.maxInfluencers,
          requiredPosts: data.requiredPosts || 0,
          requiredVideos: data.requiredVideos || 0,
          requiredStories: data.requiredStories || 0,
          contentGuidelines: data.contentGuidelines,
          hashtags: data.hashtags || [],
          mentions: data.mentions || [],
          contestId: data.contestId,
          applicationDeadline: data.applicationDeadline,
          campaignStartDate: data.campaignStartDate,
          campaignEndDate: data.campaignEndDate
        },
        include: {
          brand: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true
            }
          }
        }
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: data.brandId,
          type: 'campaign_escrow',
          amountKr: totalBudget,
          status: 'completed',
          provider: 'platform',
          reference: campaign.id
        }
      });

      return campaign;
    });
  }

  /**
   * Publish campaign (make it visible to influencers)
   */
  static async publishCampaign(campaignId: string, brandId: string) {
    const campaign = await prisma.brandCampaign.findUniqueOrThrow({
      where: { id: campaignId }
    });

    if (campaign.brandId !== brandId) {
      throw new Error('Unauthorized');
    }

    if (campaign.status !== 'DRAFT') {
      throw new Error('Campaign already published');
    }

    return prisma.brandCampaign.update({
      where: { id: campaignId },
      data: { status: 'OPEN' }
    });
  }

  /**
   * Browse available campaigns (Influencer view)
   */
  static async browseCampaigns(params: {
    influencerId?: string;
    type?: string[];
    categories?: string[];
    minCompensation?: number;
    cursor?: string;
    limit?: number;
  }) {
    const { influencerId, type, categories, minCompensation, cursor, limit = 20 } = params;

    const where: any = {
      status: 'OPEN',
      applicationDeadline: { gte: new Date() }
    };

    if (type && type.length > 0) {
      where.type = { in: type };
    }

    if (categories && categories.length > 0) {
      where.targetCategories = { hasSome: categories };
    }

    if (minCompensation) {
      where.compensationPerInfluencer = { gte: minCompensation };
    }

    // If influencer is viewing, filter by their tier/categories
    if (influencerId) {
      const influencer = await prisma.influencerProfile.findUnique({
        where: { id: influencerId }
      });

      if (influencer) {
        where.AND = [
          { targetTiers: { has: influencer.tier } },
          {
            OR: [
              { targetCategories: { isEmpty: true } },
              { targetCategories: { hasSome: influencer.categories } }
            ]
          }
        ];
      }
    }

    const campaigns = await prisma.brandCampaign.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        brand: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            isVerified: true
          }
        },
        contest: {
          select: {
            id: true,
            title: true,
            prizeTotalKr: true,
            deadline: true
          }
        }
      }
    });

    const hasMore = campaigns.length > limit;
    const items = hasMore ? campaigns.slice(0, limit) : campaigns;

    return {
      items: items.map((c: any) => ({
        id: c.id,
        brand: c.brand,
        title: c.title,
        description: c.description,
        type: c.type,
        compensationKr: Number(c.compensationPerInfluencer),
        deliverables: {
          posts: c.requiredPosts,
          videos: c.requiredVideos,
          stories: c.requiredStories
        },
        timeline: {
          applicationDeadline: c.applicationDeadline?.toISOString(),
          startDate: c.campaignStartDate.toISOString(),
          endDate: c.campaignEndDate.toISOString()
        },
        contest: c.contest ? {
          id: c.contest.id,
          title: c.contest.title,
          prizeTotalKr: Number(c.contest.prizeTotalKr),
          deadline: c.contest.deadline.toISOString()
        } : null,
        spotsAvailable: c.maxInfluencers - c.acceptedInfluencers,
        createdAt: c.createdAt.toISOString()
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Apply to campaign (Influencer applies)
   */
  static async applyToCampaign(data: {
    campaignId: string;
    influencerId: string;
    pitch: string;
    proposedRate?: number;
    availability?: string;
  }) {
    const campaign = await prisma.brandCampaign.findUniqueOrThrow({
      where: { id: data.campaignId }
    });

    if (campaign.status !== 'OPEN') {
      throw new Error('Campaign is not accepting applications');
    }

    if (campaign.acceptedInfluencers >= campaign.maxInfluencers) {
      throw new Error('Campaign is full');
    }

    // Check if already applied
    const existing = await prisma.campaignApplication.findUnique({
      where: {
        campaignId_influencerId: {
          campaignId: data.campaignId,
          influencerId: data.influencerId
        }
      }
    });

    if (existing) {
      throw new Error('Already applied to this campaign');
    }

    const application = await prisma.campaignApplication.create({
      data: {
        campaignId: data.campaignId,
        influencerId: data.influencerId,
        pitch: data.pitch,
        proposedRate: data.proposedRate ? new Prisma.Decimal(data.proposedRate) : null,
        availability: data.availability,
        status: 'PENDING'
      },
      include: {
        influencer: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    // Increment application count
    await prisma.brandCampaign.update({
      where: { id: data.campaignId },
      data: { totalApplications: { increment: 1 } }
    });

    return application;
  }

  /**
   * Accept/Reject application (Brand decision)
   */
  static async reviewApplication(data: {
    applicationId: string;
    brandId: string;
    decision: 'ACCEPTED' | 'REJECTED';
    responseNote?: string;
  }) {
    const application = await prisma.campaignApplication.findUniqueOrThrow({
      where: { id: data.applicationId },
      include: { campaign: true }
    });

    if (application.campaign.brandId !== data.brandId) {
      throw new Error('Unauthorized');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Application already reviewed');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.campaignApplication.update({
        where: { id: data.applicationId },
        data: {
          status: data.decision,
          responseNote: data.responseNote,
          respondedAt: new Date()
        }
      });

      if (data.decision === 'ACCEPTED') {
        await tx.brandCampaign.update({
          where: { id: application.campaignId },
          data: { acceptedInfluencers: { increment: 1 } }
        });

        // If campaign is full, close it
        const campaign = await tx.brandCampaign.findUnique({
          where: { id: application.campaignId }
        });

        if (campaign && campaign.acceptedInfluencers + 1 >= campaign.maxInfluencers) {
          await tx.brandCampaign.update({
            where: { id: application.campaignId },
            data: { status: 'IN_PROGRESS' }
          });
        }
      }

      return updated;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // CONTEST SPONSORSHIPS
  // ═══════════════════════════════════════════════════════════

  /**
   * Sponsor an existing contest
   */
  static async sponsorContest(data: {
    contestId: string;
    brandId: string;
    type: string;
    sponsorshipKr: number;
    benefits: string[];
    logoUrl?: string;
    brandMessage?: string;
    websiteUrl?: string;
    startDate: Date;
    endDate: Date;
  }) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: data.contestId }
    });

    if (contest.status !== 'ACTIVE') {
      throw new Error('Contest is not active');
    }

    // Verify brand has sufficient balance
    const wallet = await prisma.wallet.findUnique({
      where: { userId: data.brandId }
    });

    const sponsorshipAmount = new Prisma.Decimal(data.sponsorshipKr);
    if (!wallet || wallet.krBalance.lessThan(sponsorshipAmount)) {
      throw new Error(`Insufficient balance. Need Kr.${sponsorshipAmount.toFixed(2)}`);
    }

    return prisma.$transaction(async (tx) => {
      // Deduct from brand wallet
      await tx.wallet.update({
        where: { userId: data.brandId },
        data: { krBalance: { decrement: sponsorshipAmount } }
      });

      // Create sponsorship
      const sponsorship = await tx.contestSponsorship.create({
        data: {
          contestId: data.contestId,
          brandId: data.brandId,
          type: data.type as any,
          sponsorshipKr: sponsorshipAmount,
          benefits: data.benefits,
          logoUrl: data.logoUrl,
          brandMessage: data.brandMessage,
          websiteUrl: data.websiteUrl,
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: true
        }
      });

      // Record transaction
      await tx.transaction.create({
        data: {
          userId: data.brandId,
          type: 'contest_sponsorship',
          amountKr: sponsorshipAmount,
          status: 'completed',
          provider: 'platform',
          reference: sponsorship.id
        }
      });

      // Add sponsorship amount to contest prize pool (if type is CONTEST_PRIZE)
      if (data.type === 'CONTEST_PRIZE') {
        await tx.contest.update({
          where: { id: data.contestId },
          data: {
            prizeTotalKr: { increment: sponsorshipAmount }
          }
        });
      }

      return sponsorship;
    });
  }

  /**
   * Browse contests available for sponsorship
   */
  static async browseSponsorableContests(params: {
    category?: string;
    minParticipants?: number;
    cursor?: string;
    limit?: number;
  }) {
    const { category, minParticipants, cursor, limit = 20 } = params;

    const where: any = {
      status: 'ACTIVE',
      deadline: { gte: new Date() }
    };

    if (category) {
      where.category = category;
    }

    if (minParticipants) {
      where.totalParticipants = { gte: minParticipants };
    }

    const contests = await prisma.contest.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { totalParticipants: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true
          }
        },
        sponsorships: {
          where: { isActive: true }
        }
      }
    });

    const hasMore = contests.length > limit;
    const items = hasMore ? contests.slice(0, limit) : contests;

    return {
      items: items.map((c: any) => ({
        id: c.id,
        creator: c.creator,
        title: c.title,
        description: c.description,
        category: c.category,
        prizeTotalKr: Number(c.prizeTotalKr),
        participants: c.totalParticipants,
        submissions: c.totalSubmissions,
        deadline: c.deadline.toISOString(),
        coverMediaUrl: c.coverMediaUrl,
        currentSponsors: c.sponsorships.length,
        estimatedReach: c.totalParticipants * 10, // Rough estimate
        createdAt: c.createdAt.toISOString()
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }
}
