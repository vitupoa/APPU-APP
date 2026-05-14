# Contest Judging System - Deployment Checklist

## Pre-Deployment

### Code Review
- [ ] All TypeScript files compile without errors
- [ ] No console.log statements in production code
- [ ] All imports are correct
- [ ] No unused variables or functions
- [ ] Error handling is comprehensive

### Database
- [ ] Prisma schema is valid
- [ ] Migration SQL file is ready
- [ ] Backup current database
- [ ] Test migration on staging database

### Dependencies
- [ ] All npm packages installed
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Package versions are compatible

### Configuration
- [ ] Environment variables set correctly
- [ ] Database connection string is correct
- [ ] Exchange rate API configured
- [ ] CORS settings updated if needed

---

## Deployment Steps

### Step 1: Database Migration
```bash
# Connect to database
psql $DATABASE_URL

# Run migration
\i backend/prisma/migrations/add_judge_scores_table.sql

# Verify table created
\dt judge_scores

# Check indexes
\di judge_scores*

# Exit
\q
```

**Verification:**
- [ ] `judge_scores` table exists
- [ ] Unique constraint on (judge_id, submission_id)
- [ ] Index on submission_id
- [ ] Foreign keys to contest_judges and contest_submission

---

### Step 2: Regenerate Prisma Client
```bash
cd backend
npx prisma generate
```

**Verification:**
- [ ] No errors during generation
- [ ] `@prisma/client` updated
- [ ] Types available in IDE

---

### Step 3: Build Application
```bash
cd backend
npm run build
```

**Verification:**
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] Dist folder created

---

### Step 4: Deploy Code
```bash
# Push to repository
git add .
git commit -m "feat: implement contest judging system"
git push origin main

# Or deploy directly
npm run deploy
```

**Verification:**
- [ ] Code pushed successfully
- [ ] CI/CD pipeline passes
- [ ] Deployment successful

---

### Step 5: Restart Server
```bash
# Development
npm run dev

# Production
pm2 restart krieta-api
# or
npm start
```

**Verification:**
- [ ] Server starts without errors
- [ ] Worker logs show: "Contest deadline worker started"
- [ ] All routes accessible

---

## Post-Deployment Verification

### Health Checks

#### 1. Server Health
```bash
curl http://localhost:3000/health
```
- [ ] Returns 200 OK

#### 2. Database Connection
```bash
curl http://localhost:3000/api/v1/contests?limit=1
```
- [ ] Returns contest list
- [ ] No database errors

#### 3. Worker Status
Check logs for:
```
[CRON] Contest Deadline Worker started (runs every 5 minutes)
```
- [ ] Worker started successfully

---

### Functional Tests

#### Test 1: Create Contest with Airdrops
```bash
curl -X POST http://localhost:3000/api/v1/contests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Contest",
    "description": "Testing deployment",
    "media_type": "PHOTO",
    "category": "CREATIVE",
    "prizeTotalKr": 100,
    "maxWinners": 1,
    "prizeDistribution": [{"rank": 1, "percentage": 100}],
    "judgingCriteria": "COMMUNITY_VOTE",
    "deadline": "2026-12-31T23:59:59Z",
    "participationType": "INDIVIDUAL_ONLY",
    "airdropKr": 10,
    "airdropLimit": 10
  }'
```

**Expected:**
- [ ] Contest created
- [ ] Total charged = 100 + 15 + 100 + 15 = 230 Kr
- [ ] Wallet deducted correctly

#### Test 2: Get Contest with Currency
```bash
curl "http://localhost:3000/api/v1/contests/$CONTEST_ID?currency=kes"
```

**Expected:**
- [ ] Returns contest details
- [ ] Includes `prizeBreakdown` with fiat amounts
- [ ] Currency conversion works

#### Test 3: Transition to Judging
```bash
curl -X POST "http://localhost:3000/api/v1/contests/$CONTEST_ID/transition-to-judging" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- [ ] Status changes to JUDGING
- [ ] Returns success message

#### Test 4: Score Submission (as judge)
```bash
curl -X POST "http://localhost:3000/api/v1/contests/submissions/$SUBMISSION_ID/score" \
  -H "Authorization: Bearer $JUDGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score": 85, "feedback": "Great work!"}'
```

**Expected:**
- [ ] Score recorded
- [ ] Submission scores updated

#### Test 5: Calculate Winners
```bash
curl "http://localhost:3000/api/v1/contests/$CONTEST_ID/calculate-winners" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- [ ] Returns ranked winners
- [ ] Scores calculated correctly

#### Test 6: Prize Breakdown
```bash
curl "http://localhost:3000/api/v1/contests/$CONTEST_ID/prize-breakdown?currency=kes"
```

**Expected:**
- [ ] Returns breakdown with fiat amounts
- [ ] Percentages match configuration

---

### Performance Tests

#### 1. Worker Performance
- [ ] Create contest with past deadline
- [ ] Wait 5 minutes
- [ ] Verify status changed to JUDGING
- [ ] Check worker logs for execution time

#### 2. Score Calculation Performance
- [ ] Create contest with 10 submissions
- [ ] Have 3 judges score all submissions
- [ ] Measure time for `calculate-winners`
- [ ] Should complete in < 2 seconds

