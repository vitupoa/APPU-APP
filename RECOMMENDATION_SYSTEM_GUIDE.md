# RUNINGA RECOMMENDATION SYSTEM - IMPLEMENTATION GUIDE

## Overview
This document outlines the complete implementation of Runinga's  recommendation algorithm with matching system (not ranking), ensuring equal growth opportunity for all creators.

## Core Principles
1. **Matching System** - Not ranking-based, content matched to interested users
2. **Equal Opportunity** - 0 admirers = same chance as 1M+ admirers
3. **Test Audience** - Every video starts with 5K users (3K local + 2K global)
4. **Performance-Based Amplification** - Engagement determines reach, not follower count
5. **Randomized Delivery** - No two users see same content at same time
6. **Unique Views** - One view per user, rewatches don't inflate count

## Database Schema Changes Required

### 1. Add Content Distribution Tracking Table
```sql
CREATE TABLE content_distribution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id VARCHAR NOT NULL,
  content_type VARCHAR(10) NOT NULL, -- 'SHORT' or 'POST'
  distribution_tier INT DEFAULT 0, -- 0=TEST(5K), 1=TIER_1(10K), 2=TIER_2(50K), 3=TIER_3(500K), 4=VIRAL(Millions)
  current_audience_size INT DEFAULT 0,
  target_audience_size INT DEFAULT 5000,
  completion_rate DECIMAL(5,4) DEFAULT 0,
  like_rate DECIMAL(5,4) DEFAULT 0,
  share_rate DECIMAL(5,4) DEFAULT 0,
  comment_rate DECIMAL(5,4) DEFAULT 0,
  rewatch_rate DECIMAL(5,4) DEFAULT 0,
  engagement_score DECIMAL(5,4) DEFAULT 0,
  should_amplify BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_content_dist_content ON content_distribution(content_id, content_type);
CREATE INDEX idx_content_dist_tier ON content_distribution(distribution_tier);
CREATE INDEX idx_content_dist_amplify ON content_distribution(should_amplify);
```

### 2. Add User Content Delivery Table (Prevents Duplicate Delivery)
```sql
CREATE TABLE user_content_delivery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL,
  content_id VARCHAR NOT NULL,
  content_type VARCHAR(10) NOT NULL,
  delivered_at TIMESTAMP DEFAULT NOW(),
  viewed BOOLEAN DEFAULT false,
  view_duration INT DEFAULT 0, -- milliseconds
  completed BOOLEAN DEFAULT false,
  liked BOOLEAN DEFAULT false,
  shared BOOLEAN DEFAULT false,
  commented BOOLEAN DEFAULT false,
  rewatched_count INT DEFAULT 0,
  UNIQUE(user_id, content_id, content_type)
);

CREATE INDEX idx_user_delivery_user ON user_content_delivery(user_id);
CREATE INDEX idx_user_delivery_content ON user_content_delivery(content_id, content_type);
CREATE INDEX idx_user_delivery_viewed ON user_content_delivery(viewed);
```

### 3. Add User Interaction Signals Table
```sql
CREATE TABLE user_interaction_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL,
  content_id VARCHAR NOT NULL,
  content_type VARCHAR(10) NOT NULL,
  signal_type VARCHAR(20) NOT NULL, -- 'VIEW', 'LIKE', 'SHARE', 'COMMENT', 'REWATCH', 'SKIP', 'NOT_INTERESTED', 'HIDE'
  watch_duration INT DEFAULT 0,
  total_duration INT DEFAULT 0,
  weight DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_signals_user ON user_interaction_signals(user_id, created_at DESC);
CREATE INDEX idx_signals_content ON user_interaction_signals(content_id, content_type);
CREATE INDEX idx_signals_type ON user_interaction_signals(signal_type);
```

### 4. Add User Micro Interests Table
```sql
CREATE TABLE user_micro_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  keywords TEXT[], -- Array of related keywords
  affinity DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  last_engaged_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_micro_interests_user ON user_micro_interests(user_id);
CREATE INDEX idx_micro_interests_category ON user_micro_interests(category);
CREATE INDEX idx_micro_interests_affinity ON user_micro_interests(affinity DESC);
```

### 5. Add Trending Topics Table
```sql
CREATE TABLE trending_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic VARCHAR(100) NOT NULL UNIQUE,
  engagement_count INT DEFAULT 0,
  trending_score DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE INDEX idx_trending_score ON trending_topics(trending_score DESC);
CREATE INDEX idx_trending_active ON trending_topics(is_active);
```

## API Endpoints to Create

### 1. Feed Generation APIs

#### GET /api/v1/feed/discover
**Purpose**: Generate personalized Discover feed (algorithmic)
**Query Params**:
- `limit` (default: 20)
- `cursor` (for pagination)

