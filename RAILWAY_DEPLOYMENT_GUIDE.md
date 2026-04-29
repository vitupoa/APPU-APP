# RAILWAY DEPLOYMENT GUIDE

## Overview
This guide covers deploying the updated Krieta backend with logging, analytics, and database optimizations to Railway.

---

## Prerequisites

- Railway CLI installed: `npm install -g @railway/cli`
- Railway project connected
- Database URL from Railway dashboard

---

## Step 1: Verify Backend Changes

All backend changes are already in the codebase:
- ✅ Logger integrated in `src/index.ts`
- ✅ Database monitoring in `src/config/database.ts`
- ✅ AnalyticsService created in `src/services/analytics.service.ts`

**No code deployment needed - changes are already live!**

---

## Step 2: Database Migration (REQUIRED)

### Option A: Using Railway CLI (Recommended)

```bash
# 1. Login to Railway
railway login

# 2. Link to your project
railway link

# 3. Get database connection string
railway variables

# 4. Connect to database and run migration
railway run psql $DATABASE_URL < add_performance_indexes.sql

# 5. Verify indexes were created
railway run psql $DATABASE_URL -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%_idx' ORDER BY tablename;"
```

### Option B: Using Railway Dashboard

1. Go to Railway Dashboard: https://railway.app
2. Select your project: `appu-app-production`
3. Click on PostgreSQL service
4. Click "Connect" tab
5. Copy the connection string
6. Use any PostgreSQL client to connect
7. Run the SQL from `add_performance_indexes.sql`

### Option C: Using Prisma (Alternative)

```bash
cd backend

# 1. Update schema.prisma with additional indexes
# (See DATABASE_OPTIMIZATION.md for index definitions)

# 2. Generate Prisma client
npx prisma generate

# 3. Push changes to database
npx prisma db push

# OR create a migration
npx prisma migrate dev --name add_performance_indexes
npx prisma migrate deploy
```

---

## Step 3: Verify Deployment

### Check Logs

```bash
# View real-time logs
railway logs

# Look for:
# - "JWT Secret Manager initialized"
# - "Krieta API running on port 3000"
# - "Database connection initialized"
# - "All workers started successfully"
# - Request/response logs with duration
```

### Test API

```bash
# Health check
curl https://appu-app-production.up.railway.app/health

# Expected response:
# {"status":"ok","service":"krieta-api","version":"1.0.0"}
```

### Monitor Performance

```bash
# Watch for slow queries in logs
railway logs --filter "Slow query"

# Watch for slow requests
railway logs --filter "Slow request"
```

---

## Step 4: Environment Variables

Verify these are set in Railway dashboard:

```bash
# Required
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3000
JWT_SECRET=...
ENCRYPTION_KEY=121c93c9d296c455e4f478852e06c9d417bbd156f41ebf264b6eb94b58c2411e
CSRF_SECRET=fb785d40cbd522c8d394ca4ea81352fe0bb98c740321ba22e2903192ad2d1e42

# Optional (for logging)
LOG_LEVEL=INFO  # DEBUG, INFO, WARN, ERROR, FATAL
```

---

## Step 5: Performance Monitoring

### Check Database Performance

```sql
-- Connect to Railway database
railway run psql $DATABASE_URL

-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 20;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan > 0
ORDER BY idx_scan DESC
LIMIT 20;

-- Check connection count
SELECT 
  count(*) as connections,
  state
FROM pg_stat_activity
GROUP BY state;
```

### Monitor API Performance

```bash
# Watch request logs
railway logs --filter "INFO.*GET\|POST\|PUT\|DELETE"

# Watch for errors
railway logs --filter "ERROR"

# Watch for warnings
railway logs --filter "WARN"
```

---

## Step 6: Rollback Plan (If Needed)

If issues occur:

