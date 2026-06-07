import { prisma } from '../config/database.js';
import { TikTokService } from '../services/oauth/tiktok.service.js';
import { InstagramService } from '../services/oauth/instagram.service.js';
import { YouTubeService } from '../services/oauth/youtube.service.js';
import { TwitterService } from '../services/oauth/twitter.service.js';
import { FacebookService } from '../services/oauth/facebook.service.js';
import { TwitchService } from '../services/oauth/twitch.service.js';
import crypto from 'crypto';

/**
 * Social Media Sync Worker
 * Runs every 6 hours to:
 * 1. Refresh expiring tokens
 * 2. Update follower counts
 * 3. Sync engagement metrics
 */
export class SocialMediaSyncWorker {
  private static isRunning = false;

  static async start() {
    // Run immediately on startup
    await this.run();

    // Then run every 6 hours
    setInterval(() => this.run(), 6 * 60 * 60 * 1000);
  }

  private static async run() {
    if (this.isRunning) {
      console.log('[SocialMediaSyncWorker] Already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('[SocialMediaSyncWorker] Starting sync...');

    try {
      await this.refreshTokens();
      await this.syncFollowerCounts();
      await this.syncEngagementMetrics();
      console.log('[SocialMediaSyncWorker] Sync complete');
    } catch (error: any) {
      console.error('[SocialMediaSyncWorker] Error:', error.message);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Refreshes tokens that are expiring within 7 days.
   */
  private static async refreshTokens() {
    const expiringAccounts = await prisma.social_media_accounts.findMany({
      where: {
        token_expires_at: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        refresh_token: { not: null }
      }
    });

    console.log(`[SocialMediaSyncWorker] Refreshing ${expiringAccounts.length} tokens...`);

    for (const account of expiringAccounts) {
      try {
        let newTokens: any;

        switch (account.platform) {
          case 'TIKTOK':
            newTokens = await TikTokService.refreshAccessToken(account.refresh_token!);
            break;
          case 'INSTAGRAM':
            newTokens = await InstagramService.refreshAccessToken(account.access_token!);
            break;
          case 'YOUTUBE':
            newTokens = await YouTubeService.refreshAccessToken(account.refresh_token!);
            break;
          case 'TWITTER':
            newTokens = await TwitterService.refreshAccessToken(account.refresh_token!);
            break;
          case 'FACEBOOK':
            newTokens = await FacebookService.refreshAccessToken(account.access_token!);
            break;
          case 'TWITCH':
            newTokens = await TwitchService.refreshAccessToken(account.refresh_token!);
            break;
          default:
            console.log(`[SocialMediaSyncWorker] Unsupported platform for token refresh: ${account.platform}`);
            continue;
        }

        await prisma.social_media_accounts.update({
          where: { id: account.id },
          data: {
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token || account.refresh_token,
            token_expires_at: new Date(Date.now() + newTokens.expiresIn * 1000),
            sync_status: 'completed'
          }
        });

        console.log(`[SocialMediaSyncWorker] Refreshed token for ${account.platform} account ${account.id}`);
      } catch (error: any) {
        console.error(`[SocialMediaSyncWorker] Failed to refresh token for ${account.id}:`, error.message);
        await prisma.social_media_accounts.update({
          where: { id: account.id },
          data: {
            sync_status: 'failed',
            sync_error: error.message
          }
        });
      }
    }
  }

  /**
   * Syncs follower counts for all connected accounts.
   */
  private static async syncFollowerCounts() {
    const accounts = await prisma.social_media_accounts.findMany({
      where: {
        sync_status: { not: 'failed' },
        token_expires_at: { gt: new Date() }
      }
    });

    console.log(`[SocialMediaSyncWorker] Syncing follower counts for ${accounts.length} accounts...`);

    for (const account of accounts) {
      try {
        const followersBefore = account.follower_count;
        let followersAfter = followersBefore;

        switch (account.platform) {
          case 'TIKTOK': {
            const userInfo = await TikTokService.getUserInfo(account.access_token!);
            followersAfter = userInfo.followerCount;
            await prisma.social_media_accounts.update({
              where: { id: account.id },
              data: {
                follower_count: userInfo.followerCount,
                video_count: userInfo.videoCount,
                last_synced_at: new Date()
              }
            });
            break;
          }
          case 'INSTAGRAM': {
            const userInfo = await InstagramService.getUserInfo(account.access_token!);
            await prisma.social_media_accounts.update({
              where: { id: account.id },
              data: {
                video_count: userInfo.mediaCount,
                last_synced_at: new Date()
              }
            });
            break;
          }
          case 'YOUTUBE': {
            const channelInfo = await YouTubeService.getChannelInfo(account.access_token!);
            followersAfter = channelInfo.subscriberCount;
            await prisma.social_media_accounts.update({
              where: { id: account.id },
              data: {
                follower_count: channelInfo.subscriberCount,
                subscriber_count: channelInfo.subscriberCount,
                video_count: channelInfo.videoCount,
                total_views: BigInt(channelInfo.viewCount),
                avg_views: Math.floor(channelInfo.viewCount / channelInfo.videoCount),
                last_synced_at: new Date()
              }
            });
            break;
          }
          case 'TWITTER': {
            const userInfo = await TwitterService.getUserInfo(account.access_token!);
            followersAfter = userInfo.follower_count;
            await prisma.social_media_accounts.update({
              where: { id: account.id },
              data: {
                follower_count: userInfo.follower_count,
                last_synced_at: new Date()
              }
            });
            break;
          }
          case 'FACEBOOK': {
            const userInfo = await FacebookService.getUserInfo(account.access_token!);
            followersAfter = userInfo.follower_count;
            await prisma.social_media_accounts.update({
              where: { id: account.id },
              data: {
                follower_count: userInfo.follower_count,
                last_synced_at: new Date()
              }
            });
            break;
          }
          case 'TWITCH': {
            const userInfo = await TwitchService.getUserInfo(account.access_token!);
            followersAfter = userInfo.followerCount;
            await prisma.social_media_accounts.update({
              where: { id: account.id },
              data: {
                follower_count: userInfo.followerCount,
                total_views: BigInt(userInfo.view_count),
                last_synced_at: new Date()
              }
            });
            break;
          }
        }

        // Log sync
        await prisma.social_media_sync_logs.create({
          data: {
            account_id: account.id,
            sync_type: 'follower_count',
            status: 'success',
            followers_before: followersBefore,
            followers_after: followersAfter,
            follower_change: followersAfter - followersBefore,
            duration_ms: 0
          } as any
        });

        console.log(`[SocialMediaSyncWorker] Synced ${account.platform} account ${account.id}: ${followersBefore} -> ${followersAfter}`);
      } catch (error: any) {
        console.error(`[SocialMediaSyncWorker] Failed to sync ${account.id}:`, error.message);
        await prisma.social_media_sync_logs.create({
          data: {
            account_id: account.id,
            sync_type: 'follower_count',
            status: 'failed',
            followers_before: account.follower_count,
            followers_after: account.follower_count,
            follower_change: 0,
            error_message: error.message,
            duration_ms: 0
          }
        } as any);
      }
    }
  }

  /**
   * Syncs engagement metrics (views, likes, comments).
   */
  private static async syncEngagementMetrics() {
    const accounts = await prisma.social_media_accounts.findMany({
      where: {
        sync_status: { not: 'failed' },
        token_expires_at: { gt: new Date() }
      }
    });

    console.log(`[SocialMediaSyncWorker] Syncing engagement metrics for ${accounts.length} accounts...`);

    for (const account of accounts) {
      try {
        switch (account.platform) {
          case 'TIKTOK': {
            const videos = await TikTokService.getVideos(account.access_token!);
            const totalViews = videos.videos.reduce((sum, v) => sum + v.viewCount, 0);
            const totalLikes = videos.videos.reduce((sum, v) => sum + v.likeCount, 0);
            const avgViews = Math.floor(totalViews / videos.videos.length);
            const avgLikes = Math.floor(totalLikes / videos.videos.length);
            const engagementRate = (totalLikes / totalViews) * 100;

            await prisma.social_media_accounts.update({
              where: { id: account.id },
              data: {
                total_views: BigInt(totalViews),
                avg_views: avgViews,
                avg_likes: avgLikes,
                engagement_rate: engagementRate
              }
            });
            break;
          }
          case 'INSTAGRAM': {
            const media = await InstagramService.getMedia(account.access_token!);
            const totalLikes = media.media.reduce((sum, m) => sum + (m.likeCount || 0), 0);
            const totalComments = media.media.reduce((sum, m) => sum + (m.commentsCount || 0), 0);
            const avgLikes = Math.floor(totalLikes / media.media.length);
            const engagementRate = ((totalLikes + totalComments) / (account.follower_count * media.media.length)) * 100;

            await prisma.social_media_accounts.update({
              where: { id: account.id },
              data: {
                avg_likes: avgLikes,
                engagement_rate: engagementRate
              }
            });
            break;
          }
          case 'YOUTUBE': {
            const videos = await YouTubeService.getVideos(account.access_token!);
            const totalViews = videos.videos.reduce((sum, v) => sum + v.viewCount, 0);
            const totalLikes = videos.videos.reduce((sum, v) => sum + v.likeCount, 0);
            const avgViews = Math.floor(totalViews / videos.videos.length);
            const avgLikes = Math.floor(totalLikes / videos.videos.length);
            const engagementRate = (totalLikes / totalViews) * 100;

            await prisma.social_media_accounts.update({
              where: { id: account.id },
              data: {
                total_views: BigInt(totalViews),
                avg_views: avgViews,
                avg_likes: avgLikes,
                engagement_rate: engagementRate
              }
            });
            break;
          }
        }

        console.log(`[SocialMediaSyncWorker] Synced engagement for ${account.platform} account ${account.id}`);
      } catch (error: any) {
        console.error(`[SocialMediaSyncWorker] Failed to sync engagement for ${account.id}:`, error.message);
      }
    }
  }
}
