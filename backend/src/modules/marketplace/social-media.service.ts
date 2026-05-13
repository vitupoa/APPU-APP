import { prisma } from '../../config/database.js';
import axios from 'axios';
import { encrypt, decrypt } from '../../utils/encryption.js';

interface SocialMetrics {
  follower_count: number;
  subscriber_count?: number;
  video_count?: number;
  total_views?: number;
  avg_views?: number;
  avg_likes?: number;
  engagement_rate?: number;
  is_verified?: boolean;
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
    
    // Encrypt access token before storing
    const encryptedToken = accessToken ? encrypt(accessToken) : null;
    
    const account = await prisma.social_media_accounts.create({
      data: {
        influencer_id: influencerId,
        platform: platform as any,
        username,
        profile_url: profileUrl,
        access_token: encryptedToken,
        sync_status: 'pending',
      },
    });
    
    // Trigger initial sync
    await this.syncAccountMetrics(account.id);
    
    return account;
  }
  
  // ─── SYNC ACCOUNT METRICS ───────────────────────────────────
  
  async syncAccountMetrics(accountId: string) {
    const startTime = Date.now();
    
    const account = await prisma.social_media_accounts.findUnique({
      where: { id: accountId },
    });
    
    if (!account) throw new Error('Account not found');
    
    const followersBefore = account.follower_count;
    
    try {
      // Decrypt access token before use
      const decryptedToken = account.access_token ? decrypt(account.access_token) : null;
      const metrics = await this.fetchMetrics(account.platform, account.username, decryptedToken);
      
      const updatedAccount = await prisma.social_media_accounts.update({
        where: { id: accountId },
        data: {
          follower_count: metrics.follower_count,
          subscriber_count: metrics.subscriber_count || 0,
          video_count: metrics.video_count || 0,
          total_views: metrics.total_views || 0,
          avg_views: metrics.avg_views || 0,
          avg_likes: metrics.avg_likes || 0,
          engagement_rate: metrics.engagement_rate || 0,
          is_verified: metrics.is_verified || false,
          last_synced_at: new Date(),
          sync_status: 'success',
          sync_error: null,
        },
      });
      
      // Log sync
      await prisma.social_media_sync_logs.create({
        data: {
          account_id: accountId,
          sync_type: 'manual',
          status: 'success',
          followers_before: followersBefore,
          followers_after: metrics.follower_count,
          follower_change: metrics.follower_count - followersBefore,
          duration_ms: Date.now() - startTime,
        },
      });
      
      // Update influencer tier based on total followers
      await this.updateInfluencerTier(account.influencer_id);
      
      return updatedAccount;
      
    } catch (error: any) {
      await prisma.social_media_accounts.update({
        where: { id: accountId },
        data: {
          sync_status: 'failed',
          sync_error: error.message,
        },
      });
      
      await prisma.social_media_sync_logs.create({
        data: {
          account_id: accountId,
          sync_type: 'manual',
          status: 'failed',
          followers_before: followersBefore,
          followers_after: followersBefore,
          follower_change: 0,
          error_message: error.message,
          duration_ms: Date.now() - startTime,
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
      follower_count: data.follower_count,
      video_count: data.video_count,
      avg_likes: Math.floor(data.likes_count / data.video_count),
      is_verified: data.is_verified,
      engagement_rate: this.calculateEngagementRate(data.likes_count, data.follower_count, data.video_count),
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
      follower_count: user.follower_count || 0,
      video_count: user.video_count || 0,
      total_views: user.total_views || 0,
      is_verified: user.verified || false,
      engagement_rate: 0, // Calculate from recent videos if needed
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
      follower_count: parseInt(stats.subscriberCount) || 0,
      subscriber_count: parseInt(stats.subscriberCount) || 0,
      video_count: parseInt(stats.videoCount) || 0,
      total_views: parseInt(stats.viewCount) || 0,
      avg_views: Math.floor(parseInt(stats.viewCount) / parseInt(stats.videoCount)),
      is_verified: channel.snippet.customUrl ? true : false,
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
      follower_count: data.followers_count,
      video_count: data.media_count,
      avg_likes: Math.floor(totalEngagement / recentMedia.length),
      engagement_rate: engagementRate,
      is_verified: data.is_verified || false,
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
      follower_count: data.followers_count || data.fan_count || 0,
      is_verified: data.verification_status === 'blue_verified',
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
      follower_count: metrics.followers_count,
      video_count: metrics.tweet_count,
      is_verified: user.verified,
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
    const accounts = await prisma.social_media_accounts.findMany({
      where: { influencer_id: influencerId },
    });
    
    const totalFollowers = accounts.reduce((sum, acc) => sum + acc.follower_count, 0);
    
    let tier: 'NANO' | 'MICRO' | 'MID' | 'MACRO' | 'MEGA' = 'NANO';
    if (totalFollowers >= 1000000) tier = 'MEGA';
    else if (totalFollowers >= 500000) tier = 'MACRO';
    else if (totalFollowers >= 100000) tier = 'MID';
    else if (totalFollowers >= 10000) tier = 'MICRO';
    
    const avgEngagement = accounts.reduce((sum, acc) => sum + Number(acc.engagement_rate), 0) / accounts.length;
    
    await prisma.influencer_profiles.update({
      where: { id: influencerId },
      data: {
        tier,
        avg_engagement_rate: avgEngagement,
      },
    });
  }
  
  // ─── GET ALL ACCOUNTS FOR INFLUENCER ───────────────────────
  
  async getInfluencerSocialAccounts(influencerId: string) {
    return prisma.social_media_accounts.findMany({
      where: { influencer_id: influencerId },
      orderBy: [
        { is_primary: 'desc' },
        { follower_count: 'desc' },
      ],
    });
  }
  
  // ─── SET PRIMARY ACCOUNT ───────────────────────────────────
  
  async setPrimaryAccount(accountId: string, influencerId: string) {
    // Remove primary from all accounts
    await prisma.social_media_accounts.updateMany({
      where: { influencer_id: influencerId },
      data: { is_primary: false },
    });
    
    // Set new primary
    return prisma.social_media_accounts.update({
      where: { id: accountId },
      data: { is_primary: true },
    });
  }
  
  // ─── DELETE ACCOUNT ────────────────────────────────────────
  
  async deleteSocialAccount(accountId: string) {
    return prisma.social_media_accounts.delete({
      where: { id: accountId },
    });
  }
  
  // ─── SYNC ALL ACCOUNTS (CRON JOB) ─────────────────────────
  
  async syncAllAccounts() {
    const accounts = await prisma.social_media_accounts.findMany({
      where: {
        OR: [
          { last_synced_at: null },
          { last_synced_at: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // 24 hours ago
        ],
      },
    });
    
    const results = [];
    
    for (const account of accounts) {
      try {
        await this.syncAccountMetrics(account.id);
        results.push({ account_id: account.id, status: 'success' });
      } catch (error: any) {
        results.push({ account_id: account.id, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }
}
