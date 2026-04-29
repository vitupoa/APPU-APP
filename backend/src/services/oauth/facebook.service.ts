import axios from 'axios';

export class FacebookService {
  private static APP_ID = process.env.FACEBOOK_APP_ID!;
  private static APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
  private static API_BASE = 'https://graph.facebook.com/v18.0';

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: this.APP_ID,
      redirect_uri: redirectUri,
      state,
      scope: 'public_profile,pages_show_list,pages_read_engagement,pages_read_user_content,instagram_basic,instagram_manage_insights'
    });

    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async getAccessToken(code: string, redirectUri: string) {
    const response = await axios.get(`${this.API_BASE}/oauth/access_token`, {
      params: {
        client_id: this.APP_ID,
        client_secret: this.APP_SECRET,
        redirect_uri: redirectUri,
        code
      }
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  static async getLongLivedToken(shortToken: string) {
    const response = await axios.get(`${this.API_BASE}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: this.APP_ID,
        client_secret: this.APP_SECRET,
        fb_exchange_token: shortToken
      }
    });

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Get user profile information
   */
  static async getUserInfo(accessToken: string) {
    const response = await axios.get(`${this.API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        fields: 'id,name,picture,followers_count'
      }
    });

    return {
      id: response.data.id,
      displayName: response.data.name,
      followerCount: response.data.followers_count || 0,
      profileImageUrl: response.data.picture?.data?.url
    };
  }

  /**
   * Get user's Facebook pages
   */
  static async getPages(accessToken: string) {
    const response = await axios.get(`${this.API_BASE}/me/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        fields: 'id,name,followers_count,fan_count,engagement'
      }
    });

    return response.data.data.map((page: any) => ({
      id: page.id,
      name: page.name,
      followerCount: page.followers_count || page.fan_count || 0
    }));
  }

  /**
   * Refresh long-lived token (extends by 60 days)
   */
  static async refreshAccessToken(accessToken: string) {
    return this.getLongLivedToken(accessToken);
  }
}
