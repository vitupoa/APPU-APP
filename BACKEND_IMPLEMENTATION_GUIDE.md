# Backend API Implementation Guide

## Overview
This document provides the complete backend implementation for the Runinga app features including contest submissions, shorts feeds, drips feed, video player support, and real-time WebSocket updates.

## 1. Contest Submissions API

### GET /api/v1/contests/submissions/feed
Fetch contest submissions from all active contests.

**Query Parameters:**
- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "items": [
    {
      "id": "sub_123",
      "user": {
        "id": "user_456",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "https://...",
        "isVerified": true
      },
      "contestId": "contest_789",
      "contest": {
        "id": "contest_789",
        "title": "Dance Challenge",
        "prizeKr": 5000,
        "status": "ACTIVE"
      },
      "mediaUrl": "https://...",
      "mediaType": "VIDEO",
      "caption": "My submission!",
      "proofScreenshots": ["https://..."],
      "votes": 150,
      "rank": 3,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "nextCursor": "cursor_abc123"
}
```

### POST /api/v1/contests/submissions/:submissionId/vote
Vote on a contest submission.

**Request Body:**
```json
{
  "voteType": "UPVOTE"
}
```

**Response:**
```json
{
  "success": true,
  "newVoteCount": 151
}
```

**WebSocket Event:**
```json
{
  "event": "vote_update",
  "data": {
    "submissionId": "sub_123",
    "votes": 151
  }
}
```

## 2. Shorts Feed API

### GET /api/v1/shorts/feed
Fetch shorts based on feed type.

**Query Parameters:**
- `type`: `discover` (For You) or `admiring` (Following)
- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "items": [
    {
      "id": "short_123",
      "creator": {
        "id": "user_456",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "https://..."
      },
      "videoUrl": "https://...",
      "caption": "Check this out!",
      "musicTrack": "Song Name - Artist",
      "likesCount": 1250,
      "commentsCount": 45,
      "isLiked": false,
      "isLocked": false,
      "requiredTier": null,
      "linkedProduct": {
        "id": "prod_789",
        "title": "Cool Product",
        "priceKr": 500,
        "imageUrl": "https://..."
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "nextCursor": "cursor_xyz"
}
```

**Feed Logic:**
- **Discover (For You):** Users NOT in admiring list + algorithm-based recommendations
- **Admiring (Following):** Only users in admiring list, sorted by recent

## 3. Drips Feed API

### GET /api/v1/posts/feed
Fetch Instagram-like posts (text, image, text+image).

**Query Parameters:**
- `cursor` (optional): Pagination cursor
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "items": [
    {
      "id": "post_123",
      "creator": {
        "id": "user_456",
        "username": "johndoe",
        "displayName": "John Doe",
        "avatarUrl": "https://..."
      },
      "caption": "Beautiful sunset today!",
      "imageUrls": ["https://...", "https://..."],
      "likesCount": 523,
      "commentsCount": 34,
      "isLiked": true,
      "isLocked": false,
      "requiredTier": null,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "nextCursor": "cursor_abc"
}
```

## 4. Video Upload & Streaming

### POST /api/v1/media/upload-signature
Get Cloudinary signature for video upload.

**Request Body:**
```json
{
  "folder": "shorts",
  "resourceType": "video"
}
```

**Response:**
```json
{
  "signature": "abc123...",
  "timestamp": 1705320000,
  "assetFolder": "shorts",
  "resourceType": "video",
  "apiKey": "123456789",
  "cloudName": "runinga",
  "uploadPreset": "runinga_videos"
}
```

**Video Processing:**
- Accept formats: MP4, MOV, AVI
- Max size: 100MB
- Auto-transcode to H.264
- Generate thumbnails
- Create adaptive bitrate versions (360p, 480p, 720p, 1080p)

## 5. WebSocket Real-Time Updates

### Connection
```
wss://api.runinga.com/socket.io/?EIO=4&transport=websocket
```

### Authentication
```json
["authenticate", {"token": "jwt_token_here"}]
```

### Events

#### vote_update
Broadcast when submission receives a vote.
```json
{
  "event": "vote_update",
  "data": {
    "submissionId": "sub_123",
    "votes": 151,
    "userId": "user_789"
  }
}
```

#### contest_update
Broadcast when contest status changes.
```json
{
  "event": "contest_update",
  "data": {
    "contestId": "contest_123",
    "status": "JUDGING",
    "participantsCount": 250
  }
}
```

#### like_update
Broadcast when content receives a like.
```json
{
  "event": "like_update",
  "data": {
    "contentId": "short_123",
    "contentType": "SHORT",
    "likesCount": 1251
  }
}
```

## 6. Database Schema

### contest_submissions
```sql
CREATE TABLE contest_submissions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  contest_id UUID NOT NULL REFERENCES contests(id),
  media_url TEXT NOT NULL,
  media_type VARCHAR(10) NOT NULL,
  caption TEXT,
  proof_screenshots TEXT[],
  votes INT DEFAULT 0,
  downvotes INT DEFAULT 0,
  rank INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_submissions_contest ON contest_submissions(contest_id);
CREATE INDEX idx_submissions_votes ON contest_submissions(votes DESC);
CREATE INDEX idx_submissions_created ON contest_submissions(created_at DESC);
```

### contest_votes
```sql
CREATE TABLE contest_votes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  submission_id UUID NOT NULL REFERENCES contest_submissions(id),
  vote_type VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, submission_id)
);

