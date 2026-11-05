import { prisma } from '../../config/database.js';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

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

    const influencers = await prisma.influencer_profiles.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy,
      include: { user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true,
            _count: { select: { admires_admires_admired_idTouser: true,
                subscriptions_subscriptions_creator_idToUser: true
              }
            }
          }
        },
        influencer_portfolio: {
          take: 3,
          orderBy: { views: 'desc' }
        }
      }
    });

    const filteredInfluencers = influencers.filter((inf: any) => {
      if (minAdmirers && inf.user._count.admirers_admires_admired_idToUser < minAdmirers) return false;
      if (minSubscribers && inf.user._count.subscriptions_subscriptions_creator_idToUser < minSubscribers) return false;
      return true;
    });

    const hasMore = filteredInfluencers.length > limit;
    const items = hasMore ? filteredInfluencers.slice(0, limit) : filteredInfluencers;

    return {
      items: items.map((inf: any) => ({
        id: inf.id,
        user: {
          ...inf.user,
          admirersCount: inf.user._count.admirers_admires_admired_idToUser,
          subscribersCount: inf.user._count.subscriptions_subscriptions_creator_idToUser
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
          avgEngagementRate: Number(inf.avg_engagement_rate),
          avg_views: inf.avg_views,
          avgRating: Number(inf.avg_rating),
          totalCampaigns: inf.total_campaigns,
          admirersCount: inf.user._count.admirers_admires_admired_idToUser,
          subscribersCount: inf.user._count.subscriptions_subscriptions_creator_idToUser
        },
        rates: {
          perPost: inf.rate_per_post ? Number(inf.rate_per_post) : null,
          perVideo: inf.rate_per_video ? Number(inf.rate_per_video) : null,
          perStory: inf.rate_per_story ? Number(inf.rate_per_story) : null
        },
        portfolio: inf.influencer_portfolio,
        isAvailable: inf.is_available,
        is_verified: inf.is_verified
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Get influencer profile details
   */
  static async getInfluencerProfile(influencerId: string) {
    const profile = await prisma.influencer_profiles.findUniqueOrThrow({
      where: { id: influencerId },
      include: { user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            bio: true,
            is_verified: true
          }
        },
        influencer_portfolio: {
          orderBy: { views: 'desc' }
        },
        influencer_reviews: {
          take: 10,
          orderBy: { created_at: 'desc' }
        }
      }
    });

    return {
      ...profile,
      avg_rating: Number(profile.avg_rating),
      avg_engagement_rate: Number(profile.avg_engagement_rate),
      total_earnings_kr: Number(profile.total_earnings_kr),
      rate_per_post: profile.rate_per_post ? Number(profile.rate_per_post) : null,
      rate_per_video: profile.rate_per_video ? Number(profile.rate_per_video) : null,
      rate_per_story: profile.rate_per_story ? Number(profile.rate_per_story) : null
    };
  }

  // ═══════════════════════════════════════════════════════════
  // BRAND CAMPAIGNS - CREATE & MANAGE
  // ═══════════════════════════════════════════════════════════

  /**
   * Create influencer marketing campaign
   */
  static async createCampaign(data: {
    brand_id: string;
    title: string;
    description: string;
    type: string;
    target_tiers: string[];
    target_categories: string[];
    min_followers?: number;
    min_engagement_rate?: number;
    target_geos?: string[];
    budget_kr: number;
    compensation_per_influencer: number;
    max_influencers: number;
    required_posts?: number;
    required_videos?: number;
    required_stories?: number;
    content_guidelines?: string;
    hashtags?: string[];
    mentions?: string[];
    contest_id?: string;
    application_deadline?: Date;
    campaign_start_date: Date;
    campaign_end_date: Date;
  }) {
    // Verify brand has sufficient balance
    const wallet = await prisma.wallets.findUnique({
      where: { user_id: data.brand_id }
    });

    const totalBudget = new Prisma.Decimal(data.budget_kr);
    if (!wallet || wallet.kr_balance.lessThan(totalBudget)) {
      throw new Error(`Insufficient balance. Need Rc.${totalBudget.toFixed(2)}`);
    }

    return prisma.$transaction(async (tx) => {
      // Deduct budget from brand wallet (escrow)
      await tx.wallets.update({
        where: { user_id: data.brand_id },
        data: { kr_balance: { decrement: totalBudget } }
      });

      // Create campaign
      const campaign = await tx.brand_campaigns.create({
        data: {
          brand_id: data.brand_id,
          title: data.title,
          description: data.description,
          type: data.type as any,
          status: 'DRAFT',
          target_tiers: data.target_tiers as any[],
          target_categories: data.target_categories,
          min_followers: data.min_followers,
          min_engagement_rate: data.min_engagement_rate ? new Prisma.Decimal(data.min_engagement_rate) : null,
          target_geos: data.target_geos || [],
          budget_kr: totalBudget,
          compensation_per_influencer: new Prisma.Decimal(data.compensation_per_influencer),
          max_influencers: data.max_influencers,
          required_posts: data.required_posts || 0,
          required_videos: data.required_videos || 0,
          required_stories: data.required_stories || 0,
          content_guidelines: data.content_guidelines,
          hashtags: data.hashtags || [],
          mentions: data.mentions || [],
          contest_id: data.contest_id,
          application_deadline: data.application_deadline,
          campaign_start_date: data.campaign_start_date,
          campaign_end_date: data.campaign_end_date
        },
        include: { user: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true
            }
          }
        }
      });

      // Record transaction
      await tx.transactions.create({
        data: {
          user_id: data.brand_id,
          type: 'campaign_escrow',
          amount_kr: totalBudget,
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
  static async publishCampaign(campaignId: string, brand_id: string) {
    const campaign = await prisma.brand_campaigns.findUniqueOrThrow({
      where: { id: campaignId }
    });

    if (campaign.brand_id !== brand_id) {
      throw new Error('Unauthorized');
    }

    if (campaign.status !== 'DRAFT') {
      throw new Error('Campaign already published');
    }

    return prisma.brand_campaigns.update({
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
      const influencer = await prisma.influencer_profiles.findUnique({
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

    const campaigns = await prisma.brand_campaigns.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { created_at: 'desc' },
      include: { user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true,
            is_verified: true
          }
        },
        Contest: {
          select: {
            id: true,
            title: true,
            prize_total_kr: true,
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
        brand: c.user,
        title: c.title,
        description: c.description,
        type: c.type,
        compensationKr: Number(c.compensation_per_influencer),
        deliverables: {
          posts: c.required_posts,
          videos: c.required_videos,
          stories: c.required_stories
        },
        timeline: {
          applicationDeadline: c.application_deadline?.toISOString(),
          start_date: c.campaign_start_date.toISOString(),
          end_date: c.campaign_end_date.toISOString()
        },
        contest: c.contest ? {
          id: c.contest.id,
          title: c.contest.title,
          prizeTotalKr: Number(c.contest.prize_total_kr),
          deadline: c.contest.deadline.toISOString()
        } : null,
        spotsAvailable: c.max_influencers - c.accepted_influencers,
        created_at: c.created_at.toISOString()
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }

  /**
   * Apply to campaign (Influencer applies)
   */
  static async applyToCampaign(data: {
    campaign_id: string;
    influencer_id: string;
    pitch: string;
    proposed_rate?: number;
    availability?: string;
  }) {
    const campaign = await prisma.brand_campaigns.findUniqueOrThrow({
      where: { id: data.campaign_id }
    });

    if (campaign.status !== 'OPEN') {
      throw new Error('Campaign is not accepting applications');
    }

    if (campaign.accepted_influencers >= campaign.max_influencers) {
      throw new Error('Campaign is full');
    }

    // Check if already applied
    const existing = await prisma.campaign_applications.findUnique({
      where: {
        campaign_id_influencer_id: {
          campaign_id: data.campaign_id,
          influencer_id: data.influencer_id
        }
      }
    });

    if (existing) {
      throw new Error('Already applied to this campaign');
    }

    const application = await prisma.campaign_applications.create({
      data: {
        campaign_id: data.campaign_id,
        influencer_id: data.influencer_id,
        pitch: data.pitch,
        proposed_rate: data.proposed_rate ? new Prisma.Decimal(data.proposed_rate) : null,
        availability: data.availability,
        status: 'PENDING'
      },
      include: {
        influencer_profiles: {
          include: { user: {
              select: {
                id: true,
                username: true,
                display_name: true,
                avatar_url: true
              }
            }
          }
        }
      }
    });

    // Increment application count
    await prisma.brand_campaigns.update({
      where: { id: data.campaign_id },
      data: { total_applications: { increment: 1 } }
    });

    return application;
  }

  /**
   * Accept/Reject application (Brand decision)
   */
  static async reviewApplication(data: {
    applicationId: string;
    brand_id: string;
    decision: 'ACCEPTED' | 'REJECTED';
    response_note?: string;
  }) {
    const application = await prisma.campaign_applications.findUniqueOrThrow({
      where: { id: data.applicationId },
      include: { brand_campaigns: true }
    });

    if (application.brand_campaigns.brand_id !== data.brand_id) {
      throw new Error('Unauthorized');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Application already reviewed');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.campaign_applications.update({
        where: { id: data.applicationId },
        data: {
          status: data.decision,
          response_note: data.response_note,
          responded_at: new Date()
        }
      });

      if (data.decision === 'ACCEPTED') {
        await tx.brand_campaigns.update({
          where: { id: application.campaign_id },
          data: { accepted_influencers: { increment: 1 } }
        });

        // If campaign is full, close it
        const campaign = await tx.brand_campaigns.findUnique({
          where: { id: application.campaign_id }
        });

        if (campaign && campaign.accepted_influencers + 1 >= campaign.max_influencers) {
          await tx.brand_campaigns.update({
            where: { id: application.campaign_id },
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
    contest_id: string;
    brand_id: string;
    type: string;
    sponsorship_kr: number;
    benefits: string[];
    logo_url?: string;
    brand_message?: string;
    website_url?: string;
    start_date: Date;
    end_date: Date;
  }) {
    const contest = await prisma.contest.findUniqueOrThrow({
      where: { id: data.contest_id }
    });

    if (contest.status !== 'ACTIVE') {
      throw new Error('Contest is not active');
    }

    // Verify brand has sufficient balance
    const wallet = await prisma.wallets.findUnique({
      where: { user_id: data.brand_id }
    });

    const sponsorshipAmount = new Prisma.Decimal(data.sponsorship_kr);
    if (!wallet || wallet.kr_balance.lessThan(sponsorshipAmount)) {
      throw new Error(`Insufficient balance. Need Rc.${sponsorshipAmount.toFixed(2)}`);
    }

    return prisma.$transaction(async (tx) => {
      // Deduct from brand wallet
      await tx.wallets.update({
        where: { user_id: data.brand_id },
        data: { kr_balance: { decrement: sponsorshipAmount } }
      });

      // Create sponsorship
      const sponsorship = await tx.contest_sponsorships.create({
        data: {
          contest_id: data.contest_id,
          brand_id: data.brand_id,
          type: data.type as any,
          sponsorship_kr: sponsorshipAmount,
          benefits: data.benefits,
          logo_url: data.logo_url,
          brand_message: data.brand_message,
          website_url: data.website_url,
          start_date: data.start_date,
          end_date: data.end_date,
          is_active: true
        }
      });

      // Record transaction
      await tx.transactions.create({
        data: {
          user_id: data.brand_id,
          type: 'contest_sponsorship',
          amount_kr: sponsorshipAmount,
          status: 'completed',
          provider: 'platform',
          reference: sponsorship.id
        }
      });

      // Add sponsorship amount to contest prize pool (if type is CONTEST_PRIZE)
      if (data.type === 'CONTEST_PRIZE') {
        await tx.contest.update({
          where: { id: data.contest_id },
          data: {
            prize_total_kr: { increment: sponsorshipAmount }
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
    min_participants?: number;
    cursor?: string;
    limit?: number;
  }) {
    const { category, min_participants, cursor, limit = 20 } = params;

    const where: any = {
      status: 'ACTIVE',
      deadline: { gte: new Date() }
    };

    if (category) {
      where.category = category;
    }

    if (min_participants) {
      where.total_participants = { gte: min_participants };
    }

    const contests = await prisma.contest.findMany({
      where,
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { total_participants: 'desc' },
      include: { user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true
          }
        },
        contest_sponsorships: {
          where: { is_active: true }
        }
      }
    });

    const hasMore = contests.length > limit;
    const items = hasMore ? contests.slice(0, limit) : contests;

    return {
      items: items.map((c: any) => ({
        id: c.id,
        creator: c.user,
        title: c.title,
        description: c.description,
        category: c.category,
        prizeTotalKr: Number(c.prize_total_kr),
        participants: c.total_participants,
        submissions: c.total_submissions,
        deadline: c.deadline.toISOString(),
        coverMediaUrl: c.cover_media_url,
        currentSponsors: c.contest_sponsorships.length,
        estimatedReach: c.total_participants * 10, // Rough estimate
        createdAt: c.created_at.toISOString()
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };
  }
}
