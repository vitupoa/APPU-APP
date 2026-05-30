# Redis Velocity Cache Schema

## Overview
This document defines the Redis cache schema for real-time velocity checks. Redis is used for fast, in-memory rate limiting to prevent transaction abuse and ensure compliance with velocity limits.

## Requirements
- **Requirement 2.4.2**: Velocity Checks
- **Task 1.3**: Create velocity tracking tables and Redis cache schema

## Velocity Limits
- Max 10 tips per minute per user
- Max 50 transactions per hour per user
- Max 100,000 Kr per 24h for non-KYC users
- Max 500,000 Kr per 24h for KYC-approved users
- 24-hour cooling-off period for new accounts before first withdrawal

---

## Redis Key Patterns

### 1. Transaction Count Keys
**Pattern**: `velocity:count:{user_id}:{window_type}`

**Purpose**: Track number of transactions in a time window

**Examples**:
```
velocity:count:user-123:1_MINUTE
velocity:count:user-123:1_HOUR
velocity:count:user-123:24_HOURS
```

**Value Type**: Integer (counter)

**TTL**:
- `1_MINUTE`: 60 seconds
- `1_HOUR`: 3600 seconds (1 hour)
- `24_HOURS`: 86400 seconds (24 hours)

**Operations**:
```redis
# Increment transaction count
INCR velocity:count:user-123:1_MINUTE
EXPIRE velocity:count:user-123:1_MINUTE 60

# Get current count
GET velocity:count:user-123:1_MINUTE

# Check if limit exceeded
GET velocity:count:user-123:1_MINUTE
# If count >= 10 for 1_MINUTE, block transaction
```

---

### 2. Transaction Amount Keys
**Pattern**: `velocity:amount:{user_id}:{window_type}`

**Purpose**: Track total Kr amount transacted in a time window

**Examples**:
```
velocity:amount:user-123:24_HOURS
```

**Value Type**: String (decimal number as string)

**TTL**:
- `24_HOURS`: 86400 seconds (24 hours)

**Operations**:
```redis
# Add transaction amount
INCRBYFLOAT velocity:amount:user-123:24_HOURS 1500.50
EXPIRE velocity:amount:user-123:24_HOURS 86400

# Get current total
GET velocity:amount:user-123:24_HOURS

# Check if limit exceeded
GET velocity:amount:user-123:24_HOURS
# If amount >= 100000 (non-KYC) or >= 500000 (KYC), block transaction
```

---

### 3. Tip Count Keys (Specific for Tips)
**Pattern**: `velocity:tips:{user_id}:1_MINUTE`

**Purpose**: Track number of tips specifically (separate from general transactions)

**Examples**:
```
velocity:tips:user-123:1_MINUTE
```

**Value Type**: Integer (counter)

**TTL**: 60 seconds

**Operations**:
```redis
# Increment tip count
INCR velocity:tips:user-123:1_MINUTE
EXPIRE velocity:tips:user-123:1_MINUTE 60

# Get current tip count
GET velocity:tips:user-123:1_MINUTE

# Check if limit exceeded
GET velocity:tips:user-123:1_MINUTE
# If count >= 10, block tip transaction
```

---

### 4. Account Cooling-Off Keys
**Pattern**: `velocity:cooling_off:{user_id}`

**Purpose**: Track 24-hour cooling-off period for new accounts before first withdrawal

**Examples**:
```
velocity:cooling_off:user-123
```

**Value Type**: String (ISO timestamp of account creation)

**TTL**: 86400 seconds (24 hours from account creation)

**Operations**:
```redis
# Set cooling-off period when account is created
SET velocity:cooling_off:user-123 "2025-01-15T10:30:00Z"
EXPIRE velocity:cooling_off:user-123 86400

# Check if cooling-off period is active
EXISTS velocity:cooling_off:user-123
# If key exists, block withdrawal
# If key doesn't exist, cooling-off period has passed
```

---

### 5. Velocity Block Keys
**Pattern**: `velocity:blocked:{user_id}`

**Purpose**: Temporarily block user from transactions after velocity limit exceeded

**Examples**:
```
velocity:blocked:user-123
```

**Value Type**: String (reason for block)

**TTL**: Variable (e.g., 300 seconds = 5 minutes)

**Operations**:
```redis
# Block user for 5 minutes
SET velocity:blocked:user-123 "Exceeded 10 tips per minute limit"
EXPIRE velocity:blocked:user-123 300

# Check if user is blocked
EXISTS velocity:blocked:user-123
# If key exists, reject all transactions
```

---

## Redis Data Structures

### Hash for User Velocity Summary
**Pattern**: `velocity:summary:{user_id}`

