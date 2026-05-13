import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';
import { TikTokService } from '../../services/oauth/tiktok.service.js';
import { InstagramService } from '../../services/oauth/instagram.service.js';
import { YouTubeService } from '../../services/oauth/youtube.service.js';
import { TwitterService } from '../../services/oauth/twitter.service.js';
import { FacebookService } from '../../services/oauth/facebook.service.js';
import { LinkedInService } from '../../services/oauth/linkedin.service.js';
import { TwitchService } from '../../services/oauth/twitch.service.js';
import { prisma } from '../../config/database.js';
import crypto from 'crypto';

const router = Router();

/**
 * GET /api/v1/oauth/:platform/authorize
 * Initiates OAuth flow for social media platform.
 */
router.get('/:platform/authorize', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { platform } = req.params;
    const userId = req.user_id!;
    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = `${process.env.FRONTEND_URL}/oauth/${platform}/callback`;

    let authUrl: string;
    let metadata: any = { oauthState: state };

    switch (platform) {
      case 'tiktok':
        authUrl = TikTokService.getAuthorizationUrl(redirectUri, state);
        break;
      case 'instagram':
        authUrl = InstagramService.getAuthorizationUrl(redirectUri, state);
        break;
      case 'youtube':
        authUrl = YouTubeService.getAuthorizationUrl(redirectUri, state);
        break;
      case 'twitter': {
        const { authUrl: twitterAuthUrl, codeVerifier } = TwitterService.getAuthorizationUrl(redirectUri, state);
        authUrl = twitterAuthUrl;
        metadata.twitterCodeVerifier = codeVerifier;
        break;
      }
      case 'facebook':
        authUrl = FacebookService.getAuthorizationUrl(redirectUri, state);
        break;
      case 'linkedin':
        authUrl = LinkedInService.getAuthorizationUrl(redirectUri, state);
        break;
      case 'twitch':
        authUrl = TwitchService.getAuthorizationUrl(redirectUri, state);
        break;
      default:
        res.status(400).json({ error: 'Invalid platform' });
        return;
    }

    // Store state in session/cache instead of user metadata
    // TODO: Use Redis or session storage for OAuth state
    // await prisma.user.update({ where: { id: userId }, data: { metadata } });

    res.status(200).json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/oauth/:platform/callback
 * Handles OAuth callback from social media platform.
 */
router.post('/:platform/callback', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { platform } = req.params;
    const { code, state } = req.body;
    const userId = req.user_id!;

    // Verify state
    const user = await prisma.user.findUnique({ where: { id: userId } });
    // TODO: Verify state from session/cache
    if (!user) {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }

    const redirectUri = `${process.env.FRONTEND_URL}/oauth/${platform}/callback`;
    let accountData: any;

    switch (platform) {
      case 'tiktok': {
        const tokens = await TikTokService.getAccessToken(code, redirectUri);
        const userInfo = await TikTokService.getUserInfo(tokens.access_token);
        
        accountData = {
          platform: 'TIKTOK',
          username: userInfo.username,
          display_name: userInfo.displayName,
          profileUrl: `https://www.tiktok.com/@${userInfo.username}`,
          follower_count: userInfo.followerCount,
          video_count: userInfo.videoCount,
          total_views: 0,
          avg_views: 0,
          avg_likes: userInfo.likesCount / userInfo.videoCount,
          engagement_rate: 0,
          access_token: tokens.access_token,
          refresh_token: tokens.refreshToken,
          token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000)
        };
        break;
      }
      case 'instagram': {
        const shortToken = await InstagramService.getShortLivedToken(code, redirectUri);
        const longToken = await InstagramService.getLongLivedToken(shortToken.access_token);
        const userInfo = await InstagramService.getUserInfo(longToken.access_token);
        
        accountData = {
          platform: 'INSTAGRAM',
          username: userInfo.username,
          display_name: userInfo.username,
          profileUrl: `https://www.instagram.com/${userInfo.username}`,
          follower_count: 0,
          video_count: userInfo.mediaCount,
          access_token: longToken.access_token,
          token_expires_at: new Date(Date.now() + longToken.expiresIn * 1000)
        };
        break;
      }
      case 'youtube': {
        const tokens = await YouTubeService.getAccessToken(code, redirectUri);
        const channelInfo = await YouTubeService.getChannelInfo(tokens.access_token);
        
        accountData = {
          platform: 'YOUTUBE',
          username: channelInfo.customUrl,
          display_name: channelInfo.title,
          profileUrl: `https://www.youtube.com/${channelInfo.customUrl}`,
          follower_count: channelInfo.subscriberCount,
          subscriberCount: channelInfo.subscriberCount,
          video_count: channelInfo.videoCount,
          total_views: channelInfo.viewCount,
          avg_views: channelInfo.viewCount / channelInfo.videoCount,
          access_token: tokens.access_token,
          refresh_token: tokens.refreshToken,
          token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000)
        };
        break;
      }
      case 'twitter': {
        // TODO: Retrieve codeVerifier from session/cache
      const codeVerifier = ''; // Placeholder
        if (!codeVerifier) {
          res.status(400).json({ error: 'Missing code verifier for Twitter OAuth' });
          return;
        }
        const tokens = await TwitterService.getAccessToken(code, redirectUri, codeVerifier);
        const userInfo = await TwitterService.getUserInfo(tokens.access_token);
        
        accountData = {
          platform: 'TWITTER',
          username: userInfo.username,
          display_name: userInfo.display_name,
          profileUrl: `https://twitter.com/${userInfo.username}`,
          follower_count: userInfo.follower_count,
          video_count: 0,
          total_views: 0,
          avg_views: 0,
          avg_likes: 0,
          engagement_rate: 0,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000)
        };
        break;
      }
      case 'facebook': {
        const shortToken = await FacebookService.getAccessToken(code, redirectUri);
        const longToken = await FacebookService.getLongLivedToken(shortToken.access_token);
        const userInfo = await FacebookService.getUserInfo(longToken.access_token);
        
        accountData = {
          platform: 'FACEBOOK',
          username: userInfo.id,
          display_name: userInfo.display_name,
          profileUrl: `https://facebook.com/${userInfo.id}`,
          follower_count: userInfo.follower_count,
          video_count: 0,
          total_views: 0,
          avg_views: 0,
          avg_likes: 0,
          engagement_rate: 0,
          access_token: longToken.access_token,
          token_expires_at: new Date(Date.now() + longToken.expiresIn * 1000)
        };
        break;
      }
      case 'linkedin': {
        const tokens = await LinkedInService.getAccessToken(code, redirectUri);
        const userInfo = await LinkedInService.getUserInfo(tokens.access_token);
        
        accountData = {
          platform: 'LINKEDIN',
          username: userInfo.id,
          display_name: userInfo.display_name,
          profileUrl: `https://linkedin.com/in/${userInfo.id}`,
          follower_count: userInfo.followerCount,
          video_count: 0,
          total_views: 0,
          avg_views: 0,
          avg_likes: 0,
          engagement_rate: 0,
          access_token: tokens.access_token,
          token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000)
        };
        break;
      }
      case 'twitch': {
        const tokens = await TwitchService.getAccessToken(code, redirectUri);
        const userInfo = await TwitchService.getUserInfo(tokens.access_token);
        
        accountData = {
          platform: 'TWITCH',
          username: userInfo.username,
          display_name: userInfo.display_name,
          profileUrl: `https://twitch.tv/${userInfo.username}`,
          follower_count: userInfo.followerCount,
          video_count: 0,
          total_views: userInfo.view_count,
          avg_views: 0,
          avg_likes: 0,
          engagement_rate: 0,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(Date.now() + tokens.expiresIn * 1000)
        };
        break;
      }
      default:
        res.status(400).json({ error: 'Invalid platform' });
        return;
    }

    // Get or create influencer profile
    let influencerProfile = await prisma.influencer_profiles.findUnique({
      where: { user_id: userId }
    });

    if (!influencerProfile) {
      influencerProfile = await prisma.influencer_profiles.create({
        data: {
          user_id: userId,
          tier: 'NANO',
          categories: [],
          updated_at: new Date()
        }
      });
    }

    // Create or update social media account
    await prisma.social_media_accounts.upsert({
      where: {
        influencer_id_platform: {
          influencer_id: influencerProfile.id,
          platform: accountData.platform
        }
      },
      create: {
        influencer_id: influencerProfile.id,
        ...accountData,
        is_verified: true,
        last_synced_at: new Date(),
        sync_status: 'completed'
      },
      update: {
        ...accountData,
        last_synced_at: new Date(),
        sync_status: 'completed'
      }
    });

    res.status(200).json({ success: true, account: accountData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/oauth/accounts
 * Lists user's connected social media accounts.
 */
router.get('/accounts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user_id!;

    const influencerProfile = await prisma.influencer_profiles.findUnique({
      where: { user_id: userId },
      include: { social_media_accounts: true }
    });

    if (!influencerProfile) {
      res.status(200).json({ accounts: [] });
      return;
    }

    res.status(200).json({ accounts: influencerProfile.social_media_accounts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/v1/oauth/:platform/disconnect
 * Disconnects social media account.
 */
router.delete('/:platform/disconnect', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { platform } = req.params;
    const userId = req.user_id!;

    const influencerProfile = await prisma.influencer_profiles.findUnique({
      where: { user_id: userId }
    });

    if (!influencerProfile) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    const platformUpper = (platform as string).toUpperCase();
    await prisma.social_media_accounts.delete({
      where: {
        influencer_id_platform: {
          influencer_id: influencerProfile.id,
          platform: platformUpper as any
        }
      }
    });

    res.status(200).json({ success: true });
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
    return;
  }
});

export default router;
