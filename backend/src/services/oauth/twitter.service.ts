import axios from 'axios';
import crypto from 'crypto';

export class TwitterService {
  private static CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
  private static CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
  private static API_BASE = 'https://api.twitter.com/2';

  /**
   * Generate OAuth 2.0 authorization URL with PKCE
   */
  static getAuthorizationUrl(redirectUri: string, state: string): { authUrl: string; codeVerifier: string } {
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'tweet.read users.read follows.read offline.access',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    return {
      authUrl: `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
      codeVerifier
    };
  }

  /**
   * Exchange authorization code for access token
   */
  static async getAccessToken(code: string, redirectUri: string, codeVerifier: string) {
    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: this.CLIENT_ID,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string) {
    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        client_id: this.CLIENT_ID
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.CLIENT_ID}:${this.CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    return {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Get user profile information
   */
  static async getUserInfo(accessToken: string) {
    const response = await axios.get(`${this.API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        'user.fields': 'public_metrics,verified,profile_image_url'
      }
    });

    const user = response.data.data;
    return {
      id: user.id,
      username: user.username,
      display_name: user.name,
      verified: user.verified,
      follower_count: user.public_metrics.followers_count,
      followingCount: user.public_metrics.following_count,
      tweetCount: user.public_metrics.tweet_count,
      profileImageUrl: user.profile_image_url
    };
  }

  /**
   * Get user's tweets with metrics
   */
  static async getTweets(accessToken: string, userId: string) {
    const response = await axios.get(`${this.API_BASE}/users/${userId}/tweets`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        max_results: 100,
        'tweet.fields': 'public_metrics,created_at'
      }
    });

    return response.data.data.map((tweet: any) => ({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      likes: tweet.public_metrics.like_count,
      retweets: tweet.public_metrics.retweet_count,
      replies: tweet.public_metrics.reply_count,
      impressions: tweet.public_metrics.impression_count
    }));
  }
}
