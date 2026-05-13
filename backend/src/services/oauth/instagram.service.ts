import axios from 'axios';
import { env } from '../../config/env.js';

const INSTAGRAM_AUTH_URL = 'https://api.instagram.com/oauth/authorize';
const INSTAGRAM_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const INSTAGRAM_GRAPH_URL = 'https://graph.instagram.com';

export class InstagramService {
  /**
   * Generates Instagram OAuth authorization URL.
   */
  static getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: env.INSTAGRAM_CLIENT_ID || '',
      redirect_uri: redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
      state: state
    } as Record<string, string>);

    return `${INSTAGRAM_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for short-lived access token.
   */
  static async getShortLivedToken(code: string, redirectUri: string): Promise<{
    access_token: string;
    userId: string;
  }> {
    const formData = new URLSearchParams({
      client_id: env.INSTAGRAM_CLIENT_ID || '',
      client_secret: env.INSTAGRAM_CLIENT_SECRET || '',
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code
    } as Record<string, string>);

    const response = await axios.post(INSTAGRAM_TOKEN_URL, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return {
      access_token: response.data.access_token,
      userId: response.data.user_id
    };
  }

  /**
   * Exchanges short-lived token for long-lived token (60 days).
   */
  static async getLongLivedToken(shortLivedToken: string): Promise<{
    access_token: string;
    expiresIn: number;
  }> {
    const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/access_token`, {
      params: {
        grant_type: 'ig_exchange_token',
        client_secret: env.INSTAGRAM_CLIENT_SECRET || '',
        access_token: shortLivedToken
      }
    });

    return {
      access_token: response.data.access_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Refreshes long-lived token (extends by 60 days).
   */
  static async refreshAccessToken(accessToken: string): Promise<{
    access_token: string;
    expiresIn: number;
  }> {
    const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/refresh_access_token`, {
      params: {
        grant_type: 'ig_refresh_token',
        access_token: accessToken
      }
    });

    return {
      access_token: response.data.access_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Fetches user profile information.
   */
  static async getUserInfo(accessToken: string): Promise<{
    id: string;
    username: string;
    accountType: string;
    mediaCount: number;
  }> {
    const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/me`, {
      params: {
        fields: 'id,username,account_type,media_count',
        access_token: accessToken
      }
    });

    return {
      id: response.data.id,
      username: response.data.username,
      accountType: response.data.account_type,
      mediaCount: response.data.media_count
    };
  }

  /**
   * Fetches user's media (posts).
   */
  static async getMedia(accessToken: string, after?: string): Promise<{
    media: Array<{
      id: string;
      caption: string;
      mediaType: string;
      mediaUrl: string;
      thumbnailUrl?: string;
      permalink: string;
      timestamp: string;
      likeCount?: number;
      commentsCount?: number;
    }>;
    paging: { cursors: { before: string; after: string }; next?: string };
  }> {
    const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/me/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
        access_token: accessToken,
        after,
        limit: 25
      }
    });

    return {
      media: response.data.data.map((m: any) => ({
        id: m.id,
        caption: m.caption || '',
        media_type: m.media_type,
        media_url: m.media_url,
        thumbnailUrl: m.thumbnail_url,
        permalink: m.permalink,
        timestamp: m.timestamp,
        like_count: m.like_count,
        commentsCount: m.comments_count
      })),
      paging: response.data.paging
    };
  }

  /**
   * Fetches user insights (requires Business/Creator account).
   */
  static async getInsights(accessToken: string, user_id: string): Promise<{
    follower_count: number;
    impressions: number;
    reach: number;
    profileViews: number;
  }> {
    const response = await axios.get(`${INSTAGRAM_GRAPH_URL}/${user_id}/insights`, {
      params: {
        metric: 'follower_count,impressions,reach,profile_views',
        period: 'day',
        access_token: accessToken
      }
    });

    const data = response.data.data;
    return {
      follower_count: data.find((d: any) => d.name === 'follower_count')?.values[0]?.value || 0,
      impressions: data.find((d: any) => d.name === 'impressions')?.values[0]?.value || 0,
      reach: data.find((d: any) => d.name === 'reach')?.values[0]?.value || 0,
      profileViews: data.find((d: any) => d.name === 'profile_views')?.values[0]?.value || 0
    };
  }
}
