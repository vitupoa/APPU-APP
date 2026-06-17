# Time Filter Analysis - All Feeds in Krieta App

## Summary: Time Filters Across All Content Types

| Feed Type | Time Filter | Location | Issue Status |
|-----------|-------------|----------|--------------|
| **Shorts - Discover** | ❌ None | `shorts.service.ts` | ✅ Fixed (removed 14-day filter) |
| **Shorts - Lovers** | ✅ 24 hours | `shorts.service.ts` | ✅ Working correctly |
| **Shorts - Admiring** | ✅ 7 days | `shorts.service.ts` | ✅ Working correctly |
| **Drips/Posts - Trending** | ⚠️ 24 hours | `feed.service.ts` | ⚠️ May block new users |
| **Drips/Posts - Guest Feed** | ⚠️ 7 days | `feed.service.ts` | ⚠️ May block new users |
| **Drips/Posts - Main Feed** | ❌ None | `feed.service.ts` | ✅ Working (personalized) |
| **Contests - Submissions** | ❌ None | `contests.service.ts` | ✅ Working correctly |

---

## Detailed Analysis

### 1. Shorts Feed (shorts.service.ts)

#### Discover Tab ✅ FIXED
```typescript
// NO time filter - shows all content
whereClause.user_id = { notIn: [userId, ...admiringIds] };
orderByClause = [
  { likes_count: 'desc' },
  { views: 'desc' },
  { created_at: 'desc' }
];
```
- **Status**: ✅ Fixed - Removed 14-day filter
- **Impact**: New users can now see all available shorts

#### Lovers Tab ✅ OK
```typescript
// 24-hour filter
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
whereClause.created_at = { gte: oneDayAgo };
```
- **Status**: ✅ Working correctly
- **Purpose**: Keep mutual admirers engaged with fresh content
- **Risk**: Low - lovers are active users

#### Admiring Tab ✅ OK
```typescript
// 7-day filter
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
whereClause.created_at = { gte: sevenDaysAgo };
```
- **Status**: ✅ Working correctly
- **Purpose**: Balance between recent and relevant content
- **Risk**: Low - users see their own content + people they follow

---

### 2. Drips/Posts Feed (feed.service.ts)

#### Main Personalized Feed ✅ OK
```typescript
// No global time filter - personalized mix
// 40% from people you follow
// 30% similar interests
// 20% trending (24hr filter)
// 10% random
```
- **Status**: ✅ Working correctly
- **Mix**: Combines multiple sources with different time windows

#### Trending Posts Component ⚠️ RISK
```typescript
// Line 270-278
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

return prisma.post.findMany({
  where: {
    created_at: { gte: oneDayAgo },
    user: { country }
  },
  ...
});
```
- **Status**: ⚠️ Risk for new users or testing
- **Impact**: Trending posts component (20% of feed) uses 24hr filter
- **Recommendation**: Consider expanding to 7 days or removing filter

#### Guest Feed (Non-logged in users) ⚠️ RISK
```typescript
// Line 349-356
const posts = await prisma.$queryRaw`
  SELECT p.*
  FROM post p
  WHERE p.created_at >= NOW() - INTERVAL '7 days'
  AND p.likes_count > 5
  ORDER BY RANDOM()
  LIMIT ${limit + 1}
`;
```
- **Status**: ⚠️ Risk for new users or testing
- **Impact**: Guest users (not logged in) only see posts from last 7 days
- **Recommendation**: Consider expanding to 30 days or removing filter

---

### 3. Contest Submissions Feed (contests.service.ts)

#### Submissions Feed ✅ OK
```typescript
// Line 706-715
const submissions = await prisma.contest_submission.findMany({
  where: {
    Contest: { status: 'ACTIVE' }
  },
  orderBy: { submitted_at: 'desc' }
});
```
- **Status**: ✅ No time filter
- **Filter**: Only shows submissions from ACTIVE contests
- **Impact**: All submissions from active contests are visible

---

## Recommendations

### High Priority Fixes ⚠️

1. **Drips/Posts - Guest Feed (7-day filter)**
   - **Issue**: New users visiting without login may see empty feed
   - **Fix**: Expand to 30 days or remove filter
   - **File**: `feed.service.ts` line 349-356

2. **Drips/Posts - Trending Component (24-hour filter)**
   - **Issue**: Trending section may be empty for new apps or low-traffic times
   - **Fix**: Expand to 7 days
   - **File**: `feed.service.ts` line 270-278

### Recommended Time Windows

Based on content type and user engagement patterns:

| Feed | Recommended Window | Reasoning |
|------|-------------------|-----------|
| Shorts - Discover | All time | Maximum content discovery, engagement-sorted |
| Shorts - Lovers | 24 hours | High-engagement mutual relationships need freshness |
| Shorts - Admiring | 7 days | Balance between recent and available content |
| Posts - Trending | 7 days | Better than 24hrs for low-traffic periods |
| Posts - Guest | 30 days | Give new visitors more content to explore |
| Posts - Main Feed | Mixed | Personalized mix works well |
| Contests | Active only | Correct - only show active contests |

---

## Proposed Fixes

### Fix 1: Expand Guest Feed to 30 Days
**File**: `feed.service.ts` line 349-356

```typescript
// BEFORE (7 days):
WHERE p.created_at >= NOW() - INTERVAL '7 days'

// AFTER (30 days):
WHERE p.created_at >= NOW() - INTERVAL '30 days'
```

### Fix 2: Expand Trending Posts to 7 Days
**File**: `feed.service.ts` line 270

```typescript
// BEFORE:
const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

// AFTER:
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
```

### Fix 3: Alternative - Remove Trending Filter Entirely
If you want maximum content availability:

```typescript
// Remove time filter, rely on engagement sorting only
return prisma.post.findMany({
  where: {
    user: { country }
    // No time filter
  },
  orderBy: [
    { likes_count: 'desc' },
    { comments_count: 'desc' },
    { created_at: 'desc' }
  ]
});
```

---

## Testing Recommendations

### Test Scenario 1: New User Experience
1. Create brand new user account
2. Don't admire anyone
3. Check all tabs:
   - ✅ Shorts Discover: Should show content
   - ✅ Drips/Posts Main Feed: Should show personalized mix
   - ⚠️ Guest mode Drips: May be empty if all posts > 7 days old

### Test Scenario 2: Low Activity Period
1. Don't post anything new for 48 hours
2. Check trending sections:
   - ⚠️ Posts Trending: May be empty (24hr filter)
   - ✅ Shorts Discover: Still shows content

### Test Scenario 3: Testing Environment
1. Import old test data
2. Check if feeds populate correctly
3. Verify all time filters allow data discovery

---

## Conclusion

**Currently Working**:
- ✅ Shorts Discover (fixed)
- ✅ Shorts Lovers & Admiring
- ✅ Posts Main Feed (personalized)
- ✅ Contests Feed

**Needs Attention**:
- ⚠️ Posts Guest Feed (7-day filter too restrictive)
- ⚠️ Posts Trending Component (24-hour filter too restrictive)

**Recommendation**: Apply Fix 1 and Fix 2 above to ensure new users and testing environments always have content to display.