**Purpose**: Store all velocity metrics in a single hash for efficient retrieval

**Fields**:
```
count_1_minute: "5"
count_1_hour: "23"
count_24_hours: "87"
amount_24_hours: "45000.50"
tips_1_minute: "3"
last_transaction_at: "2025-01-15T10:30:00Z"
```

**TTL**: 86400 seconds (24 hours)

**Operations**:
```redis
# Update multiple fields atomically
HSET velocity:summary:user-123 count_1_minute 5 count_1_hour 23 amount_24_hours 45000.50
EXPIRE velocity:summary:user-123 86400

# Get all velocity metrics
HGETALL velocity:summary:user-123

# Get specific metric
HGET velocity:summary:user-123 count_1_minute
```

---

## Implementation Example

### TypeScript Service Interface
```typescript
interface VelocityChecker {
  // Check if transaction is allowed
  checkVelocity(userId: string, transactionType: string, amountKr: number): Promise<VelocityCheckResult>;
  
  // Record transaction in velocity cache
  recordTransaction(userId: string, transactionType: string, amountKr: number): Promise<void>;
  
  // Get current velocity metrics
  getVelocityMetrics(userId: string): Promise<VelocityMetrics>;
  
  // Check cooling-off period
  checkCoolingOff(userId: string): Promise<boolean>;
  
  // Block user temporarily
  blockUser(userId: string, reason: string, durationSeconds: number): Promise<void>;
}

interface VelocityCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  limit?: number;
  resetAt?: Date;
}

interface VelocityMetrics {
  count_1_minute: number;
  count_1_hour: number;
  count_24_hours: number;
  amount_24_hours: number;
  tips_1_minute: number;
  is_blocked: boolean;
  cooling_off_active: boolean;
}
```

### Example Usage
```typescript
// Before processing transaction
const velocityCheck = await velocityChecker.checkVelocity(
  userId, 
  'CONTENT_TIP', 
  1000
);

if (!velocityCheck.allowed) {
  throw new Error(`Transaction blocked: ${velocityCheck.reason}`);
}

// Process transaction...

// After successful transaction
await velocityChecker.recordTransaction(userId, 'CONTENT_TIP', 1000);
```

---

## Redis Commands Reference

### Check Velocity Before Transaction
```redis
# 1. Check if user is blocked
EXISTS velocity:blocked:user-123

# 2. Check tip count (if tip transaction)
GET velocity:tips:user-123:1_MINUTE

# 3. Check general transaction count
GET velocity:count:user-123:1_MINUTE
GET velocity:count:user-123:1_HOUR

# 4. Check 24h amount limit
GET velocity:amount:user-123:24_HOURS

# 5. Check cooling-off period (if withdrawal)
EXISTS velocity:cooling_off:user-123
```

### Record Transaction After Success
```redis
# 1. Increment tip count (if tip)
INCR velocity:tips:user-123:1_MINUTE
EXPIRE velocity:tips:user-123:1_MINUTE 60

# 2. Increment transaction counts
INCR velocity:count:user-123:1_MINUTE
EXPIRE velocity:count:user-123:1_MINUTE 60

INCR velocity:count:user-123:1_HOUR
EXPIRE velocity:count:user-123:1_HOUR 3600

INCR velocity:count:user-123:24_HOURS
EXPIRE velocity:count:user-123:24_HOURS 86400

# 3. Add to 24h amount
INCRBYFLOAT velocity:amount:user-123:24_HOURS 1000.00
EXPIRE velocity:amount:user-123:24_HOURS 86400

# 4. Update summary hash
HSET velocity:summary:user-123 last_transaction_at "2025-01-15T10:30:00Z"
EXPIRE velocity:summary:user-123 86400
```

---

## Performance Considerations

### 1. Atomic Operations
Use Redis pipelines or transactions (MULTI/EXEC) to ensure atomic updates:
```redis
MULTI
INCR velocity:count:user-123:1_MINUTE
EXPIRE velocity:count:user-123:1_MINUTE 60
INCR velocity:count:user-123:1_HOUR
EXPIRE velocity:count:user-123:1_HOUR 3600
EXEC
```

### 2. Batch Reads
Use MGET or HGETALL to fetch multiple metrics in one round-trip:
```redis
MGET velocity:count:user-123:1_MINUTE velocity:count:user-123:1_HOUR velocity:amount:user-123:24_HOURS
```

### 3. TTL Management
Always set TTL when creating keys to prevent memory leaks:
```redis
SET velocity:count:user-123:1_MINUTE 1 EX 60
# or
SETEX velocity:count:user-123:1_MINUTE 60 1
```

