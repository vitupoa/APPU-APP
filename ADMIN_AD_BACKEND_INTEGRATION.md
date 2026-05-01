# Admin Ad Management Backend Integration

## Overview
Complete backend integration for admin ad management system with persistent configuration, real-time updates, and database-backed state management.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Dashboard (Kotlin)                  │
│  - AdminAdManagementScreen.kt                               │
│  - AdManagementViewModel.kt                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Repository Layer (Kotlin)                       │
│  - AdManagementRepositoryImpl.kt                            │
│  - HTTP Client (Ktor)                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ REST API
┌─────────────────────────────────────────────────────────────┐
│                Backend API (Node.js/Express)                 │
│  - /api/v1/admin/ads/* routes                               │
│  - adManagement.routes.ts                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Service Layer (TypeScript)                      │
│  - AdManagementService                                      │
│  - Business logic & validation                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                           │
│  - ad_config (singleton config)                             │
│  - ad_campaigns                                             │
│  - sponsored_post_requests                                  │
│  - ad_analytics                                             │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### ad_config Table (Singleton)
```sql
CREATE TABLE ad_config (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  platform_cut_percentage DECIMAL(5, 2) DEFAULT 15.0,
  
  -- Native Ad Config
  native_ad_min_cpm DECIMAL(10, 2) DEFAULT 40.0,
  native_ad_max_cpm DECIMAL(10, 2) DEFAULT 150.0,
  native_ad_frequency INT DEFAULT 6,
  
  -- Banner Ad Config
  banner_ad_min_cpm DECIMAL(10, 2) DEFAULT 30.0,
  banner_ad_max_cpm DECIMAL(10, 2) DEFAULT 100.0,
  banner_ad_frequency INT DEFAULT 15,
  
  -- Story Ad Config
  story_ad_min_cpm DECIMAL(10, 2) DEFAULT 80.0,
  story_ad_max_cpm DECIMAL(10, 2) DEFAULT 200.0,
  story_ad_frequency INT DEFAULT 20,
  
  -- Global Controls
  ads_enabled BOOLEAN DEFAULT true,
  max_ad_load_enabled BOOLEAN DEFAULT false,
  
  updated_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features:**
- Single row with fixed UUID ensures singleton pattern
- All changes update the same row
- Changes persist across server restarts
- Immediate effect on all API calls

## API Endpoints

### Configuration Management

#### GET /api/v1/admin/ads/config
Get current ad configuration (persisted in database).

**Response:**
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "platform_cut_percentage": 15.0,
  "native_ad_min_cpm": 40.0,
  "native_ad_max_cpm": 150.0,
  "native_ad_frequency": 6,
  "banner_ad_min_cpm": 30.0,
  "banner_ad_max_cpm": 100.0,
  "banner_ad_frequency": 15,
  "story_ad_min_cpm": 80.0,
  "story_ad_max_cpm": 200.0,
  "story_ad_frequency": 20,
  "ads_enabled": true,
  "max_ad_load_enabled": false,
  "updated_by": "admin-user-id",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### PUT /api/v1/admin/ads/config/platform-cut
Update platform revenue split percentage.

**Request:**
```json
{
  "percentage": 15.0
}
```

**Validation:**
- Must be between 1% and 50%
- Immediately updates database
- Returns updated config

#### PUT /api/v1/admin/ads/config/native-pricing
Update native ad CPM pricing range.

**Request:**
```json
{
  "minCpm": 40.0,
  "maxCpm": 150.0
}
```

**Validation:**
- minCpm must be less than maxCpm
- Updates take effect immediately for new campaigns

#### PUT /api/v1/admin/ads/config/native-frequency
Update how often native ads appear in feed.

**Request:**
```json
{
  "frequency": 6
}
```

**Validation:**
- Must be between 3 and 20
- Affects DripsScreen ad insertion logic

### Campaign Management

#### GET /api/v1/admin/ads/campaigns
Get all ad campaigns with filters.

**Query Parameters:**
- `status`: PENDING | APPROVED | ACTIVE | PAUSED | COMPLETED | REJECTED
- `brandId`: Filter by brand user ID
- `adType`: NATIVE | BANNER | STORY
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "campaigns": [
    {
      "id": "campaign-uuid",
      "brand_id": "brand-user-id",
      "brand_username": "brandname",
      "brand_name": "Brand Display Name",
      "campaign_name": "Summer Sale 2024",
      "ad_type": "NATIVE",
      "budget_kes": 50000.0,
      "spent_kes": 12500.0,
      "cpm_bid": 120.0,
      "status": "ACTIVE",
      "impressions": 104166,
      "clicks": 2083,
      "conversions": 104,
      "start_date": "2024-01-01T00:00:00Z",
      "end_date": "2024-03-31T23:59:59Z",
      "created_at": "2023-12-15T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20
}
```

#### POST /api/v1/admin/ads/campaigns/:id/approve
Approve pending campaign.

**Effect:**
- Changes status from PENDING → APPROVED
- Campaign becomes eligible to run
- Records admin ID and approval timestamp

#### POST /api/v1/admin/ads/campaigns/:id/reject
Reject pending campaign.

**Request:**
```json
{
  "reason": "Budget too low for target audience"
}
```

**Effect:**
- Changes status to REJECTED
- Stores rejection reason
- Notifies brand user

### Sponsored Post Management

#### GET /api/v1/admin/ads/sponsored-posts
Get all sponsored post requests.

**Query Parameters:**
- `status`: PENDING | ACCEPTED | IN_PROGRESS | SUBMITTED | APPROVED | PAYMENT_RELEASED
- `brandId`: Filter by brand
- `creatorId`: Filter by creator
- `page`, `limit`: Pagination

#### POST /api/v1/admin/ads/sponsored-posts/:id/verify
Verify submitted sponsored content.

**Effect:**
- Changes status from SUBMITTED → APPROVED
- Content meets brand requirements
- Ready for payment release

#### POST /api/v1/admin/ads/sponsored-posts/:id/release-payment
Release payment to creator (85% split).

**Effect:**
- Credits creator wallet with 85% of total payment
- Platform keeps 15% fee
- Creates transaction record
- Changes status to PAYMENT_RELEASED
- Transaction is atomic (all or nothing)

**Example:**
```
Total Payment: KES 5,000
Creator Gets: KES 4,250 (85%)
Platform Fee: KES 750 (15%)
```

### Analytics

#### GET /api/v1/admin/ads/analytics
Get analytics for date range.

**Query Parameters:**
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response:**
```json
{
  "analytics": [
    {
      "date": "2024-01-15",
      "total_ad_spend_kes": 125000.0,
      "platform_revenue_kes": 18750.0,
      "creator_revenue_kes": 106250.0,
      "active_campaigns": 12,
      "total_impressions": 1041666,
      "total_clicks": 20833,
      "total_conversions": 1041,
      "native_impressions": 520833,
      "banner_impressions": 347222,
      "story_impressions": 173611
    }
  ],
  "totals": {
    "totalAdSpend": 3750000.0,
    "platformRevenue": 562500.0,
    "creatorRevenue": 3187500.0,
    "totalImpressions": 31250000,
    "totalClicks": 625000,
    "totalConversions": 31250
  }
}
```

## How Changes Persist

### 1. Configuration Changes
```typescript
// Admin updates platform cut to 12%
PUT /api/v1/admin/ads/config/platform-cut
{ "percentage": 12.0 }

// Backend updates database
UPDATE ad_config 
SET platform_cut_percentage = 12.0, 
    updated_by = 'admin-user-id', 
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001'

// All subsequent API calls read from database
SELECT * FROM ad_config WHERE id = '00000000-0000-0000-0000-000000000001'
// Returns: { platform_cut_percentage: 12.0, ... }
```

### 2. Real-Time Effect on App

**DripsScreen reads config on load:**
```kotlin
// DripsScreen.kt
LaunchedEffect(Unit) {
    val config = repository.getAdConfig()
    // Uses config.nativeAdFrequency for ad insertion
    // Every 6 posts (or whatever admin set)
}
```

**Ad insertion logic:**
```kotlin
items(posts.size + adSlots.size) { index ->
    val config = viewModel.adConfig.value
    
    // Check if this index should show an ad
    if (index % config.nativeAdFrequency == 0) {
        NativeAdCard(...)
    } else if (index % config.bannerAdFrequency == 0) {
        BannerAdCard(...)
    } else {
        PostCard(posts[actualIndex])
    }
}
```

### 3. Campaign Approval Flow

```
1. Brand creates campaign → Status: PENDING
2. Admin reviews in dashboard
3. Admin clicks "Approve" → API call
4. Backend updates: status = APPROVED, approved_at = NOW()
5. Campaign becomes active at start_date
6. Ads appear in user feeds based on targeting
7. Impressions/clicks tracked in real-time
8. Budget decremented with each impression
9. Campaign auto-pauses when budget exhausted
```

### 4. Sponsored Post Payment Flow

```
1. Brand requests sponsored post from creator
2. Creator accepts → Status: ACCEPTED
3. Creator creates content → Status: IN_PROGRESS
4. Creator submits content → Status: SUBMITTED
5. Admin verifies content → Status: APPROVED
6. Admin releases payment → Status: PAYMENT_RELEASED

Payment Transaction (Atomic):
BEGIN TRANSACTION;
  -- Credit creator wallet
  UPDATE wallets 
  SET kr_balance = kr_balance + 4250.00
  WHERE user_id = 'creator-id';
  
  -- Create transaction record
  INSERT INTO transactions (user_id, type, amount_kr, status)
  VALUES ('creator-id', 'ad_revenue', 4250.00, 'completed');
  
  -- Update sponsored post
  UPDATE sponsored_post_requests
  SET status = 'PAYMENT_RELEASED', payment_released_at = NOW()
  WHERE id = 'post-id';
COMMIT;
```

## State Management Flow

### Frontend (Kotlin)
```kotlin
// ViewModel maintains state
class AdManagementViewModel(repository: AdManagementRepository) {
    private val _state = MutableStateFlow(State())
    val state: StateFlow<State> = _state.asStateFlow()
    
    // Load config from backend
    fun loadAdConfig() {
        repository.getAdConfig()
            .onSuccess { config -> _state.value = _state.value.copy(adConfig = config) }
    }
    
    // Update config
    fun updatePlatformCut(percentage: Double) {
        repository.updatePlatformCut(percentage)
            .onSuccess { loadAdConfig() } // Reload to get updated values
    }
}
```

### Backend (TypeScript)
```typescript
// Service reads from database
static async getAdConfig() {
  const result = await prisma.$queryRaw`
    SELECT * FROM ad_config 
    WHERE id = '00000000-0000-0000-0000-000000000001'
  `;
  return result[0]; // Always returns current config
}

// Service updates database
static async updatePlatformCut(percentage: number, adminId: string) {
  await prisma.$executeRaw`
    UPDATE ad_config 
    SET platform_cut_percentage = ${percentage}, 
        updated_by = ${adminId}, 
        updated_at = NOW()
    WHERE id = '00000000-0000-0000-0000-000000000001'
  `;
  return this.getAdConfig(); // Return updated config
}
```

## Testing Changes Persist

### Test 1: Platform Cut Update
```bash
# 1. Get current config
curl http://localhost:3000/api/v1/admin/ads/config

# 2. Update platform cut
curl -X PUT http://localhost:3000/api/v1/admin/ads/config/platform-cut \
  -H "Content-Type: application/json" \
  -d '{"percentage": 12.0}'

# 3. Restart server
# 4. Get config again - should still be 12%
curl http://localhost:3000/api/v1/admin/ads/config
```

### Test 2: Ad Frequency Update
```bash
# 1. Update native ad frequency to 10
curl -X PUT http://localhost:3000/api/v1/admin/ads/config/native-frequency \
  -H "Content-Type: application/json" \
  -d '{"frequency": 10}'

# 2. Open app, scroll Drips feed
# 3. Native ads should appear every 10 posts (not 6)
```

### Test 3: Campaign Approval
```bash
# 1. Create campaign (as brand user)
# 2. Check status - should be PENDING
# 3. Approve as admin
curl -X POST http://localhost:3000/api/v1/admin/ads/campaigns/{id}/approve

# 4. Check status - should be APPROVED
# 5. Campaign runs at scheduled time
```

## Security

### Authentication
- All admin endpoints require `authMiddleware`
- Additional `adminMiddleware` checks `user.isAdmin = true`
- Non-admin users get 403 Forbidden

### Authorization
```typescript
const adminMiddleware = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { isAdmin: true }
  });
  
  if (!user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};
```

### Audit Trail
- All config changes record `updated_by` (admin user ID)
- All config changes record `updated_at` timestamp
- Campaign approvals/rejections record admin ID
- Payment releases are atomic transactions

## Performance

### Database Indexes
```sql
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);
CREATE INDEX idx_sponsored_posts_status ON sponsored_post_requests(status);
CREATE INDEX idx_ad_analytics_date ON ad_analytics(date DESC);
```

### Caching Strategy
- Config is read frequently but updated rarely
- Consider Redis cache with TTL for config
- Invalidate cache on config updates

### Query Optimization
- Use pagination for campaigns/posts lists
- Aggregate analytics daily (not real-time)
- Use database views for complex analytics

## Deployment

### Migration
```bash
# Run migration to create tables
psql -U postgres -d krieta < backend/prisma/migrations/add_ad_config.sql

# Verify tables created
psql -U postgres -d krieta -c "\dt ad_*"
```

### Environment Variables
```env
# No additional env vars needed
# Uses existing DATABASE_URL
```

### Server Restart
```bash
# Changes persist across restarts
# No in-memory state
# All state in PostgreSQL
```

## Summary

✅ **Admin changes persist in PostgreSQL database**
✅ **Changes survive server restarts**
✅ **Real-time effect on app behavior**
✅ **Atomic transactions for payments**
✅ **Audit trail for all changes**
✅ **Secure admin-only access**
✅ **Optimized with indexes**
✅ **RESTful API design**
✅ **Type-safe Kotlin client**
✅ **Comprehensive error handling**
