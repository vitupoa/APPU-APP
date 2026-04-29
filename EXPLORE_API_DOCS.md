# Explore API Documentation

## Base URL
```
Production: https://api.krieta.com/api/v1/explore
Development: http://localhost:3000/api/v1/explore
```

## Authentication
All endpoints support optional authentication via Bearer token in Authorization header.
Authenticated requests may receive personalized results in the future.

---

## Endpoints

### 1. Get Trending Hashtags

**GET** `/trending/hashtags`

Returns the most used hashtags across the platform.

**Query Parameters:**
- `limit` (optional, default: 10) - Number of hashtags to return

**Response:**
```json
[
  {
    "tag": "#fitness",
    "viewCount": 2100000,
    "postCount": 1234
  },
  {
    "tag": "#art",
    "viewCount": 890000,
    "postCount": 567
  }
]
```

**Example:**
```bash
curl -X GET "https://api.krieta.com/api/v1/explore/trending/hashtags?limit=10"
```

---

### 2. Get Trending Shorts

**GET** `/trending/shorts`

Returns trending short videos based on views and engagement.

**Query Parameters:**
- `category` (optional) - Filter by category: ALL, COMEDY, DANCE, FOOD, TECH, FITNESS, FASHION, MUSIC, ART, BUSINESS, EDUCATION, GAMING
- `limit` (optional, default: 20) - Number of shorts to return

**Response:**
```json
[
  {
    "id": "uuid",
    "thumbnailUrl": "https://cdn.krieta.com/shorts/thumb.jpg",
    "viewCount": 125000,
    "creatorUsername": "creator1",
    "creatorAvatar": "https://cdn.krieta.com/avatars/user.jpg"
  }
]
```

**Example:**
```bash
curl -X GET "https://api.krieta.com/api/v1/explore/trending/shorts?category=COMEDY&limit=20"
```

---

### 3. Get Trending Contests

**GET** `/trending/contests`

Returns active contests with the most participants and highest prizes.

**Query Parameters:**
- `limit` (optional, default: 10) - Number of contests to return

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Dance Challenge 2024",
    "thumbnailUrl": "https://cdn.krieta.com/contests/cover.jpg",
    "prizeKr": 5000.0,
    "participantsCount": 234,
    "category": "DANCE"
  }
]
```

**Example:**
```bash
curl -X GET "https://api.krieta.com/api/v1/explore/trending/contests?limit=10"
```

---

### 4. Get Trending Creators

**GET** `/trending/creators`

Returns creators with the most followers (minimum 100 followers).

**Query Parameters:**
- `limit` (optional, default: 10) - Number of creators to return

**Response:**
```json
[
  {
    "id": "uuid",
    "username": "sarah_fitness",
    "displayName": "Sarah Johnson",
    "avatarUrl": "https://cdn.krieta.com/avatars/sarah.jpg",
    "followerCount": 125000,
    "isVerified": true,
    "bio": "Fitness coach & nutritionist"
  }
]
```

**Example:**
```bash
curl -X GET "https://api.krieta.com/api/v1/explore/trending/creators?limit=10"
```

---

### 5. Get Live Streams

**GET** `/live`

Returns currently active live streams ordered by viewer count.

**Query Parameters:**
- `limit` (optional, default: 20) - Number of streams to return

**Response:**
```json
[
  {
    "id": "uuid",
    "creatorId": "uuid",
    "creatorUsername": "sarah_fitness",
    "creatorAvatar": "https://cdn.krieta.com/avatars/sarah.jpg",
    "thumbnailUrl": "https://cdn.krieta.com/live/thumb.jpg",
    "viewerCount": 1234,
    "title": "Morning Workout Session",
    "category": "Fitness"
  }
]
```

**Example:**
```bash
curl -X GET "https://api.krieta.com/api/v1/explore/live?limit=20"
```

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Invalid parameter value"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Database query failed"
}
```

---

## Rate Limiting

All endpoints are subject to rate limiting:
- **Unauthenticated**: 100 requests per 15 minutes
- **Authenticated**: 300 requests per 15 minutes

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Caching

Responses are cached for 5 minutes. Use `Cache-Control` header to control caching:
```
Cache-Control: public, max-age=300
```

---

## CORS

CORS is enabled for all origins in development.
Production restricts to `https://krieta.com` and `https://app.krieta.com`.

---

## Versioning

API version is included in the URL path: `/api/v1/explore`

Breaking changes will be released under a new version: `/api/v2/explore`

---

## Support

For API support, contact: dev@krieta.com