**Response**:
```json
{
  "content": [
    {
      "id": "short_123",
      "type": "SHORT",
      "videoUrl": "...",
      "creator": {...},
      "isNew": true,
      "deliveryId": "delivery_456"
    }
  ],
  "nextCursor": "cursor_789",
  "composition": {
    "personalized": 12,
    "trending": 2,
    "discovery": 4,
    "admiring": 2
  }
}
```

#### GET /api/v1/feed/admiring
**Purpose**: Feed from creators user admires (99% unseen content)
**Query Params**:
- `limit` (default: 20)
- `cursor`

**Response**: Same structure as discover

#### GET /api/v1/feed/contests
**Purpose**: Randomized contest feed
**Query Params**:
- `limit` (default: 10)
- `cursor`

#### GET /api/v1/feed/live
**Purpose**: Randomized live stream feed
**Query Params**:
- `limit` (default: 20)
- `cursor`

### 2. Interaction Tracking APIs

#### POST /api/v1/interactions/track
**Purpose**: Track user interactions for algorithm learning
**Body**:
```json
{
  "deliveryId": "delivery_456",
  "contentId": "short_123",
  "contentType": "SHORT",
  "signalType": "VIEW",
  "watchDuration": 15000,
  "totalDuration": 30000
}
```

#### POST /api/v1/interactions/batch
**Purpose**: Batch track multiple interactions
**Body**:
```json
{
  "interactions": [...]
}
```

### 3. Content Distribution APIs

#### POST /api/v1/distribution/initialize
**Purpose**: Initialize distribution for new content
**Body**:
```json
{
  "contentId": "short_123",
  "contentType": "SHORT",
  "creatorId": "user_456",
  "hashtags": ["#fitness", "#workout"],
  "location": "Kenya"
}
```

**Response**:
```json
{
  "distributionId": "dist_789",
  "tier": 0,
  "targetAudienceSize": 5000,
  "localAudienceSize": 3000,
  "globalAudienceSize": 2000
}
```

#### POST /api/v1/distribution/evaluate
**Purpose**: Evaluate content performance and determine amplification
**Body**:
```json
{
  "contentId": "short_123",
  "contentType": "SHORT"
}
```

**Response**:
```json
{
  "currentTier": 0,
  "engagementScore": 1.25,
  "shouldAmplify": true,
  "nextTier": 1,
  "nextAudienceSize": 5000,
  "metrics": {
    "completionRate": 0.65,
    "likeRate": 0.12,
    "shareRate": 0.03,
    "commentRate": 0.05,
    "rewatchRate": 0.15
  }
}
```

## Background Jobs Required

### 1. Content Distribution Worker
**Frequency**: Every 5 minutes
**Purpose**: 
- Evaluate content performance
- Amplify high-performing content to next tier
- Deliver content to new audiences

### 2. Micro Interest Updater
**Frequency**: Every hour
**Purpose**:
- Analyze user interactions
- Update user micro-interests
- Calculate affinity scores

### 3. Trending Topics Analyzer
**Frequency**: Every 15 minutes
**Purpose**:
- Identify trending hashtags
- Calculate trending scores
- Expire old trends

### 4. Feed Pre-generation
**Frequency**: Continuous
**Purpose**:
- Pre-generate feeds for active users
- Cache feed results
- Reduce API latency

## Frontend Implementation

### 1. Full-Screen Immersive Player Component
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/feed/presentation/components/ImmersivePlayerNew.kt`

**Features**:
- Edge-to-edge video playback
- Hidden status bar
- Bottom overlay with creator info
- Gesture handlers (swipe, tap, double-tap, long-press)
- Auto-play and looping
- Preload next 2-3 videos
- Audio on by default
- Interaction tracking (view duration, likes, shares, comments)

**Gestures**:
- Swipe up: Next video
- Swipe down: Previous video
- Tap center: Pause/play
- Double-tap: Like
- Tap avatar: Go to creator profile
- Tap sound: View all videos with that sound
- Long press: Show options menu

### 2. Feed State Management
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/feed/presentation/viewmodel/FeedViewModel.kt`

**Responsibilities**:
- Fetch feed from API
- Track current video index
- Handle pagination
- Track user interactions
- Send interaction signals to backend

### 3. Interaction Tracker
**File**: `composeApp/src/commonMain/kotlin/com/runinga/feature/analytics/InteractionTracker.kt`

**Tracks**:
- View duration
- Completion rate
- Likes, shares, comments
- Rewatches
- Skips and "Not Interested"

## Backend Implementation

### 1. Content Distribution Service
**File**: `backend/src/modules/recommendation/services/contentDistribution.service.ts`

**Features**:
- Initialize distribution with 5K test audience (3K local + 2K global)
- Select audience based on:
  - 30% admirers (if any)
  - 40% similar interests
  - 20% demographic match
  - 10% random
