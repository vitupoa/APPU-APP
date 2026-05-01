import axios from 'axios';
import { env } from '../../config/env.js';

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize/';
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';
const TIKTOK_API_URL = 'https://open.tiktokapis.com/v2';

export class TikTokService {
  /**
   * Generates TikTok OAuth authorization URL.
   */
  static getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY || '',
      scope: 'user.info.basic,video.list,user.info.stats',
      response_type: 'code',
      redirect_uri: redirectUri,
      state: state
    } as Record<string, string>);

    return `${TIKTOK_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for access token.
   */
  static async getAccessToken(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    openId: string;
  }> {
    const response = await axios.post(TIKTOK_TOKEN_URL, {
      client_key: env.TIKTOK_CLIENT_KEY || '',
      client_secret: env.TIKTOK_CLIENT_SECRET || '',
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data.data;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      openId: data.open_id
    };
  }

  /**
   * Refreshes access token using refresh token.
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await axios.post(TIKTOK_TOKEN_URL, {
      client_key: env.TIKTOK_CLIENT_KEY || '',
      client_secret: env.TIKTOK_CLIENT_SECRET || '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const data = response.data.data;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    };
  }

  /**
   * Fetches user profile information.
   */
  static async getUserInfo(accessToken: string): Promise<{
    openId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    followerCount: number;
    followingCount: number;
    videoCount: number;
    likesCount: number;
  }> {
    const response = await axios.get(`${TIKTOK_API_URL}/user/info/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { fields: 'open_id,union_id,avatar_url,display_name,follower_count,following_count,video_count,likes_count' }
    });

    const data = response.data.data.user;
    return {
      openId: data.open_id,
      username: data.union_id,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      followerCount: data.follower_count,
      followingCount: data.following_count,
      videoCount: data.video_count,
      likesCount: data.likes_count
    };
  }

  /**
   * Fetches user's video list.
   */
  static async getVideos(accessToken: string, cursor?: string): Promise<{
    videos: Array<{
      id: string;
      title: string;
      coverUrl: string;
      viewCount: number;
      likeCount: number;
      commentCount: number;
      shareCount: number;
    }>;
    cursor: string;
    hasMore: boolean;
  }> {
    const response = await axios.post(`${TIKTOK_API_URL}/video/list/`, {
      max_count: 20,
      cursor: cursor || 0
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = response.data.data;
    return {
      videos: data.videos.map((v: any) => ({
        id: v.id,
        title: v.title,
        coverUrl: v.cover_image_url,
        viewCount: v.view_count,
        likeCount: v.like_count,
        commentCount: v.comment_count,
        shareCount: v.share_count
      })),
      cursor: data.cursor,
      hasMore: data.has_more
    };
  }
}
