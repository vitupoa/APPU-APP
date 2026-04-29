import axios from 'axios';

export class LinkedInService {
  private static CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
  private static CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
  private static API_BASE = 'https://api.linkedin.com/v2';

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      redirect_uri: redirectUri,
      state,
      scope: 'r_liteprofile r_emailaddress w_member_social r_organization_social'
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async getAccessToken(code: string, redirectUri: string) {
    const response = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        redirect_uri: redirectUri
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in
    };
  }

  /**
   * Get user profile information
   */
  static async getUserInfo(accessToken: string) {
    const profileResponse = await axios.get(`${this.API_BASE}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    // Get follower count (connections)
    let followerCount = 0;
    try {
      const followersResponse = await axios.get(
        `${this.API_BASE}/networkSizes/urn:li:person:${profileResponse.data.id}?edgeType=CompanyFollowedByMember`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      followerCount = followersResponse.data.firstDegreeSize || 0;
    } catch (error) {
      // Fallback if network size API fails
      followerCount = 0;
    }

    return {
      id: profileResponse.data.id,
      firstName: profileResponse.data.localizedFirstName,
      lastName: profileResponse.data.localizedLastName,
      displayName: `${profileResponse.data.localizedFirstName} ${profileResponse.data.localizedLastName}`,
      followerCount,
      profileImageUrl: profileResponse.data.profilePicture?.displayImage
    };
  }

  /**
   * Get user's posts with metrics
   */
  static async getPosts(accessToken: string, authorUrn: string) {
    const response = await axios.get(`${this.API_BASE}/shares`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q: 'owners',
        owners: authorUrn,
        count: 50
      }
    });

    return response.data.elements.map((post: any) => ({
      id: post.id,
      text: post.text?.text,
      createdAt: post.created?.time,
      likes: post.totalShareStatistics?.likeCount || 0,
      comments: post.totalShareStatistics?.commentCount || 0,
      shares: post.totalShareStatistics?.shareCount || 0
    }));
  }

  /**
   * Refresh access token (LinkedIn tokens don't refresh, need re-auth)
   */
  static async refreshAccessToken(refreshToken: string) {
    throw new Error('LinkedIn does not support token refresh. User must re-authenticate.');
  }
}