- Evaluate performance after 2K+ views
- Amplify to next tier if engagement score >= threshold
- Tier progression: TEST(5K) → TIER_1(10K) → TIER_2(50K) → TIER_3(500K) → VIRAL(Millions)

### 2. Feed Generation Service
**File**: `backend/src/modules/recommendation/services/feedGeneration.service.ts`

**Features**:
- Generate Discover feed (60% personalized, 20% admiring, 10% trending, 10% discovery)
- Generate Admiring feed (99% unseen content from admired creators)
- Track user interactions
- Update micro-interests based on engagement

### 3. API Routes
**File**: `backend/src/modules/recommendation/recommendation.routes.ts`

**Endpoints**:
- `GET /api/v1/feed/discover` - Generate personalized Discover feed
- `GET /api/v1/feed/admiring` - Generate Admiring feed
- `POST /api/v1/interactions/track` - Track user interaction
- `POST /api/v1/distribution/initialize` - Initialize content distribution
- `POST /api/v1/distribution/evaluate` - Evaluate content performance

## Database Schema

All recommendation system tables are already defined in `backend/prisma/schema.prisma`:

- `ContentDistribution` - Track content distribution and amplification
- `UserContentDelivery` - Prevent duplicate delivery to same user
- `UserInteractionSignal` - Track user interactions for algorithm learning
- `UserMicroInterest` - Track user's micro-interests for precise matching
- `TrendingTopic` - Track trending topics for content resurfacing

## Implementation Status

✅ Database schema (already exists in schema.prisma)
✅ Backend services (contentDistribution.service.ts, feedGeneration.service.ts)
✅ API routes (recommendation.routes.ts)
✅ Frontend immersive player (ImmersivePlayerNew.kt)

## Next Steps

1. **Register API routes** in `backend/src/index.ts`:
```typescript
import recommendationRoutes from './modules/recommendation/recommendation.routes';
app.use('/api/v1', recommendationRoutes);
```

2. **Update FeedViewModel** to use new API endpoints
3. **Implement background workers** for:
   - Content distribution evaluation (every 5 minutes)
   - Micro-interest updates (every hour)
   - Trending topics analysis (every 15 minutes)
4. **Add interaction tracking** to video player
5. **Test with real data** and tune engagement thresholds

### Feed Generation Flow
```
1. User opens Discover/Admiring tab
   ↓
2. Backend checks user's micro-interests
   ↓
3. Generate feed composition:
   - 60% personalized (based on interests)
   - 20% admiring (from followed creators)
   - 10% trending
   - 10% discovery (small creators)
   ↓
4. Filter out already-seen content
   ↓
5. Randomize delivery order
   ↓
6. Return feed with unique content
```

## Implementation Priority

### Phase 1 (Week 1-2): Core Infrastructure
- [ ] Database schema changes
- [ ] Content distribution tracking
- [ ] User delivery tracking
- [ ] Interaction signals API

### Phase 2 (Week 3-4): Algorithm Implementation
- [ ] Recommendation algorithm service
- [ ] Audience selection service
- [ ] Feed generation service
- [ ] Distribution evaluation worker

### Phase 3 (Week 5-6): Frontend Integration
- [ ] Immersive player component
- [ ] Feed state management
- [ ] Interaction tracking
- [ ] Gesture handlers

### Phase 4 (Week 7-8): Optimization & Testing
- [ ] Performance optimization
- [ ] Caching layer
- [ ] A/B testing framework
- [ ] Analytics dashboard

## Key Metrics to Track

1. **Content Performance**
   - Completion rate
   - Like rate
   - Share rate
   - Comment rate
   - Rewatch rate

2. **User Engagement**
   - Session duration
   - Videos per session
   - Daily active users
   - Retention rate

3. **Creator Growth**
   - New admirers per video
   - Viral content percentage
   - Small creator reach
   - Content distribution fairness

4. **Algorithm Health**
   - Feed diversity score
   - Echo chamber prevention
   - Discovery rate
   - Amplification accuracy

## Testing Strategy

1. **Unit Tests**: Algorithm logic, audience selection
2. **Integration Tests**: API endpoints, database operations
3. **Load Tests**: Feed generation performance
4. **A/B Tests**: Algorithm variations
5. **User Tests**: Real user feedback on feed quality

## Files Created So Far

1. ✅ `backend/src/modules/recommendation/models/types.ts`
2. ✅ `backend/src/modules/recommendation/services/algorithm.service.ts`
3. ✅ `backend/src/modules/recommendation/services/audience.service.ts`

## Next Steps

1. Create feed generation service
2. Create distribution evaluation worker
3. Create interaction tracking APIs
4. Update Prisma schema with new tables
5. Create frontend immersive player
6. Implement gesture handlers
7. Create feed viewmodels
8. Add interaction tracking

This is a massive undertaking that requires careful implementation over several weeks. Would you like me to continue with specific components?