### 4. Key Expiration
Redis automatically removes expired keys, but you can also manually clean up:
```redis
# Find all velocity keys for a user
KEYS velocity:*:user-123:*

# Delete all velocity keys for a user (use with caution)
DEL velocity:count:user-123:1_MINUTE velocity:count:user-123:1_HOUR
```

---

## Monitoring & Alerts

### Key Metrics to Monitor
1. **Hit Rate**: Percentage of velocity checks that pass
2. **Block Rate**: Percentage of users blocked by velocity limits
3. **Cache Hit Rate**: Redis cache hit/miss ratio
4. **Key Count**: Number of velocity keys in Redis
5. **Memory Usage**: Redis memory consumption for velocity keys

### Alert Thresholds
- Block rate > 5% → Investigate potential attack or misconfiguration
- Cache miss rate > 10% → Check Redis availability
- Key count > 1M → Review TTL settings and cleanup strategy

---

## Testing

### Manual Testing with Redis CLI
```bash
# Test tip velocity limit
redis-cli INCR velocity:tips:test-user:1_MINUTE
redis-cli EXPIRE velocity:tips:test-user:1_MINUTE 60
redis-cli GET velocity:tips:test-user:1_MINUTE

# Test 24h amount limit
redis-cli INCRBYFLOAT velocity:amount:test-user:24_HOURS 50000
redis-cli GET velocity:amount:test-user:24_HOURS

# Test cooling-off period
redis-cli SET velocity:cooling_off:test-user "2025-01-15T10:00:00Z" EX 86400
redis-cli EXISTS velocity:cooling_off:test-user

# Test user block
redis-cli SET velocity:blocked:test-user "Test block" EX 300
redis-cli EXISTS velocity:blocked:test-user
```

### Unit Test Example
```typescript
describe('VelocityChecker', () => {
  it('should block user after 10 tips in 1 minute', async () => {
    const userId = 'test-user-123';
    
    // Send 10 tips
    for (let i = 0; i < 10; i++) {
      await velocityChecker.recordTransaction(userId, 'CONTENT_TIP', 100);
    }
    
    // 11th tip should be blocked
    const result = await velocityChecker.checkVelocity(userId, 'CONTENT_TIP', 100);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('10 tips per minute');
  });
});
```

---

## Migration Strategy

### Phase 1: Add Redis Cache (Non-Blocking)
1. Deploy Redis cache alongside existing system
2. Write to both PostgreSQL and Redis
3. Read from PostgreSQL (Redis is write-only)
4. Monitor Redis for errors

### Phase 2: Enable Redis Reads (Gradual)
1. Enable Redis reads for 10% of traffic
2. Compare Redis vs PostgreSQL results
3. Gradually increase to 100%
4. Keep PostgreSQL as fallback

### Phase 3: Redis as Primary (Full Migration)
1. Use Redis for all velocity checks
2. PostgreSQL for historical data and analytics
3. Periodic sync from Redis to PostgreSQL
4. Remove PostgreSQL reads from hot path

---

## Backup & Recovery

### Redis Persistence
Configure Redis with both RDB and AOF:
```conf
# redis.conf
save 900 1      # Save after 900 seconds if at least 1 key changed
save 300 10     # Save after 300 seconds if at least 10 keys changed
save 60 10000   # Save after 60 seconds if at least 10000 keys changed

appendonly yes
appendfsync everysec
```

### Fallback Strategy
If Redis is unavailable:
1. Fall back to PostgreSQL `transaction_velocity` table
2. Log Redis connection errors
3. Alert operations team
4. Continue processing transactions (degraded performance)

---

## Security Considerations

### 1. Key Namespace Isolation
Use prefixes to isolate velocity keys from other Redis data:
```
velocity:*  # All velocity-related keys
```

### 2. Access Control
Use Redis ACL to restrict access:
```redis
ACL SETUSER velocity-service on >password ~velocity:* +get +set +incr +expire
```

### 3. Rate Limiting Redis Itself
Protect Redis from abuse:
- Limit connections per client
- Set max memory policy: `maxmemory-policy allkeys-lru`
- Monitor command execution time

---

## References

- **Requirements**: Section 2.4.2 (Velocity Checks)
- **Task**: 1.3 (Create velocity tracking tables)
- **Related Tables**: `transaction_velocity` (PostgreSQL)
- **Related Services**: `velocity-checker.service.ts`

---

## Changelog

| Date       | Version | Changes                                      |
|------------|---------|----------------------------------------------|
| 2025-01-15 | 1.0     | Initial Redis velocity cache schema          |

