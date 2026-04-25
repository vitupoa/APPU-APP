import { prisma } from '../../config/database.js';
import axios from 'axios';

interface SocialMetrics {
  followerCount: number;
  subscriberCount?: number;
  videoCount?: number;
  totalViews?: number;
  avgViews?: number;
  avgLikes?: number;
  engagementRate?: number;
  isVerified?: boolean;
}

export class SocialMediaService {
  
  // ─── ADD SOCIAL MEDIA ACCOUNT ───────────────────────────────
  
  async addSocialAccount(
    influencerId: string,
    platform: string,
    username: string,
    accessToken?: string
  ) {
    const profileUrl = this.buildProfileUrl(platform, username);
    
    const account = await prisma.socialMediaAccount.create({
      data: {
        influencerId,
        platform,
        username,
        profileUrl,
        accessToken,
        syncStatus: 'pending',
      },
    });
    
    // Trigger initial sync
    await this.syncAccountMetrics(account.id);
    
    return account;
  }
  
  // ─── SYNC ACCOUNT METRICS ───────────────────────────────────
  
  async syncAccountMetrics(accountId: string) {
    const startTime = Date.now();
    
    const account = await prisma.socialMediaAccount.findUnique({
      where: { id: accountId },
    });
    
    if (!account) throw new Error('Account not found');
    
    const followersBefore = account.followerCount;
    
    try {
      const metrics = await this.fetchMetrics(account.platform, account.username, account.accessToken);
      
      const updatedAccount = await prisma.socialMediaAccount.update({
        where: { id: accountId },
        data: {
          followerCount: metrics.followerCount,
          subscriberCount: metrics.subscriberCount || 0,
          videoCount: metrics.videoCount || 0,
          totalViews: metrics.totalViews || 0,
          avgViews: metrics.avgViews || 0,
          avgLikes: metrics.avgLikes || 0,
          engagementRate: metrics.engagementRate || 0,
          isVerified: metrics.isVerified || false,
          lastSyncedAt: new Date(),
          syncStatus: 'success',
          syncError: null,
        },
      });
      
      // Log sync
      await prisma.socialMediaSyncLog.create({
        data: {
          accountId,
          syncType: 'manual',
          status: 'success',
          followersBefore,
          followersAfter: metrics.followerCount,
          followerChange: metrics.followerCount - followersBefore,
          durationMs: Date.now() - startTime,
        },
      });
      
      // Update influencer tier based on total followers
      await this.updateInfluencerTier(account.influencerId);
      
      return updatedAccount;
      
    } catch (error: any) {
      await prisma.socialMediaAccount.update({
        where: { id: accountId },
        data: {
          syncStatus: 'failed',
          syncError: error.message,
        },
      });
      
      await prisma.socialMediaSyncLog.create({
        data: {
          accountId,
          syncType: 'manual',
          status: 'failed',
          followersBefore,
          followersAfter: followersBefore,
          followerChange: 0,
          errorMessage: error.message,
          durationMs: Date.now() - startTime,
        },
      });
      
      throw error;
    }
  }
  
  // ─── FETCH METRICS FROM PLATFORMS ──────────────────────────
  
  private async fetchMetrics(
    platform: string,
    username: string,
    accessToken?: string | null
  ): Promise<SocialMetrics> {
    switch (platform) {
      case 'TIKTOK':
        return this.fetchTikTokMetrics(username, accessToken);
      case 'YOUTUBE':
        return this.fetchYouTubeMetrics(username, accessToken);
      case 'INSTAGRAM':
        return this.fetchInstagramMetrics(username, accessToken);
      case 'FACEBOOK':
        return this.fetchFacebookMetrics(username, accessToken);
      case 'TWITTER':
        return this.fetchTwitterMetrics(username, accessToken);
      default:
        throw new Error(`Platform ${platform} not supported`);
    }
  }
  
  // ─── TIKTOK API ────────────────────────────────────────────
  
