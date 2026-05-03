# 🚀 QUICK START - Railway Deployment

## ✅ Dependencies Installed

```bash
✓ isomorphic-dompurify installed
```

## 📦 Ready to Deploy

All security fixes are implemented and ready for Railway deployment.

---

## 🚂 DEPLOY TO RAILWAY (3 Steps)

### Step 1: Push to Git

```bash
git add .
git commit -m "feat: implement critical security fixes (RLS, IP whitelisting, ownership validation, rate limiting)"
git push origin main
```

Railway will automatically deploy.

### Step 2: Run RLS Migration

After Railway deployment completes, run:

```bash
npm run migrate:rls
```

Or using Railway CLI:

```bash
railway run npm run migrate:rls
```

### Step 3: Verify

```bash
# Check health
curl https://your-app.railway.app/health

# Test RLS (should only show your data)
curl https://your-app.railway.app/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 What Was Implemented

✅ **Row-Level Security (RLS)**
- Database-level access control
- Users can only access their own data
- Admins have elevated permissions

✅ **IP Whitelisting for Webhooks**
- PayPal webhooks: Only PayPal IPs accepted
- Paystack webhooks: Only Paystack IPs accepted
- M-Pesa webhooks: Only M-Pesa IPs accepted

✅ **Ownership Validation**
- Users can only update their own profiles
- Users can only access their own wallets
- Prevents unauthorized resource access

✅ **Sensitive Data Protection**
- `isWalletUnlocked` hidden from public profiles
- `kycStatus` hidden from public profiles
- `dailyLimit` removed from responses

✅ **IP-Based Rate Limiting**
- Global API: 60 requests/minute
- Auth endpoints: 5 attempts/15 minutes
- Payment endpoints: 3 requests/minute
- Withdrawal endpoints: 2 requests/minute

✅ **Input Sanitization**
- XSS prevention
- SQL injection prevention
- Path traversal prevention
- Command injection prevention

---

## 🔍 Files Modified

### Core Application
- `src/index.ts` - Added security middleware
- `package.json` - Added migrate:rls script

### Routes
- `src/routes/webhook.routes.ts` - IP whitelisting
- `src/modules/wallet/wallet.routes.ts` - Ownership + rate limiting
- `src/modules/user/user.routes.ts` - Ownership + sanitization

### Services
- `src/modules/user/user.service.ts` - Removed sensitive fields
- `src/modules/kyc/kyc.service.ts` - Removed daily limit

### New Middleware
- `src/middleware/rls.ts` - RLS context management
- `src/middleware/ownership.ts` - Ownership validation
- `src/middleware/ipRateLimiter.ts` - IP-based rate limiting
- `src/middleware/sanitization.ts` - Input sanitization

### Database
- `prisma/migrations/enable_row_level_security.sql` - RLS policies
- `migrate-rls.ts` - Migration script

---

## ⚠️ IMPORTANT NOTES

### Redis Required
Rate limiting requires Redis. Railway should auto-provision it.

If not:
1. Go to Railway Dashboard
2. Click "New" → "Database" → "Redis"
3. Railway will set `REDIS_URL` automatically

### Environment Variables
Ensure these are set in Railway:

```env
DATABASE_URL=postgresql://...  # Auto-set
REDIS_URL=redis://...          # Auto-set
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.com
REQUEST_SIGNING_KEY=your-secret-key
ENCRYPTION_KEY=your-encryption-key
```

### Migration Order
1. Deploy code first (Railway auto-deploys on push)
2. Run RLS migration after deployment
3. Verify everything works

---

## 🧪 Testing

### Test 1: Health Check
```bash
curl https://your-app.railway.app/health
```
Expected: `{"status":"ok"}`

### Test 2: RLS Working
```bash
# Should only return your data
curl https://your-app.railway.app/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Rate Limiting
```bash
# Should get 429 after 60 requests
for i in {1..70}; do
  curl https://your-app.railway.app/api/v1/users/me
done
```

### Test 4: IP Whitelisting
```bash
# Should fail with 403
curl -X POST https://your-app.railway.app/api/v1/webhooks/paypal \
  -d '{"test":"data"}'
```

---

## 📚 Full Documentation

- `RAILWAY_DEPLOYMENT.md` - Complete Railway deployment guide
- `SECURITY_AUDIT_REPORT.md` - Full security audit
- `SECURITY_IMPLEMENTATION_GUIDE.md` - Implementation details
- `DEPLOYMENT_CHECKLIST.md` - Verification checklist

---

## 🆘 Troubleshooting

### Issue: Migration Fails
```bash
# Check Railway logs
railway logs

# Verify DATABASE_URL is set
railway variables
```

### Issue: Rate Limiting Not Working
```bash
# Check Redis is running
railway logs --service redis

# Verify REDIS_URL is set
railway variables
```

### Issue: Application Won't Start
```bash
# Check logs for errors
railway logs --tail 100

# Common fixes:
# - Ensure all dependencies installed
# - Check environment variables
# - Verify database connection
```

---

## ✅ Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Code committed and pushed
- [ ] Railway deployment successful
- [ ] RLS migration completed
- [ ] Health check passing
- [ ] Tests passing
- [ ] No errors in logs

---

## 🎉 You're Done!

Your Railway backend is now secure with:
- ✅ Database-level access control
- ✅ Webhook IP whitelisting
- ✅ Resource ownership validation
- ✅ Sensitive data protection
- ✅ IP-based rate limiting
- ✅ Input sanitization

**Deploy with confidence!** 🚀
