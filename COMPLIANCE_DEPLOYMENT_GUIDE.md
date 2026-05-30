# Wallet Compliance Restructuring - Deployment Guide

## 🚀 Quick Start

This guide walks you through deploying the compliance restructuring to Railway.

## Prerequisites

- ✅ Railway account with project access
- ✅ Database backup completed
- ✅ Git repository access
- ✅ Node.js 18+ installed locally (for testing)

## Step 1: Install Required Dependencies

```bash
cd backend
npm install node-cron ua-parser-js axios
```

**Packages Added:**
- `node-cron` - Cron job scheduling for compliance tasks
- `ua-parser-js` - User agent parsing for device fingerprinting
- `axios` - HTTP client for OFAC list downloads

## Step 2: Database Migration

### Option A: Using Prisma (Recommended)

```bash
cd backend
npx prisma db push
```

This will:
- Create all new compliance tables
- Add columns to existing tables
- Create indexes for performance

### Option B: Manual SQL Migration

```bash
# Connect to Railway database
railway connect

# Run migration
\i backend/prisma/migrations/add_compliance_models.sql
```

### Verify Migration

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_risk_profiles',
  'device_fingerprints',
  'locked_chat_tasks',
  'ofac_screening_cache',
  'transaction_contexts',
  'flagged_transactions',
  'locked_chat_settings',
  'suspicious_activity_logs'
);

-- Should return 8 rows
```

## Step 3: Update Environment Variables

### Railway Dashboard

1. Go to your Railway project
2. Click on your backend service
3. Go to "Variables" tab
4. Add the following variable:

```
OFAC_LIST_URL=https://www.treasury.gov/ofac/downloads/sdnlist.txt
```

### Verify Existing Variables

Ensure these are already set:
- ✅ `EXCHANGE_RATE_BASE_URL` (for currency conversion)
- ✅ `DATABASE_URL` (for database connection)
- ✅ `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`

## Step 4: Deploy to Railway

### Commit and Push

```bash
git add .
git commit -m "feat: implement wallet compliance restructuring

- Add risk scoring system with 8 risk factors
- Add device fingerprinting for fraud detection
- Add OFAC sanctions screening
- Add locked chat tasks (Cameo/Fiverr model)
- Add contest validation for gambling compliance
- Add transaction context validation
- Add compliance dashboard for admins
- Add automated cron jobs for compliance tasks
- Block wallet-to-wallet transfers and chat tips
- Update Contest model for voting validation
- Add compliance middleware and routes"

git push origin main
```

### Monitor Deployment

```bash
# Watch Railway logs
railway logs --follow
```

**Look for these success messages:**
```
✅ Initializing OFAC screening service...
✅ OFAC screening service initialized
✅ Compliance cron jobs initialized
✅ All workers started successfully
✅ Server ready to accept connections
```

## Step 5: Verify Deployment

### 1. Health Check

```bash
curl https://your-api.railway.app/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "krieta-api",
  "version": "1.0.0"
}
```

### 2. Test Compliance Endpoints

#### Get Risk Profile (requires authentication)
```bash
curl https://your-api.railway.app/api/v1/compliance/risk-profile/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "riskProfile": {
    "risk_score": 0,
    "risk_level": "LOW",
    "withdrawal_blocked": false,
    "transaction_limited": false
  }
}
```

#### Check Chat Access
```bash
curl https://your-api.railway.app/api/v1/compliance/chat-access/CREATOR_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "canMessage": true,
  "reason": "UNLOCKED"
}
```

### 3. Check Database Tables

```bash
# Connect to Railway database
railway connect

# Verify tables exist
\dt user_risk_profiles
\dt device_fingerprints
\dt locked_chat_tasks
\dt ofac_screening_cache
```

### 4. Monitor Logs

```bash
railway logs --tail 100
```

Look for:
- ✅ No error messages
- ✅ OFAC service initialization
- ✅ Cron jobs scheduled
- ✅ Device fingerprinting working

## Step 6: Test Cron Jobs

### Manual Trigger (Optional)

You can manually trigger cron jobs for testing:

```typescript
// In Railway console or via API endpoint
import { ComplianceCronService } from './services/compliance/compliance.cron.js';

// Run all jobs immediately
await ComplianceCronService.runAllJobsNow();
```

### Verify Cron Schedule

Check logs at these times:
- **Every hour (0 * * * *)**: Task expiration job
- **Every 6 hours (0 */6 * * *)**: Risk score recalculation
- **Sunday 2 AM (0 2 * * 0)**: OFAC list update
- **Daily 3 AM (0 3 * * *)**: OFAC cache cleanup
- **Daily 4 AM (0 4 * * *)**: Compliance reports

## Step 7: Post-Deployment Verification

### 1. Create Test User Risk Profile

```bash
# Via API or database
curl -X POST https://your-api.railway.app/api/v1/compliance/risk-profile/USER_ID/recalculate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test Device Fingerprinting

```bash
# Make any authenticated request - device will be tracked automatically
curl https://your-api.railway.app/api/v1/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check database
SELECT * FROM device_fingerprints WHERE user_id = 'USER_ID';
```

### 3. Test OFAC Screening

```bash
# Screen a user (admin only)
curl -X POST https://your-api.railway.app/api/v1/compliance/screen-user/USER_ID \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### 4. Test Locked Chat

```bash
# Check if creator has locked chat enabled
curl https://your-api.railway.app/api/v1/compliance/chat/settings/CREATOR_ID

# Unlock chat for a task
curl -X POST https://your-api.railway.app/api/v1/compliance/chat/unlock \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "creator_id": "CREATOR_ID",
    "task_description": "Record a birthday message",
    "amount_kr": 100,
    "deadline_hours": 24
  }'