```bash
# 1. Check logs for errors
railway logs --tail 100

# 2. Rollback database migration (if needed)
railway run psql $DATABASE_URL

# Then run:
DROP INDEX IF EXISTS transactions_user_type_created_idx;
DROP INDEX IF EXISTS transactions_status_created_idx;
DROP INDEX IF EXISTS shorts_user_created_locked_idx;
DROP INDEX IF EXISTS shorts_contest_created_idx;
DROP INDEX IF EXISTS shorts_views_idx;
DROP INDEX IF EXISTS shorts_likes_idx;
DROP INDEX IF EXISTS posts_user_created_locked_idx;
DROP INDEX IF EXISTS posts_likes_idx;
DROP INDEX IF EXISTS wallets_balance_idx;
DROP INDEX IF EXISTS contest_submissions_contest_score_idx;
DROP INDEX IF EXISTS contest_submissions_contest_votes_idx;
DROP INDEX IF EXISTS contest_submissions_contest_rank_idx;
DROP INDEX IF EXISTS orders_buyer_created_idx;
DROP INDEX IF EXISTS orders_status_created_idx;
DROP INDEX IF EXISTS live_streams_status_viewers_idx;
DROP INDEX IF EXISTS live_streams_category_status_idx;
DROP INDEX IF EXISTS chamas_status_created_idx;
DROP INDEX IF EXISTS chama_members_chama_rotation_idx;
DROP INDEX IF EXISTS chama_members_chama_status_idx;

# 3. Restart service
railway restart
```

---

## Step 7: Post-Deployment Verification

### Checklist

- [ ] Health endpoint responds: `curl https://appu-app-production.up.railway.app/health`
- [ ] Logs show request/response logging
- [ ] Logs show database query monitoring
- [ ] No error spikes in logs
- [ ] API response times < 500ms
- [ ] Database query times < 200ms
- [ ] All indexes created successfully

### Test Critical Endpoints

```bash
# Test feed endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://appu-app-production.up.railway.app/api/v1/feed/discover?limit=20

# Test contest endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://appu-app-production.up.railway.app/api/v1/contests

# Test shop endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://appu-app-production.up.railway.app/api/v1/shop/products?limit=20
```

---

## Step 8: Monitoring Setup

### Railway Dashboard

1. Go to Metrics tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic
   - Response times

### Database Monitoring

```sql
-- Enable pg_stat_statements (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Reset statistics
SELECT pg_stat_statements_reset();

-- Check after 1 hour of traffic
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

---

## Troubleshooting

### Issue: Logs not showing

**Solution:**
```bash
# Check LOG_LEVEL environment variable
railway variables

# Set to DEBUG for more verbose logging
railway variables set LOG_LEVEL=DEBUG

# Restart service
railway restart
```

### Issue: Slow queries detected

**Solution:**
```bash
# Check if indexes were created
railway run psql $DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE '%_idx';"

# If missing, re-run migration
railway run psql $DATABASE_URL < add_performance_indexes.sql
```

### Issue: High memory usage

**Solution:**
```bash
# Check connection pool settings
# Update DATABASE_URL with connection limits
# Example: postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10

railway variables set DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=10"
railway restart
```

---

## Success Criteria

✅ **Deployment Successful When:**
1. Health endpoint responds with 200 OK
2. Logs show structured logging format
3. Request/response logging active
4. Database query monitoring active
5. All indexes created successfully
6. No error spikes
7. API response times < 500ms (p95)
8. Database query times < 200ms (p95)

---

## Next Steps After Deployment

1. **Monitor for 24 hours**
   - Watch logs for errors
   - Monitor performance metrics
   - Check slow query logs

2. **Tune if needed**
   - Adjust LOG_LEVEL
   - Tune connection pool
   - Add more indexes if needed

3. **Integrate Analytics**
   - Add AnalyticsService to routes
   - Track user interactions
   - Monitor conversion funnels

4. **Set up alerts**
   - Slow query alerts
   - Error rate alerts
   - Performance degradation alerts

---

## Support

**Documentation:**
- `FINAL_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- `DATABASE_OPTIMIZATION.md` - Database optimization guide
- `ERROR_HANDLING_LOGGING_ANALYTICS_SUMMARY.md` - Full technical details

**Railway Dashboard:**
- https://railway.app/project/appu-app-production

**Database Connection:**
- Host: Provided by Railway
- Database: krieta
- User: postgres
- Connection string in Railway variables

---

**Last Updated:** 2026-01-15
**Status:** READY FOR DEPLOYMENT ✅
