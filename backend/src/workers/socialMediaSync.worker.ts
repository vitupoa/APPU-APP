import { prisma } from '../config/database.js';
import { TikTokService } from '../services/oauth/tiktok.service.js';
import { InstagramService } from '../services/oauth/instagram.service.js';
import { YouTubeService } from '../services/oauth/youtube.service.js';
import { TwitterService } from '../services/oauth/twitter.service.js';
import { FacebookService } from '../services/oauth/facebook.service.js';
import { TwitchService } from '../services/oauth/twitch.service.js';

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
    const expiringAccounts = await prisma.socialMediaAccount.findMany({
      where: {
        tokenExpiresAt: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        refreshToken: { not: null }
      }
    });

    console.log(`[SocialMediaSyncWorker] Refreshing ${expiringAccounts.length} tokens...`);

    for (const account of expiringAccounts) {
      try {
        let newTokens: any;

        switch (account.platform) {
          case 'TIKTOK':
            newTokens = await TikTokService.refreshAccessToken(account.refreshToken!);
            break;
          case 'INSTAGRAM':
            newTokens = await InstagramService.refreshAccessToken(account.accessToken!);
            break;
          case 'YOUTUBE':
            newTokens = await YouTubeService.refreshAccessToken(account.refreshToken!);
            break;
          case 'TWITTER':
            newTokens = await TwitterService.refreshAccessToken(account.refreshToken!);
            break;
          case 'FACEBOOK':
            newTokens = await FacebookService.refreshAccessToken(account.accessToken!);
            break;
          case 'TWITCH':
            newTokens = await TwitchService.refreshAccessToken(account.refreshToken!);
            break;
          default:
            console.log(`[SocialMediaSyncWorker] Unsupported platform for token refresh: ${account.platform}`);
            continue;
        }

        await prisma.socialMediaAccount.update({
          where: { id: account.id },
          data: {
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken || account.refreshToken,
            tokenExpiresAt: new Date(Date.now() + newTokens.expiresIn * 1000),
            syncStatus: 'completed'
          }
        });

        console.log(`[SocialMediaSyncWorker] Refreshed token for ${account.platform} account ${account.id}`);
      } catch (error: any) {
        console.error(`[SocialMediaSyncWorker] Failed to refresh token for ${account.id}:`, error.message);
        await prisma.socialMediaAccount.update({
          where: { id: account.id },
          data: {
            syncStatus: 'failed',
            syncError: error.message
          }
        });
      }
    }
  }

  /**
   * Syncs follower counts for all connected accounts.
   */
  private static async syncFollowerCounts() {
    const accounts = await prisma.socialMediaAccount.findMany({
      where: {
        syncStatus: { not: 'failed' },
        tokenExpiresAt: { gt: new Date() }
      }
    });

    console.log(`[SocialMediaSyncWorker] Syncing follower counts for ${accounts.length} accounts...`);

    for (const account of accounts) {
      try {
        const followersBefore = account.followerCount;
        let followersAfter = followersBefore;

        switch (account.platform) {
          case 'TIKTOK': {
            const userInfo = await TikTokService.getUserInfo(account.accessToken!);
            followersAfter = userInfo.followerCount;
            await prisma.socialMediaAccount.update({
              where: { id: account.id },
              data: {
                followerCount: userInfo.followerCount,
                videoCount: userInfo.videoCount,
                lastSyncedAt: new Date()
              }
            });
            break;
          }
          case 'INSTAGRAM': {
            const userInfo = await InstagramService.getUserInfo(account.accessToken!);
            await prisma.socialMediaAccount.update({
              where: { id: account.id },
              data: {
                videoCount: userInfo.mediaCount,
                lastSyncedAt: new Date()
              }
            });
            break;
          }
          case 'YOUTUBE': {
            const channelInfo = await YouTubeService.getChannelInfo(account.accessToken!);
            followersAfter = channelInfo.subscriberCount;
            await prisma.socialMediaAccount.update({
              where: { id: account.id },
              data: {
                followerCount: channelInfo.subscriberCount,
                subscriberCount: channelInfo.subscriberCount,
                videoCount: channelInfo.videoCount,
                totalViews: BigInt(channelInfo.viewCount),
                avgViews: Math.floor(channelInfo.viewCount / channelInfo.videoCount),
                lastSyncedAt: new Date()
              }
            });
            break;
          }
          case 'TWITTER': {
            const userInfo = await TwitterService.getUserInfo(account.accessToken!);
            followersAfter = userInfo.followerCount;
            await prisma.socialMediaAccount.update({
              where: { id: account.id },
              data: {
                followerCount: userInfo.followerCount,
                lastSyncedAt: new Date()
              }
            });
            break;
          }
          case 'FACEBOOK': {
            const userInfo = await FacebookService.getUserInfo(account.accessToken!);
            followersAfter = userInfo.followerCount;
            await prisma.socialMediaAccount.update({
              where: { id: account.id },
              data: {
                followerCount: userInfo.followerCount,
                lastSyncedAt: new Date()
              }
            });
            break;
          }
          case 'TWITCH': {
            const userInfo = await TwitchService.getUserInfo(account.accessToken!);
            followersAfter = userInfo.followerCount;
            await prisma.socialMediaAccount.update({
              where: { id: account.id },
              data: {
                followerCount: userInfo.followerCount,
                totalViews: BigInt(userInfo.viewCount),
                lastSyncedAt: new Date()
              }
            });
            break;
          }
        }

        // Log sync
        await prisma.socialMediaSyncLog.create({
          data: {
            accountId: account.id,
            syncType: 'follower_count',
            status: 'success',
            followersBefore,
            followersAfter,
            followerChange: followersAfter - followersBefore,
            durationMs: 0
          }
        });

        console.log(`[SocialMediaSyncWorker] Synced ${account.platform} account ${account.id}: ${followersBefore} -> ${followersAfter}`);
      } catch (error: any) {
        console.error(`[SocialMediaSyncWorker] Failed to sync ${account.id}:`, error.message);
        await prisma.socialMediaSyncLog.create({
          data: {
            accountId: account.id,
            syncType: 'follower_count',
            status: 'failed',
            followersBefore: account.followerCount,
            followersAfter: account.followerCount,
            followerChange: 0,
            errorMessage: error.message,
            durationMs: 0
          }
        });
      }
    }
  }

  /**
   * Syncs engagement metrics (views, likes, comments).
   */
  private static async syncEngagementMetrics() {
    const accounts = await prisma.socialMediaAccount.findMany({
      where: {
        syncStatus: { not: 'failed' },
        tokenExpiresAt: { gt: new Date() }
      }
    });

    console.log(`[SocialMediaSyncWorker] Syncing engagement metrics for ${accounts.length} accounts...`);

    for (const account of accounts) {
      try {
        switch (account.platform) {
          case 'TIKTOK': {
            const videos = await TikTokService.getVideos(account.accessToken!);
            const totalViews = videos.videos.reduce((sum, v) => sum + v.viewCount, 0);
            const totalLikes = videos.videos.reduce((sum, v) => sum + v.likeCount, 0);
            const avgViews = Math.floor(totalViews / videos.videos.length);
            const avgLikes = Math.floor(totalLikes / videos.videos.length);
            const engagementRate = (totalLikes / totalViews) * 100;

            await prisma.socialMediaAccount.update({
              where: { id: account.id },
              data: {
                totalViews: BigInt(totalViews),
                avgViews,
                avgLikes,
                engagementRate
              }
            });
            break;
          }
          case 'INSTAGRAM': {
            const media = await InstagramService.getMedia(account.accessToken!);
            const totalLikes = media.media.reduce((sum, m) => sum + (m.likeCount || 0), 0);
            const totalComments = media.media.reduce((sum, m) => sum + (m.commentsCount || 0), 0);
            const avgLikes = Math.floor(totalLikes / media.media.length);
            const engagementRate = ((totalLikes + totalComments) / (account.followerCount * media.media.length)) * 100;

            await prisma.socialMediaAccount.update({
              where: { id: account.id },
              data: {
                avgLikes,
                engagementRate
              }
            });
            break;
          }
          case 'YOUTUBE': {
            const videos = await YouTubeService.getVideos(account.accessToken!);
            const totalViews = videos.videos.reduce((sum, v) => sum + v.viewCount, 0);
            const totalLikes = videos.videos.reduce((sum, v) => sum + v.likeCount, 0);
            const avgViews = Math.floor(totalViews / videos.videos.length);
            const avgLikes = Math.floor(totalLikes / videos.videos.length);
            const engagementRate = (totalLikes / totalViews) * 100;

            await prisma.socialMediaAccount.update({
              where: { id: account.id },
              data: {
                totalViews: BigInt(totalViews),
                avgViews,
                avgLikes,
                engagementRate
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
