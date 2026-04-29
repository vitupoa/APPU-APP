import axios from 'axios';
import { env } from '../../config/env.js';

const YOUTUBE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const YOUTUBE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export class YouTubeService {
  /**
   * Generates YouTube OAuth authorization URL.
   */
  static getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: env.YOUTUBE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl',
      access_type: 'offline',
      prompt: 'consent',
      state
    });

    return `${YOUTUBE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for access token.
   */
  static async getAccessToken(code: string, redirectUri: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const response = await axios.post(YOUTUBE_TOKEN_URL, {
      code,
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Refreshes access token using refresh token.
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await axios.post(YOUTUBE_TOKEN_URL, {
      refresh_token: refreshToken,
      client_id: env.YOUTUBE_CLIENT_ID,
      client_secret: env.YOUTUBE_CLIENT_SECRET,
      grant_type: 'refresh_token'
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Fetches channel information.
   */
  static async getChannelInfo(accessToken: string): Promise<{
    id: string;
    title: string;
    description: string;
    customUrl: string;
    thumbnailUrl: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
  }> {
    const response = await axios.get(`${YOUTUBE_API_URL}/channels`, {
      params: {
        part: 'snippet,statistics',
        mine: true
      },
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const channel = response.data.items[0];
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnailUrl: channel.snippet.thumbnails.high.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount),
      videoCount: parseInt(channel.statistics.videoCount),
      viewCount: parseInt(channel.statistics.viewCount)
    };
  }

  /**
   * Fetches channel's videos.
   */
  static async getVideos(accessToken: string, pageToken?: string): Promise<{
    videos: Array<{
      id: string;
      title: string;
      description: string;
      thumbnailUrl: string;
      publishedAt: string;
      viewCount: number;
      likeCount: number;
      commentCount: number;
    }>;
    nextPageToken?: string;
  }> {
    // First, get channel ID
    const channelResponse = await axios.get(`${YOUTUBE_API_URL}/channels`, {
      params: { part: 'contentDetails', mine: true },
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

    // Get videos from uploads playlist
    const playlistResponse = await axios.get(`${YOUTUBE_API_URL}/playlistItems`, {
      params: {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults: 25,
        pageToken
      },
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const videoIds = playlistResponse.data.items.map((item: any) => item.snippet.resourceId.videoId).join(',');

    // Get video statistics
    const statsResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
      params: {
        part: 'statistics',
        id: videoIds
      },
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const videos = playlistResponse.data.items.map((item: any, index: number) => {
      const stats = statsResponse.data.items[index]?.statistics || {};
      return {
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.high.url,
        publishedAt: item.snippet.publishedAt,
        viewCount: parseInt(stats.viewCount || 0),
        likeCount: parseInt(stats.likeCount || 0),
        commentCount: parseInt(stats.commentCount || 0)
      };
    });

    return {
      videos,
      nextPageToken: playlistResponse.data.nextPageToken
    };
  }

  /**
   * Fetches channel analytics.
   */
  static async getAnalytics(accessToken: string, startDate: string, endDate: string): Promise<{
    views: number;
    estimatedMinutesWatched: number;
    averageViewDuration: number;
    subscribersGained: number;
  }> {
    const response = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
      params: {
        ids: 'channel==MINE',
        startDate,
        endDate,
        metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained',
        dimensions: 'day'
      },
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const rows = response.data.rows || [];
    const totals = rows.reduce((acc: any, row: any) => ({
      views: acc.views + row[1],
      estimatedMinutesWatched: acc.estimatedMinutesWatched + row[2],
      averageViewDuration: acc.averageViewDuration + row[3],
      subscribersGained: acc.subscribersGained + row[4]
    }), { views: 0, estimatedMinutesWatched: 0, averageViewDuration: 0, subscribersGained: 0 });

    return totals;
  }
}