```

### 5. Test Contest Validation

```bash
# Validate contest configuration
curl -X POST https://your-api.railway.app/api/v1/compliance/contest/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "entry_fee_kr": 100,
    "voting_enabled": true,
    "voting_cost_per_vote_kr": 0,
    "judging_method": "VOTES_ONLY"
  }'
```

Expected response:
```json
{
  "success": true,
  "isValid": true,
  "errors": [],
  "warnings": []
}
```

## Step 8: Monitor Performance

### Key Metrics to Watch

1. **Risk Score Calculation Time**
   - Target: < 100ms
   - Monitor: Check logs for slow calculations

2. **OFAC Screening Time**
   - Target: < 50ms (cached), < 500ms (uncached)
   - Monitor: Check cache hit rate

3. **Device Fingerprinting**
   - Should not block requests
   - Monitor: Check for errors in logs

4. **Cron Job Execution**
   - Monitor: Check logs at scheduled times
   - Verify: Jobs complete successfully

### Set Up Alerts (Optional)

In Railway dashboard:
1. Go to "Observability"
2. Set up alerts for:
   - High error rate
   - Slow response times
   - Memory usage spikes
   - Database connection issues

## Troubleshooting

### Issue: OFAC Service Fails to Initialize

**Symptoms:**
```
Error: Failed to initialize OFAC screening service
```

**Solutions:**
1. Check internet connectivity from Railway
2. Verify OFAC_LIST_URL is correct
3. Check if OFAC website is accessible
4. Review firewall rules

**Workaround:**
Service will continue with cached data. Manual update:
```bash
railway run npm run ofac:update
```

### Issue: Device Fingerprinting Not Working

**Symptoms:**
- No entries in `device_fingerprints` table
- Errors in logs about fingerprinting

**Solutions:**
1. Check if `ua-parser-js` is installed
2. Verify middleware is applied
3. Check request headers are being passed

### Issue: Cron Jobs Not Running

**Symptoms:**
- No log entries at scheduled times
- Tasks not expiring

**Solutions:**
1. Check if `node-cron` is installed
2. Verify Railway doesn't restart service frequently
3. Check timezone settings
4. Manually trigger jobs for testing

### Issue: High Risk Scores for All Users

**Symptoms:**
- All users have HIGH or CRITICAL risk levels

**Solutions:**
1. Review risk factor weights
2. Check if KYC data is populated
3. Adjust thresholds in risk scoring service
4. Verify transaction data is correct

### Issue: Database Migration Fails

**Symptoms:**
```
Error: relation "user_risk_profiles" already exists
```

**Solutions:**
1. Check if tables already exist
2. Drop existing tables if safe:
   ```sql
   DROP TABLE IF EXISTS user_risk_profiles CASCADE;
   ```
3. Re-run migration
4. Or use `IF NOT EXISTS` in migration

## Rollback Plan

If deployment fails or causes issues:

### 1. Revert Code

```bash
git revert HEAD
git push origin main
```

### 2. Remove Compliance Routes

Comment out in `backend/src/index.ts`:
```typescript
// app.use('/api/v1/compliance', complianceRoutes);
```

### 3. Disable Cron Jobs

Comment out in `backend/src/index.ts`:
```typescript
// ComplianceCronService.initialize();
```

### 4. Keep Database Tables

**DO NOT** drop tables - they contain compliance data that may be needed for audits.

### 5. Monitor for Issues

After rollback:
- Check error rates return to normal
- Verify existing features still work
- Review logs for any lingering issues

## Post-Deployment Tasks

### 1. Update Documentation

- [ ] Update API documentation with new endpoints
- [ ] Create admin dashboard guide
- [ ] Document compliance procedures
- [ ] Update user guides

### 2. Train Team

- [ ] Admin team on compliance dashboard
- [ ] Support team on locked chat feature
- [ ] Development team on new services

### 3. Monitor Compliance

- [ ] Review flagged transactions daily
- [ ] Check suspicious activity logs
- [ ] Monitor high-risk user count
- [ ] Track OFAC screening results

### 4. Optimize Performance

- [ ] Tune risk scoring thresholds
- [ ] Adjust cron job schedules if needed
- [ ] Optimize database queries
- [ ] Add caching where beneficial

### 5. Plan Frontend Updates

- [ ] Remove "Send Kr" button from wallet
- [ ] Remove tip button from direct chats
- [ ] Add locked chat UI
- [ ] Add contest validation UI
- [ ] Display fiat conversion everywhere

## Success Criteria

Deployment is successful when:

- ✅ All services start without errors
- ✅ OFAC service initializes successfully
- ✅ Cron jobs are scheduled
- ✅ Device fingerprinting works
- ✅ Risk profiles can be calculated
- ✅ Locked chat endpoints respond
- ✅ Contest validation works
- ✅ No increase in error rates
- ✅ Response times remain acceptable
- ✅ Database queries are performant

## Support

If you encounter issues:

1. **Check Logs**: `railway logs --tail 100`
2. **Review Documentation**: `COMPLIANCE_IMPLEMENTATION.md`
3. **Check Requirements**: `.kiro/specs/wallet-compliance-restructuring/requirements.md`
4. **Database Status**: `railway connect` and check tables
5. **Contact Team**: Escalate if issues persist

## Next Steps

After successful deployment:

1. ✅ Monitor for 24 hours
2. ✅ Review compliance dashboard
3. ✅ Test with real users (small group)
4. ✅ Gather feedback
5. ✅ Plan frontend integration
6. ✅ Schedule legal review (post-funding)

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Verified By**: _____________
**Status**: ⬜ Success ⬜ Failed ⬜ Rolled Back
