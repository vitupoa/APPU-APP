# Influencer Marketplace Search - Updated

## Overview
Businesses can now search and filter creators/influencers in the marketplace based on multiple metrics including admire count, follower count, and subscriber count.

## Endpoint
`GET /api/v1/marketplace/influencers`

## Authentication
Requires authentication token (Business account)

## Query Parameters

### Filtering
- `tier` (string, comma-separated) - Filter by influencer tier: NANO, MICRO, MID, MACRO, MEGA
- `categories` (string, comma-separated) - Filter by content categories
- `minFollowers` (number) - Minimum followers across Instagram/TikTok/YouTube
- `minEngagementRate` (number) - Minimum engagement rate percentage
- `minRating` (number) - Minimum average rating (1-5)
- `minAdmirers` (number) - **NEW** Minimum number of admirers on Runinga platform
- `minSubscribers` (number) - **NEW** Minimum number of subscribers on Runinga platform

### Sorting
- `sortBy` (string) - Sort results by:
  - `followers` - Total followers (desc)
  - `engagement` - Engagement rate (desc) - **DEFAULT**
  - `rating` - Average rating (desc)
  - `rate` - Rate per post (asc)
  - `admirers` - **NEW** Admire count (desc)
  - `subscribers` - **NEW** Subscriber count (desc)

### Pagination
- `cursor` (string) - Pagination cursor for next page
- `limit` (number) - Results per page (default: 20, max: 100)

## Response Format

```json
{
  "items": [
    {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "username": "string",
        "displayName": "string",
        "avatarUrl": "string",
        "isVerified": boolean,
        "admirersCount": number,
        "subscribersCount": number
      },
      "tier": "MICRO",
      "bio": "string",
      "categories": ["Fashion", "Beauty"],
      "socialStats": {
        "instagram": {
          "handle": "@username",
          "followers": 50000
        },
        "tiktok": {
          "handle": "@username",
          "followers": 75000
        },
        "youtube": {
          "handle": "@username",
          "subscribers": 25000
        }
      },
      "metrics": {
        "avgEngagementRate": 4.5,
        "avgViews": 10000,
        "avgRating": 4.8,
        "totalCampaigns": 15,
        "admirersCount": 1250,
        "subscribersCount": 450
      },
      "rates": {
        "perPost": 500.00,
        "perVideo": 1000.00,
        "perStory": 200.00
      },
      "portfolio": [...],
      "isAvailable": true,
      "isVerified": true
    }
  ],
  "nextCursor": "uuid | null"
}
```

## Usage Examples

### Search by Admire Count
```bash
# Find creators with at least 1000 admirers
GET /api/v1/marketplace/influencers?minAdmirers=1000

# Sort by admire count
GET /api/v1/marketplace/influencers?sortBy=admirers
```

### Search by Subscriber Count
```bash
# Find creators with at least 500 subscribers
GET /api/v1/marketplace/influencers?minSubscribers=500

# Sort by subscriber count
GET /api/v1/marketplace/influencers?sortBy=subscribers
```

### Combined Search
```bash
# Find micro-influencers with 10K+ followers, 500+ admirers, and 100+ subscribers
GET /api/v1/marketplace/influencers?tier=MICRO&minFollowers=10000&minAdmirers=500&minSubscribers=100&sortBy=engagement
```

### Fashion Influencers with High Engagement
```bash
GET /api/v1/marketplace/influencers?categories=Fashion&minEngagementRate=3.0&minAdmirers=1000&sortBy=admirers
```

## Key Metrics Explained

### Admirers Count
- Number of users who "admire" (follow) the creator on Runinga platform
- Indicates platform-specific popularity and engagement
- Useful for brands targeting Runinga's active user base

### Subscribers Count
- Number of paid subscribers to the creator's subscription tiers
- Indicates monetization success and fan loyalty
- Higher subscriber count = more engaged and willing-to-pay audience

### Follower Count
- Combined followers across Instagram, TikTok, and YouTube
- Traditional social media reach metric
- Useful for broad awareness campaigns

## Business Use Cases

1. **Micro-Influencer Discovery**: Find rising creators with high engagement but lower follower counts
2. **Platform-Native Campaigns**: Target creators with strong Runinga presence (high admirers/subscribers)
3. **Monetization Potential**: Identify creators with proven ability to convert fans to paying subscribers
4. **Niche Targeting**: Combine category filters with engagement metrics for precise targeting
5. **Budget Optimization**: Sort by rate to find cost-effective influencers within budget

## Notes

- All counts are real-time from the database
- Filtering by admirers/subscribers helps identify creators with engaged Runinga audiences
- Sorting options allow businesses to prioritize different metrics based on campaign goals
- Pagination ensures efficient loading of large result sets
