import axios from 'axios';

export class TwitchService {
  private static CLIENT_ID = process.env.TWITCH_CLIENT_ID!;
  private static CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET!;
  private static API_BASE = 'https://api.twitch.tv/helix';

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'user:read:email channel:read:subscriptions',
      state
    });

    return `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async getAccessToken(code: string, redirectUri: string) {
    const response = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string) {
    const response = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Get user profile information
   */
  static async getUserInfo(accessToken: string) {
    const response = await axios.get(`${this.API_BASE}/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': this.CLIENT_ID
      }
    });

    const user = response.data.data[0];

    // Get follower count
    let followerCount = 0;
    try {
      const followersResponse = await axios.get(`${this.API_BASE}/channels/followers`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': this.CLIENT_ID
        },
        params: {
          broadcaster_id: user.id
        }
      });
      followerCount = followersResponse.data.total;
    } catch (error) {
      followerCount = 0;
    }

    return {
      id: user.id,
      username: user.login,
      displayName: user.display_name,
      followerCount,
      profileImageUrl: user.profile_image_url,
      viewCount: user.view_count
    };
  }

  /**
   * Get channel videos
   */
  static async getVideos(accessToken: string, userId: string) {
    const response = await axios.get(`${this.API_BASE}/videos`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Client-Id': this.CLIENT_ID
      },
      params: {
        user_id: userId,
        first: 100
      }
    });

    return response.data.data.map((video: any) => ({
      id: video.id,
      title: video.title,
      viewCount: video.view_count,
      createdAt: video.created_at,
      duration: video.duration,
      thumbnailUrl: video.thumbnail_url
    }));
  }
}