#### 3. Currency Conversion Performance
- [ ] Request contest list with currency
- [ ] Measure response time
- [ ] Should complete in < 500ms (with cache)

---

### Security Tests

#### 1. Judge Authorization
```bash
# Try to score as non-judge
curl -X POST "http://localhost:3000/api/v1/contests/submissions/$SUBMISSION_ID/score" \
  -H "Authorization: Bearer $NON_JUDGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score": 85}'
```

**Expected:**
- [ ] Returns 403 Forbidden
- [ ] Error: "You are not authorized to judge this contest"

#### 2. Admin-Only Distribution
```bash
# Try to distribute as non-admin
curl -X POST "http://localhost:3000/api/v1/contests/$CONTEST_ID/distribute-auto" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected:**
- [ ] Returns 403 Forbidden
- [ ] Only admins can distribute

#### 3. CSRF Protection
```bash
# Try POST without CSRF token
curl -X POST "http://localhost:3000/api/v1/contests/$CONTEST_ID/transition-to-judging" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
- [ ] CSRF validation works
- [ ] Protected endpoints require CSRF token

---

### Edge Case Tests

#### 1. Percentage Validation
```bash
# Try to create contest with invalid percentages
curl -X POST http://localhost:3000/api/v1/contests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prizeDistribution": [
      {"rank": 1, "percentage": 50},
      {"rank": 2, "percentage": 30}
    ]
  }'
```

**Expected:**
- [ ] Returns 400 Bad Request
- [ ] Error about percentages not summing to 100%

#### 2. Score Range Validation
```bash
# Try to score outside 0-100 range
curl -X POST "http://localhost:3000/api/v1/contests/submissions/$SUBMISSION_ID/score" \
  -H "Authorization: Bearer $JUDGE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score": 150}'
```

**Expected:**
- [ ] Returns 400 Bad Request
- [ ] Error about score range

#### 3. Exchange Rate Failure
- [ ] Mock exchange service failure
- [ ] Request contest with currency
- [ ] Should return Kr amounts only (graceful fallback)

---

## Monitoring

### Logs to Monitor

#### Application Logs
```bash
tail -f logs/app.log | grep -i contest
```

Watch for:
- [ ] Contest creation logs
- [ ] Worker execution logs
- [ ] Score calculation logs
- [ ] Prize distribution logs
- [ ] Error logs

#### Worker Logs
```bash
tail -f logs/app.log | grep -i cron
```

Watch for:
- [ ] "Contest deadline worker started"
- [ ] "Running contest deadline check"
- [ ] "Contest transitioned to JUDGING"
- [ ] Any errors

#### Database Logs
```bash
tail -f logs/postgres.log | grep -i judge_scores
```

Watch for:
- [ ] INSERT operations on judge_scores
- [ ] UPDATE operations on contest_submission
- [ ] No constraint violations
- [ ] No deadlocks

---

### Metrics to Track

#### Performance Metrics
- [ ] Average response time for contest endpoints
- [ ] Worker execution time
- [ ] Score calculation time
- [ ] Prize distribution time

#### Business Metrics
- [ ] Number of contests created
- [ ] Number of contests transitioned to JUDGING
- [ ] Number of judge scores submitted
- [ ] Number of prizes distributed

#### Error Metrics
- [ ] Failed contest creations
- [ ] Failed score submissions
- [ ] Failed prize distributions
- [ ] Worker errors

---

## Rollback Plan

### If Issues Occur

#### 1. Immediate Rollback
```bash
# Revert code
git revert HEAD
git push origin main

# Restart server
pm2 restart krieta-api
```

#### 2. Database Rollback
```bash
# Drop judge_scores table
psql $DATABASE_URL -c "DROP TABLE IF EXISTS judge_scores CASCADE;"

# Revert Prisma schema
git checkout HEAD~1 backend/prisma/schema.prisma

# Regenerate client
npx prisma generate
```

#### 3. Verify Rollback
- [ ] Server running on previous version
- [ ] No errors in logs
- [ ] Existing contests still work
- [ ] No data loss

---

## Success Criteria

### All checks must pass:
- [ ] Database migration successful
- [ ] Server starts without errors
- [ ] Worker starts and runs
- [ ] All functional tests pass
- [ ] All security tests pass
- [ ] Performance is acceptable
- [ ] No errors in logs
- [ ] Monitoring is active

---

## Post-Deployment Tasks

### Documentation
- [ ] Update API documentation
- [ ] Update changelog
- [ ] Notify team of new features

### Communication
- [ ] Announce new features to users
- [ ] Update help documentation
- [ ] Train support team

### Monitoring
- [ ] Set up alerts for errors
- [ ] Monitor performance metrics
- [ ] Track usage statistics

---

## Sign-Off

### Deployment Completed By:
- Name: _______________
- Date: _______________
- Time: _______________

### Verified By:
- Name: _______________
- Date: _______________
- Time: _______________

### Notes:
```
[Add any deployment notes, issues encountered, or special considerations]
```

---

## Emergency Contacts

- **DevOps Lead**: [Contact]
- **Backend Lead**: [Contact]
- **Database Admin**: [Contact]
- **On-Call Engineer**: [Contact]

---

## Next Steps

After successful deployment:
1. Monitor for 24 hours
2. Collect user feedback
3. Address any issues
4. Plan next iteration
5. Document lessons learned
