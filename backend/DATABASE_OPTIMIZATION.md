# DATABASE OPTIMIZATION GUIDE

## Overview
This guide provides comprehensive database optimization strategies including proper indexing, query optimization, and performance monitoring.

## 1. Critical Indexes Already Implemented

### User Table
```prisma
@@index([admirersCount]) // For creator tier calculation
```

### Contest Tables
```prisma
// Contest
@@index([status, deadline])

// ContestVote
@@index([ipAddress])
@@index([fingerprint])
@@unique([submissionId, voterId])

// JudgeInvite
@@index([judgeId])
@@index([contestId])
@@index([status])
```

### Recommendation System
```prisma
// ContentDistribution
@@index([distributionTier])
@@index([shouldAmplify])
@@index([contentType, createdAt])

// UserContentDelivery
@@index([userId, deliveredAt])
@@index([contentId, contentType])
@@index([viewed])

// UserInteractionSignal
@@index([userId, createdAt])
@@index([contentId, contentType])
@@index([signalType])

// UserMicroInterest
@@index([userId])
@@index([category])
@@index([affinity])

// TrendingTopic
@@index([trendingScore])
@@index([isActive])
```

### Shop/Product Tables
```prisma
// Product
@@index([status, createdAt])
@@index([category, status])
@@index([sellerId, status])

// VehicleDetail
@@index([make, model])
@@index([bodyType])
@@index([year])

// ProductAnalytic
@@unique([productId, date])
```

### Analytics Tables
```prisma
// ContestAnalytics
@@unique([contestId, date])
@@index([date])

// CampaignAnalytics
@@unique([campaignId, date])
@@index([date])

// SalesFunnelEvent
@@index([userId, stage])
@@index([contestId, stage])
@@index([campaignId, stage])
@@index([createdAt])
```

## 2. Additional Recommended Indexes

Add these to `schema.prisma`:

```prisma
// Transaction - for wallet operations
model Transaction {
  // ... existing fields
  @@index([userId, type, createdAt])
  @@index([status, createdAt])
}

// Short - for feed queries
model Short {
  // ... existing fields
  @@index([userId, createdAt, isLocked])
  @@index([contestId, createdAt])
  @@index([views])
  @@index([likesCount])
}

// Post - for feed queries
model Post {
  // ... existing fields
  @@index([userId, createdAt, isLocked])
  @@index([likesCount])
}

// Wallet - for balance queries
model Wallet {
  // ... existing fields
  @@index([krBalance])
}

// ContestSubmission - for ranking
model ContestSubmission {
  // ... existing fields
  @@index([contestId, finalScore])
  @@index([contestId, votesCount])
  @@index([contestId, rank])
}

// Order - for shop queries
model Order {
  // ... existing fields
  @@index([buyerId, createdAt])
  @@index([status, createdAt])
}

// LiveStream - for discovery
model LiveStream {
  // ... existing fields
  @@index([status, viewerCount])
  @@index([category, status])
}

// Chama - for member queries
model Chama {
  // ... existing fields
  @@index([status, createdAt])
}

// ChamaMember - for rotation queries
model ChamaMember {
  // ... existing fields
  @@index([chamaId, rotationNumber])
  @@index([chamaId, status])
}
```

## 3. Query Optimization Patterns

### Pattern 1: Pagination with Cursor
```typescript
// GOOD: Use cursor-based pagination
const shorts = await prisma.short.findMany({
  where: { userId },
  take: 20,
  skip: 1,
  cursor: { id: lastShortId },
  orderBy: { createdAt: 'desc' },
});

// BAD: Avoid offset-based pagination for large datasets
const shorts = await prisma.short.findMany({
  where: { userId },
  take: 20,
  skip: 1000, // Slow for large offsets
  orderBy: { createdAt: 'desc' },
});
```

### Pattern 2: Select Only Required Fields
```typescript
// GOOD: Select specific fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    username: true,
    avatarUrl: true,
  },
});

// BAD: Select all fields
const users = await prisma.user.findMany();
```

### Pattern 3: Use Transactions for Consistency
```typescript
// GOOD: Use transaction for wallet operations
await prisma.$transaction(async (tx) => {
  await tx.wallet.update({
    where: { userId: senderId },
    data: { krBalance: { decrement: amount } },
  });
  
  await tx.wallet.update({
    where: { userId: recipientId },
    data: { krBalance: { increment: amount } },
  });
  
  await tx.transaction.create({
    data: { userId: senderId, type: 'tip_sent', amountKr: amount },
  });
});
```