  private async fetchTikTokMetrics(username: string, accessToken?: string | null): Promise<SocialMetrics> {
    if (!accessToken) {
      // Use public scraping API (RapidAPI or similar)
      return this.fetchTikTokPublic(username);
    }
    
    // TikTok Official API
    const response = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      params: {
        fields: 'follower_count,video_count,likes_count,is_verified',
      },
    });
    
    const data = response.data.data.user;
    
    return {
      followerCount: data.follower_count,
      videoCount: data.video_count,
      avgLikes: Math.floor(data.likes_count / data.video_count),
      isVerified: data.is_verified,
      engagementRate: this.calculateEngagementRate(data.likes_count, data.follower_count, data.video_count),
    };
  }
  
  private async fetchTikTokPublic(username: string): Promise<SocialMetrics> {
    // Using RapidAPI TikTok scraper as fallback
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    
    if (!RAPIDAPI_KEY) {
      throw new Error('RapidAPI key not configured');
    }
    
    const response = await axios.get('https://tiktok-scraper7.p.rapidapi.com/user/info', {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'tiktok-scraper7.p.rapidapi.com',
      },
      params: {
        unique_id: username,
      },
    });
    
    const user = response.data.data.user;
    
    return {
      followerCount: user.followerCount || 0,
      videoCount: user.videoCount || 0,
      totalViews: user.totalViews || 0,
      isVerified: user.verified || false,
      engagementRate: 0, // Calculate from recent videos if needed
    };
  }
  
  // ─── YOUTUBE API ───────────────────────────────────────────
  
  private async fetchYouTubeMetrics(username: string, accessToken?: string | null): Promise<SocialMetrics> {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }
    
    // Get channel by username
    const channelResponse = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'statistics,snippet',
        forUsername: username,
        key: YOUTUBE_API_KEY,
      },
    });
    
    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('YouTube channel not found');
    }
    
    const channel = channelResponse.data.items[0];
    const stats = channel.statistics;
    
    return {
      followerCount: parseInt(stats.subscriberCount) || 0,
      subscriberCount: parseInt(stats.subscriberCount) || 0,
      videoCount: parseInt(stats.videoCount) || 0,
      totalViews: parseInt(stats.viewCount) || 0,
      avgViews: Math.floor(parseInt(stats.viewCount) / parseInt(stats.videoCount)),
      isVerified: channel.snippet.customUrl ? true : false,
    };
  }
  
  // ─── INSTAGRAM API ─────────────────────────────────────────
  
  private async fetchInstagramMetrics(username: string, accessToken?: string | null): Promise<SocialMetrics> {
    if (!accessToken) {
      throw new Error('Instagram requires access token (OAuth)');
    }
    
    // Instagram Graph API
    const response = await axios.get(`https://graph.instagram.com/me`, {
      params: {
        fields: 'followers_count,media_count,username,is_verified',
        access_token: accessToken,
      },
    });
    
    const data = response.data;
    
    // Get recent media for engagement calculation
    const mediaResponse = await axios.get(`https://graph.instagram.com/me/media`, {
      params: {
        fields: 'like_count,comments_count,timestamp',
        limit: 10,
        access_token: accessToken,
      },
    });
    
    const recentMedia = mediaResponse.data.data;
    const totalEngagement = recentMedia.reduce((sum: number, post: any) => 
      sum + (post.like_count || 0) + (post.comments_count || 0), 0
    );
    const avgEngagement = totalEngagement / recentMedia.length;
    const engagementRate = (avgEngagement / data.followers_count) * 100;
    
    return {
      followerCount: data.followers_count,
      videoCount: data.media_count,
      avgLikes: Math.floor(totalEngagement / recentMedia.length),
      engagementRate,
      isVerified: data.is_verified || false,
    };
  }
  
  // ─── FACEBOOK API ──────────────────────────────────────────
  
  private async fetchFacebookMetrics(username: string, accessToken?: string | null): Promise<SocialMetrics> {
    if (!accessToken) {
      throw new Error('Facebook requires access token (OAuth)');
    }
    
    // Facebook Graph API
    const response = await axios.get(`https://graph.facebook.com/v18.0/${username}`, {
      params: {
        fields: 'followers_count,fan_count,name,verification_status',
        access_token: accessToken,
      },
    });
    
    const data = response.data;
    
    return {
      followerCount: data.followers_count || data.fan_count || 0,
      isVerified: data.verification_status === 'blue_verified',
    };
  }
  
  // ─── TWITTER/X API ─────────────────────────────────────────
  
  private async fetchTwitterMetrics(username: string, accessToken?: string | null): Promise<SocialMetrics> {
    const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
    
    if (!TWITTER_BEARER_TOKEN) {
      throw new Error('Twitter Bearer Token not configured');
    }
    
    // Twitter API v2
    const response = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
      },
      params: {
        'user.fields': 'public_metrics,verified',
      },
    });
    
    const user = response.data.data;
    const metrics = user.public_metrics;
    
    return {
      followerCount: metrics.followers_count,
      videoCount: metrics.tweet_count,
      isVerified: user.verified,
    };
  }
  
  // ─── HELPER METHODS ────────────────────────────────────────
  
  private buildProfileUrl(platform: string, username: string): string {
    const urls: Record<string, string> = {
      TIKTOK: `https://www.tiktok.com/@${username}`,
      YOUTUBE: `https://www.youtube.com/@${username}`,
      INSTAGRAM: `https://www.instagram.com/${username}`,
      FACEBOOK: `https://www.facebook.com/${username}`,
      TWITTER: `https://twitter.com/${username}`,
      TWITCH: `https://www.twitch.tv/${username}`,
      LINKEDIN: `https://www.linkedin.com/in/${username}`,
      SNAPCHAT: `https://www.snapchat.com/add/${username}`,
    };
    
    return urls[platform] || '';
  }
  
  private calculateEngagementRate(totalLikes: number, followers: number, posts: number): number {
    if (followers === 0 || posts === 0) return 0;
    const avgLikesPerPost = totalLikes / posts;
    return (avgLikesPerPost / followers) * 100;
  }
  
  // ─── UPDATE INFLUENCER TIER ────────────────────────────────
  
  private async updateInfluencerTier(influencerId: string) {
    const accounts = await prisma.socialMediaAccount.findMany({
      where: { influencerId },
    });
    
    // Calculate total followers across all platforms
    const totalFollowers = accounts.reduce((sum: number, acc) => sum + acc.followerCount, 0);
    
    // Determine tier
    let tier = 'NANO';
    if (totalFollowers >= 1000000) tier = 'MEGA';
    else if (totalFollowers >= 500000) tier = 'MACRO';
    else if (totalFollowers >= 100000) tier = 'MID';
    else if (totalFollowers >= 10000) tier = 'MICRO';
    
    // Calculate average engagement rate
    const avgEngagement = accounts.reduce((sum: number, acc) => sum + Number(acc.engagementRate), 0) / accounts.length;
    
    await prisma.influencerProfile.update({
      where: { id: influencerId },
      data: {
        tier,
        avgEngagementRate: avgEngagement,
      },
    });
  }
  
  // ─── GET ALL ACCOUNTS FOR INFLUENCER ───────────────────────
  
  async getInfluencerSocialAccounts(influencerId: string) {
    return prisma.socialMediaAccount.findMany({
      where: { influencerId },
      orderBy: [
        { isPrimary: 'desc' },
        { followerCount: 'desc' },
      ],
    });
  }
  
  // ─── SET PRIMARY ACCOUNT ───────────────────────────────────
  
  async setPrimaryAccount(accountId: string, influencerId: string) {
    // Remove primary from all accounts
    await prisma.socialMediaAccount.updateMany({
      where: { influencerId },
      data: { isPrimary: false },
    });
    
    // Set new primary
    return prisma.socialMediaAccount.update({
      where: { id: accountId },
      data: { isPrimary: true },
    });
  }
  
  // ─── DELETE ACCOUNT ────────────────────────────────────────
  
  async deleteSocialAccount(accountId: string) {
    return prisma.socialMediaAccount.delete({
      where: { id: accountId },
    });
  }
  
  // ─── SYNC ALL ACCOUNTS (CRON JOB) ─────────────────────────
  
  async syncAllAccounts() {
    const accounts = await prisma.socialMediaAccount.findMany({
      where: {
        OR: [
          { lastSyncedAt: null },
          { lastSyncedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // 24 hours ago
        ],
      },
    });
    
    const results = [];
    
    for (const account of accounts) {
      try {
        await this.syncAccountMetrics(account.id);
        results.push({ accountId: account.id, status: 'success' });
      } catch (error: any) {
        results.push({ accountId: account.id, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }
}