CREATE INDEX idx_votes_submission ON contest_votes(submission_id);
CREATE INDEX idx_votes_user ON contest_votes(user_id);
```

### shorts
```sql
CREATE TABLE shorts (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id),
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  music_track TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  required_tier VARCHAR(50),
  linked_product_id UUID REFERENCES products(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shorts_creator ON shorts(creator_id);
CREATE INDEX idx_shorts_created ON shorts(created_at DESC);
CREATE INDEX idx_shorts_likes ON shorts(likes_count DESC);
```

### posts (Drips)
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id),
  caption TEXT,
  image_urls TEXT[],
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  is_locked BOOLEAN DEFAULT FALSE,
  required_tier VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_posts_creator ON posts(creator_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
```

## 7. Redis Caching Strategy

### Vote Counts
```
Key: vote:submission:{submissionId}
TTL: 10 seconds
Value: vote count
```

### Feed Cache
```
Key: feed:shorts:{type}:{cursor}
TTL: 30 seconds
Value: JSON array of shorts
```

### User Admiring List
```
Key: admiring:{userId}
TTL: 5 minutes
Value: Set of user IDs
```

## 8. Rate Limiting

### Voting
- 100 votes per hour per user
- 1 vote per submission per user

### Feed Requests
- 1000 requests per hour per user
- Burst: 50 requests per minute

### Video Upload
- 10 uploads per hour per user
- Max file size: 100MB

## 9. Security

### Authentication
- JWT tokens required for all endpoints
- Token refresh every 15 minutes
- WebSocket authentication on connect

### Validation
- Verify contest is active before voting
- Verify user hasn't already voted
- Verify video format and size
- Sanitize all user input

### Content Moderation
- Auto-flag explicit content
- Manual review queue
- User reporting system
- Ban/suspend capabilities

## 10. Performance Optimization

### Video Delivery
- Use CDN for video streaming
- Adaptive bitrate streaming
- Preload next video in feed
- Cache thumbnails aggressively

### Database
- Partition large tables by date
- Use read replicas for feeds
- Index all foreign keys
- Regular VACUUM and ANALYZE

### Caching
- Cache hot content (trending)
- Cache user preferences
- Cache feed results
- Invalidate on updates

## 11. Monitoring & Alerts

### Metrics to Track
- Video upload success rate
- WebSocket connection stability
- Feed load times
- Vote processing latency
- Cache hit rates

### Alerts
- High error rates (>5%)
- Slow queries (>1s)
- WebSocket disconnections (>10%)
- Storage usage (>80%)
- Rate limit violations

## 12. Testing Checklist

- [ ] Contest submission feed loads correctly
- [ ] Voting updates in real-time via WebSocket
- [ ] Discover feed shows non-admiring users
- [ ] Admiring feed shows only admiring users
- [ ] Drips feed shows text/image posts
- [ ] Video upload and transcoding works
- [ ] Video playback is smooth
- [ ] Pagination works correctly
- [ ] Rate limiting prevents abuse
- [ ] WebSocket reconnects automatically
- [ ] Cache invalidation works
- [ ] Real-time updates are instant

## 13. Deployment Steps

1. Update database schema
2. Deploy Redis cache
3. Configure Cloudinary video settings
4. Deploy backend API
5. Test WebSocket connections
6. Enable CDN for videos
7. Monitor error rates
8. Gradual rollout to users

## 14. API Response Times (SLA)

- Feed endpoints: <500ms
- Vote endpoints: <200ms
- Video upload signature: <100ms
- WebSocket latency: <50ms
- Real-time updates: <100ms

## 15. Scalability Considerations

- Horizontal scaling for API servers
- Database sharding by user ID
- Redis cluster for caching
- CDN for global video delivery
- Load balancer for WebSocket connections
- Queue system for video processing
