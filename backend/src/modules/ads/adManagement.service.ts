import { prisma } from '../../config/database.js';
import { Prisma } from '../../generated/prisma/client.js';

export class AdManagementService {
  // ==================== AD CONFIG ====================
  
  static async getAdConfig() {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM ad_config WHERE id = '00000000-0000-0000-0000-000000000001'
    `;
    return result[0];
  }

  static async updatePlatformCut(percentage: number, adminId: string) {
    if (percentage < 1 || percentage > 50) {
      throw new Error('Platform cut must be between 1% and 50%');
    }

    await prisma.$executeRaw`
      UPDATE ad_config 
      SET platform_cut_percentage = ${percentage}, 
          updated_by = ${adminId}, 
          updated_at = NOW()
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `;

    return this.getAdConfig();
  }

  static async updateNativeAdPricing(minCpm: number, maxCpm: number, adminId: string) {
    if (minCpm >= maxCpm) {
      throw new Error('Min CPM must be less than Max CPM');
    }

    await prisma.$executeRaw`
      UPDATE ad_config 
      SET native_ad_min_cpm = ${minCpm}, 
          native_ad_max_cpm = ${maxCpm},
          updated_by = ${adminId}, 
          updated_at = NOW()
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `;

    return this.getAdConfig();
  }

  static async updateBannerAdPricing(minCpm: number, maxCpm: number, adminId: string) {
    if (minCpm >= maxCpm) {
      throw new Error('Min CPM must be less than Max CPM');
    }

    await prisma.$executeRaw`
      UPDATE ad_config 
      SET banner_ad_min_cpm = ${minCpm}, 
          banner_ad_max_cpm = ${maxCpm},
          updated_by = ${adminId}, 
          updated_at = NOW()
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `;

    return this.getAdConfig();
  }

  static async updateStoryAdPricing(minCpm: number, maxCpm: number, adminId: string) {
    if (minCpm >= maxCpm) {
      throw new Error('Min CPM must be less than Max CPM');
    }

    await prisma.$executeRaw`
      UPDATE ad_config 
      SET story_ad_min_cpm = ${minCpm}, 
          story_ad_max_cpm = ${maxCpm},
          updated_by = ${adminId}, 
          updated_at = NOW()
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `;

    return this.getAdConfig();
  }

  static async updateNativeAdFrequency(frequency: number, adminId: string) {
    if (frequency < 3 || frequency > 20) {
      throw new Error('Native ad frequency must be between 3 and 20');
    }

    await prisma.$executeRaw`
      UPDATE ad_config 
      SET native_ad_frequency = ${frequency},
          updated_by = ${adminId}, 
          updated_at = NOW()
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `;

    return this.getAdConfig();
  }

  static async updateBannerAdFrequency(frequency: number, adminId: string) {
    if (frequency < 10 || frequency > 30) {
      throw new Error('Banner ad frequency must be between 10 and 30');
    }

    await prisma.$executeRaw`
      UPDATE ad_config 
      SET banner_ad_frequency = ${frequency},
          updated_by = ${adminId}, 
          updated_at = NOW()
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `;

    return this.getAdConfig();
  }

  static async updateStoryAdFrequency(frequency: number, adminId: string) {
    if (frequency < 15 || frequency > 40) {
      throw new Error('Story ad frequency must be between 15 and 40');
    }

    await prisma.$executeRaw`
      UPDATE ad_config 
      SET story_ad_frequency = ${frequency},
          updated_by = ${adminId}, 
          updated_at = NOW()
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `;

    return this.getAdConfig();
  }

  static async toggleAds(enabled: boolean, adminId: string) {
    await prisma.$executeRaw`
      UPDATE ad_config 
      SET ads_enabled = ${enabled},
          updated_by = ${adminId}, 
          updated_at = NOW()
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `;

    return this.getAdConfig();
  }

  static async toggleMaxAdLoad(enabled: boolean, adminId: string) {
    await prisma.$executeRaw`
      UPDATE ad_config 
      SET max_ad_load_enabled = ${enabled},
          updated_by = ${adminId}, 
          updated_at = NOW()
      WHERE id = '00000000-0000-0000-0000-000000000001'
    `;

    return this.getAdConfig();
  }

  // ==================== CAMPAIGNS ====================

  static async getCampaigns(filters: {
    status?: string;
    brandId?: string;
    adType?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, brandId, adType, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }
    if (brandId) {
      whereClause += ` AND brand_id = $${paramIndex++}`;
      params.push(brandId);
    }
    if (adType) {
      whereClause += ` AND ad_type = $${paramIndex++}`;
      params.push(adType);
    }

    const campaigns = await prisma.$queryRawUnsafe<any[]>(`
      SELECT c.*, u.username as brand_username, u.display_name as brand_name
      FROM ad_campaigns c
      JOIN users u ON c.brand_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, ...params, limit, offset);

    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as total FROM ad_campaigns ${whereClause}
    `, ...params);

    return {
      campaigns,
      total: parseInt(countResult[0].total),
      page,
      limit
    };
  }

  static async approveCampaign(campaignId: string, adminId: string) {
    await prisma.$executeRaw`
      UPDATE ad_campaigns 
      SET status = 'APPROVED', 
          approved_by = ${adminId}::uuid, 
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = ${campaignId}::uuid AND status = 'PENDING'
    `;

    return this.getCampaignById(campaignId);
  }

  static async rejectCampaign(campaignId: string, reason: string, adminId: string) {
    await prisma.$executeRaw`
      UPDATE ad_campaigns 
      SET status = 'REJECTED', 
          rejection_reason = ${reason},
          approved_by = ${adminId}::uuid,
          updated_at = NOW()
      WHERE id = ${campaignId}::uuid AND status = 'PENDING'
    `;

    return this.getCampaignById(campaignId);
  }

  static async pauseCampaign(campaignId: string, adminId: string) {
    await prisma.$executeRaw`
      UPDATE ad_campaigns 
      SET status = 'PAUSED',
          updated_at = NOW()
      WHERE id = ${campaignId}::uuid AND status = 'ACTIVE'
    `;

    return this.getCampaignById(campaignId);
  }

  static async deleteCampaign(campaignId: string) {
    await prisma.$executeRaw`
      DELETE FROM ad_campaigns WHERE id = ${campaignId}::uuid
    `;
  }

  static async getCampaignById(campaignId: string) {
    const result = await prisma.$queryRaw<any[]>`
      SELECT c.*, u.username as brand_username, u.display_name as brand_name
      FROM ad_campaigns c
      JOIN users u ON c.brand_id = u.id
      WHERE c.id = ${campaignId}::uuid
    `;
    return result[0];
  }

  // ==================== SPONSORED POSTS ====================

  static async getSponsoredPosts(filters: {
    status?: string;
    brandId?: string;
    creatorId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, brandId, creatorId, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND sp.status = $${paramIndex++}`;
      params.push(status);
    }
    if (brandId) {
      whereClause += ` AND sp.brand_id = $${paramIndex++}`;
      params.push(brandId);
    }
    if (creatorId) {
      whereClause += ` AND sp.creator_id = $${paramIndex++}`;
      params.push(creatorId);
    }

    const posts = await prisma.$queryRawUnsafe<any[]>(`
      SELECT sp.*, 
             b.username as brand_username, b.display_name as brand_name,
             c.username as creator_username, c.display_name as creator_name
      FROM sponsored_post_requests sp
      JOIN users b ON sp.brand_id = b.id
      JOIN users c ON sp.creator_id = c.id
      ${whereClause}
      ORDER BY sp.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `, ...params, limit, offset);

    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as total FROM sponsored_post_requests sp ${whereClause}
    `, ...params);

    return {
      posts,
      total: parseInt(countResult[0].total),
      page,
      limit
    };
  }

  static async verifySponsoredPost(postId: string, adminId: string) {
    await prisma.$executeRaw`
      UPDATE sponsored_post_requests 
      SET status = 'APPROVED', 
          verified_by = ${adminId}::uuid, 
          verified_at = NOW(),
          updated_at = NOW()
      WHERE id = ${postId}::uuid AND status = 'SUBMITTED'
    `;

    return this.getSponsoredPostById(postId);
  }

  static async releasePayment(postId: string, adminId: string) {
    // Start transaction to release payment to creator
    await prisma.$transaction(async (tx) => {
      // Get post details
      const post = await tx.$queryRaw<any[]>`
        SELECT * FROM sponsored_post_requests WHERE id = ${postId}::uuid
      `;

      if (!post[0]) throw new Error('Sponsored post not found');
      if (post[0].status !== 'APPROVED') throw new Error('Post must be approved first');

      const creatorPayment = new Prisma.Decimal(post[0].creator_payment_kes);
      const platformFee = new Prisma.Decimal(post[0].platform_fee_kes);

      // Credit creator wallet
      await tx.$executeRaw`
        UPDATE wallets 
        SET kr_balance = kr_balance + ${creatorPayment}
        WHERE user_id = ${post[0].creator_id}::uuid
      `;

      // Create transaction record
      await tx.$executeRaw`
        INSERT INTO transactions (user_id, type, amount_kr, status, provider, reference)
        VALUES (
          ${post[0].creator_id}::uuid,
          'ad_revenue',
          ${creatorPayment},
          'completed',
          'platform',
          ${`sponsored_post_${postId}`}
        )
      `;

      // Update sponsored post status
      await tx.$executeRaw`
        UPDATE sponsored_post_requests 
        SET status = 'PAYMENT_RELEASED', 
            payment_released_at = NOW(),
            updated_at = NOW()
        WHERE id = ${postId}::uuid
      `;
    });

    return this.getSponsoredPostById(postId);
  }

  static async getSponsoredPostById(postId: string) {
    const result = await prisma.$queryRaw<any[]>`
      SELECT sp.*, 
             b.username as brand_username, b.display_name as brand_name,
             c.username as creator_username, c.display_name as creator_name
      FROM sponsored_post_requests sp
      JOIN users b ON sp.brand_id = b.id
      JOIN users c ON sp.creator_id = c.id
      WHERE sp.id = ${postId}::uuid
    `;
    return result[0];
  }

  // ==================== ANALYTICS ====================

  static async getAnalytics(startDate: Date, endDate: Date) {
    const analytics = await prisma.$queryRaw<any[]>`
      SELECT * FROM ad_analytics
      WHERE date >= ${startDate} AND date <= ${endDate}
      ORDER BY date DESC
    `;

    // Calculate totals
    const totals = analytics.reduce((acc, day) => ({
      totalAdSpend: acc.totalAdSpend + parseFloat(day.total_ad_spend_kes),
      platformRevenue: acc.platformRevenue + parseFloat(day.platform_revenue_kes),
      creatorRevenue: acc.creatorRevenue + parseFloat(day.creator_revenue_kes),
      totalImpressions: acc.totalImpressions + day.total_impressions,
      totalClicks: acc.totalClicks + day.total_clicks,
      totalConversions: acc.totalConversions + day.total_conversions
    }), {
      totalAdSpend: 0,
      platformRevenue: 0,
      creatorRevenue: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalConversions: 0
    });

    return { analytics, totals };
  }

  static async getPlatformStats() {
    const config = await this.getAdConfig();
    
    const campaignStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_campaigns,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_campaigns,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_campaigns,
        SUM(spent_kes) as total_spent
      FROM ad_campaigns
    `;

    const sponsoredStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_posts,
        COUNT(*) FILTER (WHERE status = 'SUBMITTED') as submitted_posts,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_posts,
        SUM(total_payment_kes) as total_payments
      FROM sponsored_post_requests
    `;

    return {
      config,
      campaigns: campaignStats[0],
      sponsoredPosts: sponsoredStats[0]
    };
  }
}
