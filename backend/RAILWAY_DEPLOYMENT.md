# 🚂 RAILWAY DEPLOYMENT GUIDE - SECURITY FIXES

## 📋 Overview

This guide walks you through deploying the security fixes to your Railway-hosted backend.

---

## ⚠️ IMPORTANT: Pre-Deployment Checklist

- [ ] Backup your Railway database
- [ ] Test in a staging environment (if available)
- [ ] Notify team of deployment
- [ ] Have rollback plan ready

---

## 🔄 DEPLOYMENT STEPS

### Step 1: Commit and Push Changes

```bash
cd backend

# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: implement critical security fixes

- Add Row-Level Security (RLS) policies
- Add IP whitelisting for webhooks
- Add ownership validation middleware
- Remove sensitive data from public APIs
- Add IP-based rate limiting
- Add input sanitization"

# Push to Railway
git push origin main
```

Railway will automatically detect the changes and start deploying.

---

### Step 2: Wait for Railway Deployment

1. Go to your Railway dashboard: https://railway.app
2. Select your project
3. Watch the deployment logs
4. Wait for "Build successful" and "Deployment live"

**Expected deployment time:** 2-5 minutes

---

### Step 3: Run RLS Migration on Railway

Once the deployment is complete, run the RLS migration:

#### Option A: Using Railway CLI (Recommended)

```bash
# Install Railway CLI if not already installed
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the migration
railway run npm run migrate:rls
```

#### Option B: Using Railway Dashboard

1. Go to Railway Dashboard
2. Select your project
3. Go to "Settings" → "Variables"
4. Add a new variable: `RUN_RLS_MIGRATION=true`
5. Redeploy the service
6. Remove the variable after migration completes

#### Option C: Using Prisma Studio (Manual)

1. Go to Railway Dashboard
2. Select your PostgreSQL database
3. Click "Connect" → "Prisma Studio"
4. Copy the SQL from `prisma/migrations/enable_row_level_security.sql`
5. Execute it in the SQL console

---

### Step 4: Add Migration Script to package.json

Add this to your `package.json`:

```json
{
  "scripts": {
    "migrate:rls": "tsx migrate-rls.ts"
  }
}
```

Then run:

```bash
npm run migrate:rls
```

---

### Step 5: Verify RLS is Enabled

Connect to your Railway database and run:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'wallets', 'transactions', 'withdrawal_requests');
```

**Expected output:** All tables should show `rowsecurity = true`

---

### Step 6: Test the Deployment

#### Test 1: Health Check
```bash
curl https://your-railway-app.railway.app/health
```

Expected: `{"status":"ok"}`

#### Test 2: RLS Working
```bash
# Try to access another user's data (should fail or return filtered results)
curl https://your-railway-app.railway.app/api/v1/users/{other-user-id} \
  -H "Authorization: Bearer {your-token}"
```

#### Test 3: IP Whitelisting
```bash
# Try webhook from non-whitelisted IP (should fail with 403)
curl -X POST https://your-railway-app.railway.app/api/v1/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Expected: `{"error":"IP not whitelisted","code":"IP_NOT_WHITELISTED"}`

#### Test 4: Rate Limiting
```bash
# Make multiple rapid requests (should get 429 after limit)
for i in {1..70}; do
  curl https://your-railway-app.railway.app/api/v1/users/me \
    -H "Authorization: Bearer {token}"
done
```

Expected: After 60 requests, you should get `429 Too Many Requests`

#### Test 5: Ownership Validation
```bash
# Try to update another user's profile (should fail with 403)
curl -X PUT https://your-railway-app.railway.app/api/v1/users/{other-user-id} \
  -H "Authorization: Bearer {your-token}" \
  -H "Content-Type: application/json" \
  -d '{"bio": "test"}'
```

Expected: `{"error":"Forbidden: You can only access your own profile"}`

---

## 🔍 MONITORING

### Check Railway Logs

```bash
# Using Railway CLI
railway logs

# Or in Railway Dashboard
# Go to your service → Deployments → View Logs
```

### Key Things to Monitor

