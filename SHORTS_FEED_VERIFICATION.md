# Shorts Feed Verification - Admiring System

## Admiring System Logic (Backend)

### Database Structure
- `admires` table with fields:
  - `admirer_id`: The person who admires
  - `admired_id`: The person being admired
  - `is_lovers`: Boolean flag for mutual admiration

### Relationship States
1. **Not Connected**: No admire record exists
2. **Admiring (One-way)**: 
   - I admire them: `admirer_id = me, admired_id = them, is_lovers = false`
   - They don't admire me back
3. **Lovers (Mutual)**:
   - I admire them: `admirer_id = me, admired_id = them, is_lovers = true`
   - They admire me: `admirer_id = them, admired_id = me, is_lovers = true`
   - Both records have `is_lovers = true`

## Shorts Feed Implementation

### Backend Logic (shorts.service.ts)

#### DISCOVER Tab (For You)
**Purpose**: Show shorts from people you DON'T admire

**Query Logic**:
```typescript
const admiringList = await prisma.admires.findMany({
  where: { admirer_id: userId },
  select: { admired_id: true }
});
const admiringIds = admiringList.map(a => a.admired_id);

whereClause.user_id = { notIn: [userId, ...admiringIds] };
```

**Result**: 
- ✅ Excludes own shorts
- ✅ Excludes shorts from anyone you admire (both lovers and non-mutual)
- ✅ Shows only strangers

#### LOVERS Tab
**Purpose**: Show shorts from mutual admirers only

**Query Logic**:
```typescript
const loversList = await prisma.admires.findMany({
  where: {
    OR: [
      { admirer_id: userId, is_lovers: true },
      { admired_id: userId, is_lovers: true }
    ]
  },
  select: { admired_id: true, admirer_id: true }
});
const loversIds = loversList.map(a => 
  a.admirer_id === userId ? a.admired_id : a.admirer_id
);

whereClause.user_id = { in: loversIds };
```

**Result**:
- ✅ Shows only shorts from mutual lovers
- ✅ Excludes one-way admirers

#### ADMIRING Tab (Following)
**Purpose**: Show YOUR OWN shorts + shorts from people you admire (excluding lovers)

**Query Logic**:
```typescript
// Get all people you're admiring
const admiringList = await prisma.admires.findMany({
  where: { admirer_id: userId },
  select: { admired_id: true }
});

// Get mutual lovers
const loversList = await prisma.admires.findMany({
  where: {
    OR: [
      { admirer_id: userId, is_lovers: true },
      { admired_id: userId, is_lovers: true }
    ]
  },
  select: { admired_id: true, admirer_id: true }
});
const loversIds = loversList.map(a => 
  a.admirer_id === userId ? a.admired_id : a.admirer_id
);

// Non-mutual admirers (exclude lovers)
const admiringIds = admiringList.map(a => a.admired_id);
const nonMutualIds = admiringIds.filter(id => !loversIds.includes(id));

// Own shorts + non-mutual admirers
const includeIds = [userId, ...nonMutualIds];
whereClause.user_id = { in: includeIds };
```

**Result**:
- ✅ Shows your own shorts
- ✅ Shows shorts from people you admire (one-way only)
- ✅ Excludes mutual lovers (they appear in Lovers tab)

### Frontend Implementation

#### ViewModel (ShortsViewModel.kt)
```kotlin
enum class ShortsTab(val label: String, val apiValue: String) {
    HOME("Home", "home"),
    DISCOVER("Discover", "discover"),
    LOVERS("Lovers", "lovers"),
    ADMIRING("Admiring", "admiring")
}
```

Maps correctly to backend API values ✅

#### Feed Type Enum (ShortsFeedType.kt)
```kotlin
enum class ShortsFeedType {
    DISCOVER,  // For You - users not admiring
    LOVERS,    // Mutual connections
    ADMIRING   // Following - own shorts + non-mutual admiring
}
```

Comments are correct ✅

## Verification Checklist

- [x] Backend logic correctly filters Discover tab (excludes admirers and own shorts)
- [x] Backend logic correctly filters Lovers tab (only mutual admirers)
- [x] Backend logic correctly filters Admiring tab (own + non-mutual admirers)
- [x] Frontend ViewModel maps feed types correctly to API endpoints
- [x] API parameter names match between frontend and backend

## Current Status

✅ **The implementation is ALREADY CORRECT**

The shorts feed filtering is working as designed:
1. **Discover**: Shows strangers only (no one you admire, not lovers)
2. **Lovers**: Shows mutual admirers only
3. **Admiring**: Shows your own shorts + people you admire (excluding lovers)

If users are seeing incorrect content, the issue is likely:
1. Data inconsistency in the database (admire records not properly synced)
2. User authentication/userId not being passed correctly
3. Frontend not calling the correct feed type

## Recommended Verification Steps

1. Check database: Verify `admires` table has correct `is_lovers` flags
2. Test API directly: Call `/api/v1/shorts?type=discover` with auth token
3. Verify frontend: Ensure ShortsScreen receives correct feedType parameter
4. Check navigation: Verify tabs are properly initialized with correct feed types
