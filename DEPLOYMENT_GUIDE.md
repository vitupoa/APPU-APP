# Quick Deployment Guide

## Step 1: Apply Database Changes

```bash
cd backend
npx prisma db push
```

This will add the new security indexes to your Railway PostgreSQL database:
- `transactions_status_user_idx`
- `transactions_pending_provider_idx`

**Expected Output:**
```
✔ Database synchronized with Prisma schema
✔ 2 indexes created
```

---

## Step 2: Verify Changes

### Backend Changes:
- ✅ Amount validation (whole numbers only)
- ✅ Rate limiting (1 per minute)
- ✅ Fee calculation (4.5% + KES 30)
- ✅ Transaction status ('cancelled' for user cancellations)
- ✅ Database indexes added

### Frontend Changes:
- ✅ Input restricted to whole numbers
- ✅ Fee display updated
- ✅ Kr preview with fee calculation

---

## Step 3: Test Locally (Optional)

### Test Amount Input:
1. Open TopupScreen
2. Try entering "100.50" → Should only accept "10050"
3. Try entering "100" → Should accept

### Test Rate Limiting:
1. Initiate a top-up
2. Try another top-up immediately
3. Should see: "Too many top-up attempts. Please wait a moment."

### Test Fee Calculation:
1. Enter KES 1000
2. Should show: ~712 Kr (after fees)
3. Should display: "Fees: 4.5% + KES 30"

---

## Step 4: Deploy to Production

### Backend (Railway):
```bash
git add .
git commit -m "feat: secure payment integrations with fee structure"
git push origin main
```

Railway will automatically deploy the backend.

### Frontend:
Build and deploy your Kotlin Multiplatform app as usual.

---

## Step 5: Verify Production

### Check Database Indexes:
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'transactions';
```

Should show the new indexes.

### Test Top-Up Flow:
1. M-Pesa: Initiate → Enter PIN → Verify wallet credited
2. PayPal: Initiate → Complete payment → Verify wallet credited
3. Paystack: Initiate → Complete payment → Verify wallet credited

### Monitor Webhooks:
Check Railway logs for:
- ✅ Webhook signature verification
- ✅ Amount verification
- ✅ Transaction status updates
- ✅ No double-credit attempts

---

## Step 6: Monitor Metrics

### Key Metrics to Watch:
- Failed transaction rate (should be < 5%)
- Amount mismatch incidents (should be 0)
- Webhook signature failures (should be 0)
- Rate limit violations (normal user behavior)
- Average fee percentage (should be ~5-10%)

---

## Rollback Plan (If Needed)

If issues occur:

1. **Revert Backend:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Remove Indexes:**
   ```sql
   DROP INDEX IF EXISTS transactions_status_user_idx;
   DROP INDEX IF EXISTS transactions_pending_provider_idx;
   ```

3. **Notify Users:**
   - Disable top-ups temporarily
   - Display maintenance message

---

## Common Issues & Solutions

### Issue 1: Database Push Fails
**Solution:** Check Railway database connection string

### Issue 2: Webhooks Not Working
**Solution:** Verify webhook URLs in provider dashboards

### Issue 3: Amount Mismatch Errors
**Solution:** Check exchange rate service is working

### Issue 4: Rate Limiting Too Strict
**Solution:** Adjust from 1 to 2 minutes if needed

---

## Success Criteria

✅ Database indexes applied successfully
✅ Users can only enter whole numbers
✅ Rate limiting works (1 per minute)
✅ Fees calculated correctly (4.5% + KES 30)
✅ Cancelled transactions marked as 'cancelled'
✅ Webhooks verify amounts correctly
✅ No double-credit incidents
✅ All payment providers working

---

## Post-Deployment Checklist

- [ ] Database indexes verified
- [ ] Test top-up with KES 100
- [ ] Test top-up with KES 1,000
- [ ] Test rate limiting
- [ ] Test M-Pesa cancellation
- [ ] Test PayPal cancellation
- [ ] Test Paystack cancellation
- [ ] Verify webhook logs
- [ ] Check transaction statuses
- [ ] Monitor for 24 hours

---

## Status: ✅ READY TO DEPLOY

All changes are implemented and tested. Follow the steps above to deploy to production.

**Estimated Deployment Time:** 15-30 minutes
**Downtime Required:** None (zero-downtime deployment)

---

## Support

If you need help:
1. Check Railway logs
2. Review webhook logs
3. Verify environment variables
4. Test with sandbox credentials first
5. Contact payment provider support if needed

**Good luck with the deployment! 🚀**
