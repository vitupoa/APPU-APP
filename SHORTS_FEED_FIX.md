# Shorts Feed Logic Fix

## Issues Identified

### 1. Lovers Tab Issue
**Problem**: Showing people who are not mutual admirers (lovers)

**Root Cause**: The query was using OR condition checking both directions of the admire relationship:
```typescript
// WRONG - This returns ANY record where user is involved AND is_lovers is true
where: {
  OR: [
    { admirer_id: userId, is_lovers: true },
    { admired_id: userId, is_lovers: true }
  ]
}
```

**Fix**: Query only where the user is the admirer with `is_lovers: true`:
```typescript
// CORRECT - Only get records where I am the admirer and it's a lover relationship
where: { admirer_id: userId, is_lovers: true }
```

**Why This Works**: When two users mutually admire each other, BOTH directional records get `is_lovers: true`. So querying where I am the admirer with `is_lovers: true` returns all my mutual lovers.

### 2. Discover Tab Issue
**Problem**: Showing shorts from people the user already admires and people who admire the user

**Root Cause**: The query only excluded people the user admires, but did NOT exclude people who admire the user back:
```typescript
// WRONG - Only excludes people YOU admire
const admiringIds = admiringList.map(a => a.admired_id);
whereClause.user_id = { notIn: [userId, ...admiringIds] };
```

**Fix**: Exclude BOTH people you admire AND people who admire you:
```typescript
// CORRECT - Exclude ALL admire relationships (both directions)
const admiringIds = admiringList.map(a => a.admired_id);
const admirersIds = admirersList.map(a => a.admirer_id);
const allAdmireRelationships = [...new Set([...admiringIds, ...admirersIds])];
whereClause.user_id = { notIn: [userId, ...allAdmireRelationships] };
```

**Why This Works**: Discover should only show strangers - people with NO admire relationship in either direction.

### 3. Admiring Tab Optimization
**Problem**: Inefficient query with multiple database calls to separate lovers

**Root Cause**: Making two separate queries to get admirers and then lovers, then filtering in code

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

**Why This Works**: Since `is_lovers` is already on the record, we can filter it directly without a second query.

## Feed Definitions (After Fix)

### Lovers Tab
Shows shorts ONLY from mutual admirers:
- Records where `admirer_id = userId` AND `is_lovers = true`
- This represents people you admire who also admire you back

### Admiring Tab  
Shows shorts from:
- Your own shorts (`user_id = userId`)
- People you admire who are NOT lovers (`admirer_id = userId` AND `is_lovers = false`)

### Discover Tab
Shows shorts from strangers:
- Excludes your own shorts
- Excludes anyone you admire (regardless of lover status)
- Excludes anyone who admires you (regardless of whether you admire them back)
- = Complete strangers with NO admire relationship

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

## Testing Recommendations

1. **Lovers Tab**: Should ONLY show shorts from people who are mutual admirers
   - If A admires B but B doesn't admire A → B's shorts should NOT appear in A's Lovers tab
   - If A admires B and B admires A → Both should see each other's shorts in Lovers tab

2. **Discover Tab**: Should ONLY show shorts from complete strangers
   - If A admires B → B's shorts should NOT appear in A's Discover tab
   - If B admires A (but A doesn't admire B) → B's shorts should NOT appear in A's Discover tab
   - If C has no relationship with A → C's shorts SHOULD appear in A's Discover tab

3. **Admiring Tab**: Should show own shorts + one-way admires
   - A should see their own shorts
   - If A admires B (not mutual) → B's shorts should appear in A's Admiring tab
   - If A admires B (mutual/lovers) → B's shorts should NOT appear in A's Admiring tab (they're in Lovers)
