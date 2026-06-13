# Shorts Feed Logic Fix - CORRECTED

## Issues Identified and Fixed

### 1. Lovers Tab Issue
**Problem**: Showing people who are not mutual admirers (lovers)

**Root Cause**: The query was using OR condition checking both directions of the admire relationship

**Fix**: Query only where the user is the admirer with `is_lovers: true`:
```typescript
// CORRECT - Only get records where I am the admirer and it's a lover relationship
where: { admirer_id: userId, is_lovers: true }
```

**Why This Works**: When two users mutually admire each other, BOTH directional records get `is_lovers: true`. So querying where I am the admirer with `is_lovers: true` returns all my mutual lovers.

### 2. Admiring Tab Optimization
**Problem**: Inefficient query with multiple database calls to separate lovers

**Fix**: Single query that filters using the `is_lovers` field:
```typescript
// CORRECT - Get all admires and filter in one query
const admiringList = await prisma.admires.findMany({
  where: { admirer_id: userId },
  select: { admired_id: true, is_lovers: true }
});

const nonMutualIds = admiringList
  .filter(a => !a.is_lovers)
  .map(a => a.admired_id);
```

### 3. Discover Tab Logic - CORRECTED
**Correct Behavior**: 
- If someone admires YOU but you DON'T admire them back → They are a **stranger/stalker** from your perspective
- Their shorts **SHOULD appear** in your Discover tab
- Discover should only exclude: Your own shorts + People YOU are admiring

**Implementation**:
```typescript
// CORRECT - Only exclude people YOU are admiring
const admiringList = await prisma.admires.findMany({
  where: { admirer_id: userId },
  select: { admired_id: true }
});
const admiringIds = admiringList.map(a => a.admired_id);
whereClause.user_id = { notIn: [userId, ...admiringIds] };
```

**Why This Works**: From the user's perspective, they only care about people THEY have chosen to follow/admire. Anyone else (including stalkers) are strangers and should appear in Discover.

## Feed Definitions (CORRECTED)

### Lovers Tab
Shows shorts ONLY from mutual admirers:
- Records where `admirer_id = userId` AND `is_lovers = true`
- This represents people you admire who also admire you back
- **Mutual relationship required**

### Admiring Tab  
Shows shorts from:
- Your own shorts (`user_id = userId`)
- People you admire who are NOT lovers (`admirer_id = userId` AND `is_lovers = false`)
- **One-way admire: YOU → THEM (but not mutual)**

### Discover Tab
Shows shorts from everyone except:
- Your own shorts
- People YOU are admiring (both lovers and non-mutual)
- **✅ Includes people who admire YOU but you don't admire back (strangers/stalkers)**
- **✅ Includes complete strangers with no admire relationship at all**

## Important Distinction: "Stranger" Definition

From a user's perspective, a **stranger** is anyone THEY haven't chosen to admire:
- ✅ Complete strangers (no relationship) → Discover
- ✅ People who admire them but they don't admire back (stalkers) → Discover
- ❌ People they admire (one-way) → Admiring Tab
- ❌ People they mutually admire → Lovers Tab

## Database Schema Context

```sql
model admires {
  id         String  @id
  admirer_id String  -- Person doing the admiring
  admired_id String  -- Person being admired
  is_lovers  Boolean @default(false)
  created_at DateTime @default(now())
  
  @@unique([admirer_id, admired_id])
}
```

**Key Rules**:
1. Each direction of an admire relationship has its own record
2. When mutual, BOTH records get `is_lovers: true`
3. To get people I admire: `admirer_id = myUserId`
4. To get people admiring me: `admired_id = myUserId`
5. To get lovers: `admirer_id = myUserId AND is_lovers = true`

## Testing Scenarios

### Lovers Tab Tests
- ✅ If A admires B AND B admires A (mutual) → B's shorts appear in A's Lovers tab
- ❌ If A admires B BUT B doesn't admire A → B's shorts should NOT appear in A's Lovers tab

### Discover Tab Tests
- ❌ If A admires B → B's shorts should NOT appear in A's Discover tab
- ✅ If B admires A (but A doesn't admire B) → B's shorts SHOULD appear in A's Discover tab (stalker)
- ✅ If C has no relationship with A → C's shorts SHOULD appear in A's Discover tab (stranger)

### Admiring Tab Tests
- ✅ A should see their own shorts
- ✅ If A admires B (not mutual) → B's shorts should appear in A's Admiring tab
- ❌ If A admires B (mutual/lovers) → B's shorts should NOT appear in A's Admiring tab (they're in Lovers)
