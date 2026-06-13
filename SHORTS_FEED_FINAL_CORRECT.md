# Shorts Feed Logic - FINAL CORRECT IMPLEMENTATION

## Correct Feed Definitions

### Lovers Tab
**Shows ONLY mutual admirers:**
- People where YOU admire them AND they admire you back
- Both directional `admires` records have `is_lovers: true`
- Query: `WHERE admirer_id = userId AND is_lovers = true`

### Admiring Tab  
**Shows ONLY one-way admirers (you → them):**
- People YOU admire who DON'T admire you back
- Query: `WHERE admirer_id = userId AND is_lovers = false`
- ❌ Does NOT include your own shorts
- ❌ Does NOT include lovers (they're in Lovers tab)

### Discover Tab
**Shows everyone else:**
- ✅ Complete strangers (no admire relationship)
- ✅ People who admire YOU but you don't admire back
- ❌ Excludes your own shorts
- ❌ Excludes anyone YOU admire (both lovers and one-way)

## Implementation Details

### Database Query Logic

**Lovers Tab:**
```typescript
const loversList = await prisma.admires.findMany({
  where: { admirer_id: userId, is_lovers: true },
  select: { admired_id: true }
});
const loversIds = loversList.map(a => a.admired_id);
whereClause.user_id = { in: loversIds };
```

**Admiring Tab:**
```typescript
const admiringList = await prisma.admires.findMany({
  where: { admirer_id: userId },
  select: { admired_id: true, is_lovers: true }
});

// Filter out lovers - only one-way admirers
const nonMutualIds = admiringList
  .filter(a => !a.is_lovers)
  .map(a => a.admired_id);

// IMPORTANT: No own shorts included
whereClause.user_id = { in: nonMutualIds };
```

**Discover Tab:**
```typescript
const admiringList = await prisma.admires.findMany({
  where: { admirer_id: userId },
  select: { admired_id: true }
});
const admiringIds = admiringList.map(a => a.admired_id);

// Exclude own shorts and anyone you admire
whereClause.user_id = { notIn: [userId, ...admiringIds] };
```

## Key Changes Made

### Issue 1: Admiring Tab Showing Own Shorts
**Problem:** Admiring tab was including `userId` in the results
```typescript
// WRONG
const includeIds = [userId, ...nonMutualIds];
whereClause.user_id = { in: includeIds };
```

**Fixed:**
```typescript
// CORRECT - No own shorts
whereClause.user_id = { in: nonMutualIds };
```

### Issue 2: Admiring Tab Showing Lovers
**Problem:** Not filtering out `is_lovers: true` records

**Fixed:** Filter out records where `is_lovers: true`
```typescript
const nonMutualIds = admiringList
  .filter(a => !a.is_lovers)  // Exclude lovers
  .map(a => a.admired_id);
```

## Truth Table

| Scenario | You Admire Them | They Admire You | Lovers Tab | Admiring Tab | Discover Tab |
|----------|----------------|-----------------|------------|--------------|--------------|
| Mutual admirers | ✅ | ✅ | ✅ | ❌ | ❌ |
| You admire only | ✅ | ❌ | ❌ | ✅ | ❌ |
| They admire only | ❌ | ✅ | ❌ | ❌ | ✅ |
| No relationship | ❌ | ❌ | ❌ | ❌ | ✅ |
| Your own shorts | N/A | N/A | ❌ | ❌ | ❌ |

## Example Scenarios

### Scenario A: User A's Perspective

**Relationships:**
- A admires B (mutual) → `is_lovers: true`
- A admires C (one-way) → `is_lovers: false`
- D admires A (one-way) → A doesn't admire D
- E has no relationship with A

**What A sees in each tab:**
- **Lovers Tab:** B's shorts only
- **Admiring Tab:** C's shorts only  
- **Discover Tab:** D's shorts, E's shorts, and all other strangers

### Scenario B: Edge Cases

**Case 1: A admires no one**
- Lovers: Empty
- Admiring: Empty
- Discover: Everyone except A

**Case 2: Everyone is mutual with A**
- Lovers: Everyone A admires
- Admiring: Empty
- Discover: Only complete strangers

**Case 3: A admires everyone (all one-way)**
- Lovers: Empty
- Admiring: Everyone A admires
- Discover: Only people A doesn't admire

## Database Schema Reference

```sql
model admires {
  id         String  @id
  admirer_id String  -- Person doing the admiring
  admired_id String  -- Person being admired
  is_lovers  Boolean @default(false) -- TRUE when mutual
  created_at DateTime @default(now())
  
  @@unique([admirer_id, admired_id])
}
```

**Important Notes:**
1. Two records exist for mutual relationships (one for each direction)
2. Both records have `is_lovers: true` when mutual
3. Only the record where `admirer_id = myId` matters for queries
4. `is_lovers` flag eliminates need for reverse lookup

## Testing Checklist

- [ ] Lovers tab shows ONLY mutual admirers
- [ ] Admiring tab shows ONLY one-way admirers (you → them)
- [ ] Admiring tab does NOT show lovers
- [ ] Admiring tab does NOT show your own shorts
- [ ] Discover tab shows people who admire you but you don't admire back
- [ ] Discover tab shows complete strangers
- [ ] Discover tab does NOT show anyone you admire
- [ ] Discover tab does NOT show your own shorts
- [ ] No shorts appear in multiple tabs
- [ ] All shorts from all tabs + own shorts = complete shorts universe

## Summary

The correct implementation ensures:
1. **Lovers** = Mutual admirers only
2. **Admiring** = One-way admirers (you admire, they don't admire back)
3. **Discover** = Everyone else (strangers + stalkers)

Each tab is mutually exclusive with no overlap.