1. **Error Rate:** Should remain stable
2. **Response Time:** Should remain stable (RLS adds <5ms)
3. **Rate Limit Violations:** Track in logs
4. **Failed Auth Attempts:** Track in logs
5. **Webhook Failures:** Should only accept whitelisted IPs

---

## 🚨 TROUBLESHOOTING

### Issue: RLS Migration Fails

**Solution:**
```bash
# Check if policies already exist
railway run npx prisma db execute --stdin < prisma/migrations/enable_row_level_security.sql
```

### Issue: Application Won't Start

**Check logs:**
```bash
railway logs --tail 100
```

**Common causes:**
- Missing environment variables
- Database connection issues
- Redis connection issues

### Issue: Rate Limiting Not Working

**Check Redis connection:**
```bash
# In Railway Dashboard, verify Redis service is running
# Check REDIS_URL environment variable is set
```

### Issue: Webhooks Failing

**Temporary fix (for testing only):**
Comment out IP whitelisting in `webhook.routes.ts`:
```typescript
// router.post('/paypal', paypalWebhookWhitelist, ...);
router.post('/paypal', express.raw({ type: 'application/json' }), ...);
```

**Permanent fix:**
Add your testing IP to the whitelist in `ipRateLimiter.ts`

---

## 🔄 ROLLBACK PLAN

If critical issues occur:

### 1. Rollback Code

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

Railway will automatically deploy the previous version.

### 2. Disable RLS (Emergency Only)

Connect to Railway database and run:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests DISABLE ROW LEVEL SECURITY;
```

### 3. Restore Database Backup

In Railway Dashboard:
1. Go to PostgreSQL service
2. Click "Backups"
3. Select backup before migration
4. Click "Restore"

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Deployment successful
- [ ] RLS migration completed
- [ ] Health check passing
- [ ] RLS policies working
- [ ] IP whitelisting working
- [ ] Rate limiting working
- [ ] Ownership validation working
- [ ] No errors in logs
- [ ] Response times normal
- [ ] All tests passing

---

## 📊 RAILWAY-SPECIFIC NOTES

### Environment Variables

Ensure these are set in Railway:

```env
DATABASE_URL=postgresql://...  # Auto-set by Railway
REDIS_URL=redis://...          # Auto-set by Railway
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.com
REQUEST_SIGNING_KEY=your-secret-key
ENCRYPTION_KEY=your-encryption-key
JWT_ACCESS_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
```

### Database Connection

Railway automatically sets `DATABASE_URL`. The RLS migration will use this connection.

### Redis Connection

Railway automatically sets `REDIS_URL` if you have a Redis service. Rate limiting requires Redis.

If you don't have Redis:
1. Go to Railway Dashboard
2. Click "New" → "Database" → "Redis"
3. Railway will automatically set `REDIS_URL`

### Scaling Considerations

- RLS adds minimal overhead (<5ms per query)
- Rate limiting uses Redis (fast and distributed)
- No breaking changes to existing functionality

---

## 🎯 SUCCESS CRITERIA

✅ **Deployment is successful if:**

1. Application starts without errors
2. Health check returns 200 OK
3. RLS policies are enforcing access control
4. Webhooks only accept whitelisted IPs
5. Rate limiting prevents abuse
6. Users cannot access other users' data
7. Sensitive data not exposed in public APIs
8. No increase in error rate
9. Response times within acceptable range

---

## 📞 SUPPORT

**Railway Support:**
- Dashboard: https://railway.app
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

**For Issues:**
1. Check Railway logs
2. Check database connection
3. Check Redis connection
4. Review `SECURITY_IMPLEMENTATION_GUIDE.md`
5. Contact your team

---

## 🎉 COMPLETION

Once all checks pass, your Railway deployment is complete and secure!

**Security improvements:**
- ✅ Database-level access control (RLS)
- ✅ Webhook IP whitelisting
- ✅ Resource ownership validation
- ✅ Sensitive data protection
- ✅ IP-based rate limiting
- ✅ Input sanitization

**Your application is now production-ready and secure!**