### Pattern 4: Batch Operations
```typescript
// GOOD: Use createMany for bulk inserts
await prisma.userContentDelivery.createMany({
  data: contentIds.map(contentId => ({
    userId,
    contentId,
    contentType: 'SHORT',
  })),
  skipDuplicates: true,
});

// BAD: Individual creates in loop
for (const contentId of contentIds) {
  await prisma.userContentDelivery.create({
    data: { userId, contentId, contentType: 'SHORT' },
  });
}
```

### Pattern 5: Aggregate Queries
```typescript
// GOOD: Use aggregate for counts and sums
const stats = await prisma.transaction.aggregate({
  where: { userId, type: 'contest_prize' },
  _sum: { amountKr: true },
  _count: true,
});

// BAD: Fetch all and calculate in memory
const transactions = await prisma.transaction.findMany({
  where: { userId, type: 'contest_prize' },
});
const total = transactions.reduce((sum, t) => sum + t.amountKr, 0);
```

## 4. Connection Pooling

Configure in `database.ts`:

```typescript
import { PrismaClient } from '../generated/prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection pool settings (in DATABASE_URL)
// postgresql://user:password@host:5432/db?connection_limit=20&pool_timeout=10
```

## 5. Query Performance Monitoring

Add query logging middleware:

```typescript
import { Logger } from '../utils/logger';

const logger = new Logger('Database');

prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const duration = after - before;

  if (duration > 1000) {
    logger.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`, {
      model: params.model,
      action: params.action,
      args: params.args,
    });
  }

  return result;
});
```

## 6. Caching Strategy

### Redis Caching for Hot Data
```typescript
import { redis } from '../config/redis';

// Cache user profile
async function getUserProfile(userId: string) {
  const cacheKey = `user:profile:${userId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      admirersCount: true,
    },
  });
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(user));
  
  return user;
}
```

### Cache Invalidation
```typescript
// Invalidate cache on update
async function updateUserProfile(userId: string, data: any) {
  await prisma.user.update({
    where: { id: userId },
    data,
  });
  
  // Invalidate cache
  await redis.del(`user:profile:${userId}`);
}
```

## 7. Database Maintenance

### Vacuum and Analyze (PostgreSQL)
```sql
-- Run weekly
VACUUM ANALYZE;

-- For specific tables
VACUUM ANALYZE users;
VACUUM ANALYZE shorts;
VACUUM ANALYZE contests;
```

### Index Maintenance
```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename;

-- Rebuild indexes if needed
REINDEX TABLE users;
```

## 8. Monitoring Queries

### Slow Query Log
```sql
-- Enable slow query logging
ALTER DATABASE krieta SET log_min_duration_statement = 1000;

-- View slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC
LIMIT 20;
```

### Active Connections
```sql
SELECT 
  count(*) as connections,
  state
FROM pg_stat_activity
GROUP BY state;
```

## 9. Apply Indexes

Run migration:

```bash
cd backend
npx prisma db push
```

Or create migration:

```bash
npx prisma migrate dev --name add_performance_indexes
```

## 10. Performance Benchmarks

Target metrics:
- API response time: < 200ms (p95)
- Database query time: < 100ms (p95)
- Feed load time: < 500ms
- Search query time: < 300ms
- Transaction processing: < 50ms

Monitor with:
```typescript
import { Logger } from '../utils/logger';

const logger = new Logger('Performance');

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logPerformance(`${req.method} ${req.path}`, duration, {
      statusCode: res.statusCode,
      userId: req.user?.id,
    });
  });
  
  next();
});
```

## Summary

1. ✅ All critical indexes already implemented in schema
2. ✅ Recommendation system fully indexed
3. ✅ Analytics tables optimized
4. ⚠️ Add additional indexes for hot paths (see section 2)
5. ⚠️ Implement query monitoring middleware
6. ⚠️ Add Redis caching for frequently accessed data
7. ⚠️ Set up slow query logging
8. ⚠️ Configure connection pooling
9. ⚠️ Schedule regular VACUUM ANALYZE

**Next Steps:**
1. Add recommended indexes to schema.prisma
2. Run `npx prisma db push`
3. Implement query monitoring middleware
4. Set up Redis caching for hot data
5. Monitor performance metrics
