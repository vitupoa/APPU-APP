# Shorts Tabs Separation Guide

## Overview
The Home tab bottom navigation contains 4 tabs with **strictly separated** content to prevent any overlap:
1. **Contests** - Contest submissions
2. **Admiring** - Own shorts + one-way admirers
3. **Lovers** - Mutual admirers only
4. **Discover** - Everyone else

## Tab Definitions

### 1. ADMIRING Tab (Index 1)
**Shows:**
- ✅ Your own shorts
- ✅ Shorts from people you admire who DON'T admire you back (one-way relationship, `is_lovers: false`)

**Excludes:**
- ❌ Lovers (they go to Lovers tab)

**Backend Query:**
```typescript
// Get all people you're admiring
const admiringList = await prisma.admires.findMany({
  where: { admirer_id: userId },
  select: { admired_id: true, is_lovers: true }
});

// Filter out lovers - only one-way admirers
const nonMutualIds = admiringList
  .filter(a => !a.is_lovers)
  .map(a => a.admired_id);

// Include own shorts + non-mutual admirers
const includeIds = [userId, ...nonMutualIds];
whereClause.user_id = { in: includeIds };
```

### 2. LOVERS Tab (Index 2)
**Shows:**
- ✅ Only shorts from people where BOTH of you admire each other (`is_lovers: true`)

**Excludes:**
- ❌ One-way admirers (they appear in Admiring tab)
- ❌ Your own shorts

**Backend Query:**
```typescript
// Get mutual lovers - query where I am the admirer with is_lovers: true
const loversList = await prisma.admires.findMany({
  where: { admirer_id: userId, is_lovers: true },
  select: { admired_id: true }
});
const loversIds = loversList.map(a => a.admired_id);

whereClause.user_id = { in: loversIds };
```

**Key Insight:** When two users mutually admire each other, BOTH directional records get `is_lovers: true`. So querying where you are the admirer with `is_lovers: true` returns all your mutual lovers.

### 3. DISCOVER Tab (Index 3)
**Shows:**
- ✅ Complete strangers (no admire relationship in either direction)
- ✅ People who admire YOU but you don't admire back

**Excludes:**
- ❌ Your own shorts
- ❌ Anyone YOU admire (whether mutual or one-way)

**Backend Query:**
```typescript
// Get all people YOU are admiring
const admiringList = await prisma.admires.findMany({
  where: { admirer_id: userId },
  select: { admired_id: true }
});
const admiringIds = admiringList.map(a => a.admired_id);

// Exclude own shorts and anyone YOU are admiring
whereClause.user_id = { notIn: [userId, ...admiringIds] };
```

**Important:** Discover does NOT exclude people who admire you. This allows strangers and fans to appear in your feed.

## Separation Logic Matrix

| User Relationship | Admiring | Lovers | Discover |
|-------------------|----------|--------|----------|
| Own shorts | ✅ Yes | ❌ No | ❌ No |
| You admire them (one-way) | ✅ Yes | ❌ No | ❌ No |
| Mutual admirers (both ways) | ❌ No | ✅ Yes | ❌ No |
| They admire you (one-way) | ❌ No | ❌ No | ✅ Yes |
| Complete strangers | ❌ No | ❌ No | ✅ Yes |

## Database Schema

```sql
model admires {
  id         String   @id
  admirer_id String   -- Person doing the admiring
  admired_id String   -- Person being admired
  is_lovers  Boolean  @default(false)
  created_at DateTime @default(now())
  
  @@unique([admirer_id, admired_id])
}
```

**Relationship Rules:**
1. Each direction has its own record
2. When mutual, BOTH records get `is_lovers: true`
3. To get people I admire: `admirer_id = myUserId`
4. To get lovers: `admirer_id = myUserId AND is_lovers = true`
5. One-way admirers: `admirer_id = myUserId AND is_lovers = false`

## Frontend Implementation

### Tab Order (HomeScreen.kt)
```kotlin
private val tabs = listOf("Contests", "Admiring", "Lovers", "Discover")

when (selectedTab) {
    0 -> ContestSubmissionFeedScreen().Content()
    1 -> ShortsScreen(ShortsFeedType.ADMIRING).Content()
    2 -> ShortsScreen(ShortsFeedType.LOVERS).Content()
    3 -> ShortsScreen(ShortsFeedType.DISCOVER).Content()
}
```

### Enum Definition (ShortsFeedType.kt)
```kotlin
enum class ShortsFeedType {
    ADMIRING,  // Own shorts + people you admire who DON'T admire you back
    LOVERS,    // Only mutual admirers (both admire each other)
    DISCOVER   // Everyone else. Excludes own + anyone you admire
}
```

## Testing Checklist

### Admiring Tab Tests
- [ ] Shows your own shorts
- [ ] Shows shorts from people you admire (one-way)
- [ ] Does NOT show shorts from mutual lovers
- [ ] Does NOT show shorts from strangers

### Lovers Tab Tests
- [ ] ONLY shows shorts from mutual admirers
- [ ] If A admires B but B doesn't admire A → B's shorts NOT in A's Lovers tab
- [ ] If A admires B and B admires A → Both see each other's shorts in Lovers tab
- [ ] Does NOT show own shorts

### Discover Tab Tests
- [ ] ONLY shows shorts from strangers and fans
- [ ] If A admires B → B's shorts NOT in A's Discover tab
- [ ] If B admires A (but A doesn't admire B) → B's shorts SHOULD appear in A's Discover tab
- [ ] If C has no relationship with A → C's shorts SHOULD appear in A's Discover tab
- [ ] Does NOT show own shorts

## Common Pitfalls

1. **Wrong Lovers Query**: Using OR condition checking both directions returns incorrect results
2. **Discover Excluding Fans**: Discover should INCLUDE people who admire you but you don't admire back
3. **Enum Order Mismatch**: Frontend enum order must match the switch statement in HomeScreen
4. **is_lovers Flag**: When mutual, BOTH directional records must have `is_lovers: true`

## Files Modified

### Backend
- `backend/src/modules/shorts/shorts.service.ts` - Feed filtering logic

### Frontend
- `composeApp/src/commonMain/kotlin/com/krieta/feature/shorts/presentation/viewmodel/ShortsFeedType.kt` - Enum order and docs
- `composeApp/src/commonMain/kotlin/com/krieta/feature/shorts/presentation/viewmodel/ShortsViewModel.kt` - Already correct
- `composeApp/src/commonMain/kotlin/com/krieta/feature/feed/presentation/screen/HomeScreen.kt` - Tab order and mapping
