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
    const userId = req.userId!;
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
    const userId = req.userId!;

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
        const userInfo = await TikTokService.getUserInfo(tokens.accessToken);
        
        accountData = {
          platform: 'TIKTOK',
          username: userInfo.username,
          displayName: userInfo.displayName,
          profileUrl: `https://www.tiktok.com/@${userInfo.username}`,
          followerCount: userInfo.followerCount,
          videoCount: userInfo.videoCount,
          totalViews: 0,
          avgViews: 0,
          avgLikes: userInfo.likesCount / userInfo.videoCount,
          engagementRate: 0,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
        };
        break;
      }
      case 'instagram': {
        const shortToken = await InstagramService.getShortLivedToken(code, redirectUri);
        const longToken = await InstagramService.getLongLivedToken(shortToken.accessToken);
        const userInfo = await InstagramService.getUserInfo(longToken.accessToken);
        
        accountData = {
          platform: 'INSTAGRAM',
          username: userInfo.username,
          displayName: userInfo.username,
          profileUrl: `https://www.instagram.com/${userInfo.username}`,
          followerCount: 0,
          videoCount: userInfo.mediaCount,
          accessToken: longToken.accessToken,
          tokenExpiresAt: new Date(Date.now() + longToken.expiresIn * 1000)
        };
        break;
      }
      case 'youtube': {
        const tokens = await YouTubeService.getAccessToken(code, redirectUri);
        const channelInfo = await YouTubeService.getChannelInfo(tokens.accessToken);
        
        accountData = {
          platform: 'YOUTUBE',
          username: channelInfo.customUrl,
          displayName: channelInfo.title,
          profileUrl: `https://www.youtube.com/${channelInfo.customUrl}`,
          followerCount: channelInfo.subscriberCount,
          subscriberCount: channelInfo.subscriberCount,
          videoCount: channelInfo.videoCount,
          totalViews: channelInfo.viewCount,
          avgViews: channelInfo.viewCount / channelInfo.videoCount,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
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
        const userInfo = await TwitterService.getUserInfo(tokens.accessToken);
        
        accountData = {
          platform: 'TWITTER',
          username: userInfo.username,
          displayName: userInfo.displayName,
          profileUrl: `https://twitter.com/${userInfo.username}`,
          followerCount: userInfo.followerCount,
          videoCount: 0,
          totalViews: 0,
          avgViews: 0,
          avgLikes: 0,
          engagementRate: 0,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
        };
        break;
      }
      case 'facebook': {
        const shortToken = await FacebookService.getAccessToken(code, redirectUri);
        const longToken = await FacebookService.getLongLivedToken(shortToken.accessToken);
        const userInfo = await FacebookService.getUserInfo(longToken.accessToken);
        
        accountData = {
          platform: 'FACEBOOK',
          username: userInfo.id,
          displayName: userInfo.displayName,
          profileUrl: `https://facebook.com/${userInfo.id}`,
          followerCount: userInfo.followerCount,
          videoCount: 0,
          totalViews: 0,
          avgViews: 0,
          avgLikes: 0,
          engagementRate: 0,
          accessToken: longToken.accessToken,
          tokenExpiresAt: new Date(Date.now() + longToken.expiresIn * 1000)
        };
        break;
      }
      case 'linkedin': {
        const tokens = await LinkedInService.getAccessToken(code, redirectUri);
        const userInfo = await LinkedInService.getUserInfo(tokens.accessToken);
        
        accountData = {
          platform: 'LINKEDIN',
          username: userInfo.id,
          displayName: userInfo.displayName,
          profileUrl: `https://linkedin.com/in/${userInfo.id}`,
          followerCount: userInfo.followerCount,
          videoCount: 0,
          totalViews: 0,
          avgViews: 0,
          avgLikes: 0,
          engagementRate: 0,
          accessToken: tokens.accessToken,
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
        };
        break;
      }
      case 'twitch': {
        const tokens = await TwitchService.getAccessToken(code, redirectUri);
        const userInfo = await TwitchService.getUserInfo(tokens.accessToken);
        
        accountData = {
          platform: 'TWITCH',
          username: userInfo.username,
          displayName: userInfo.displayName,
          profileUrl: `https://twitch.tv/${userInfo.username}`,
          followerCount: userInfo.followerCount,
          videoCount: 0,
          totalViews: userInfo.viewCount,
          avgViews: 0,
          avgLikes: 0,
          engagementRate: 0,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: new Date(Date.now() + tokens.expiresIn * 1000)
        };
        break;
      }
      default:
        res.status(400).json({ error: 'Invalid platform' });
        return;
    }

    // Get or create influencer profile
    let influencerProfile = await prisma.influencerProfile.findUnique({
      where: { userId }
    });

    if (!influencerProfile) {
      influencerProfile = await prisma.influencerProfile.create({
        data: {
          userId,
          tier: 'NANO',
          categories: [],
          instagramFollowers: 0,
          tiktokFollowers: 0,
          youtubeSubscribers: 0
        }
      });
    }

    // Create or update social media account
    await prisma.socialMediaAccount.upsert({
      where: {
        influencerId_platform: {
          influencerId: influencerProfile.id,
          platform: accountData.platform
        }
      },
      create: {
        influencerId: influencerProfile.id,
        ...accountData,
        isVerified: true,
        lastSyncedAt: new Date(),
        syncStatus: 'completed'
      },
      update: {
        ...accountData,
        lastSyncedAt: new Date(),
        syncStatus: 'completed'
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
    const userId = req.userId!;

    const influencerProfile = await prisma.influencerProfile.findUnique({
      where: { userId },
      include: { socialAccounts: true }
    });

    if (!influencerProfile) {
      res.status(200).json({ accounts: [] });
      return;
    }

    res.status(200).json({ accounts: influencerProfile.socialAccounts });
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
    const userId = req.userId!;

    const influencerProfile = await prisma.influencerProfile.findUnique({
      where: { userId }
    });

    if (!influencerProfile) {
      res.status(404).json({ error: 'Influencer profile not found' });
      return;
    }

    const platformUpper = (platform as string).toUpperCase();
    await prisma.socialMediaAccount.delete({
      where: {
        influencerId_platform: {
          influencerId: influencerProfile.id,
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
