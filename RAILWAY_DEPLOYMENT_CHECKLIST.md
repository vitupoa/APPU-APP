# Railway Deployment - Quick Checklist

## Step 1: Update Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to "Variables" tab
4. Update/Add these variables:

```bash
JWT_ACCESS_EXPIRY=30d
JWT_REFRESH_EXPIRY=365d
```

**Important:** Make sure the variable names are EXACTLY:
- `JWT_ACCESS_EXPIRY` (not JWT_ACCESS_EXPIRES_IN)
- `JWT_REFRESH_EXPIRY` (not JWT_REFRESH_EXPIRES_IN)

## Step 2: Redeploy Backend

Option A: Automatic (if connected to GitHub)
- Railway will auto-redeploy when you push changes

Option B: Manual Redeploy
- Click "Deploy" button in Railway dashboard
- Or click the three dots → "Redeploy"

## Step 3: Verify Deployment

1. Check Railway logs:
   - Look for "Server started on port 4000" or similar
   - No errors about JWT configuration

2. Test the API:
   ```bash
   # Test login endpoint
   curl -X POST https://your-railway-url.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "testpassword",
       "deviceId": "test-device"
     }'
   ```

3. Check token expiry in response:
   - Decode the JWT token at https://jwt.io
   - Verify `exp` claim is ~30 days from now (not 15 minutes)

## Step 4: Test on Mobile App

1. **Fresh Login Test:**
   - Uninstall app (or clear app data)
   - Install and login
   - Should work normally

2. **Persistence Test:**
   - Login to app
   - Close app completely
   - Wait 20 minutes
   - Open app again
   - Profile should load without re-login ✅

3. **Long-term Test:**
   - Leave app logged in for 24 hours
   - Open app next day
   - Should still be logged in ✅

## Expected Results

✅ User stays logged in after closing app
✅ User stays logged in after 15+ minutes
✅ Profile data loads correctly
✅ No "Unknown User" errors
✅ No automatic logouts

## If Something Goes Wrong

### Issue: "Invalid token" errors
**Solution:** Users need to logout and login once after backend update

### Issue: Environment variables not taking effect
**Solution:** 
1. Verify variable names are correct (no typos)
2. Redeploy backend
3. Check Railway logs for startup errors

### Issue: Still logging out after 15 minutes
**Solution:**
1. Check Railway variables are saved
2. Verify backend redeployed successfully
3. Check backend logs for JWT configuration
4. Test with fresh login (clear app data first)

## Rollback Plan (if needed)

If you need to revert to 15-minute tokens:

```bash
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

Then redeploy backend.

---

**Time Required:** 5-10 minutes
**Downtime:** None (zero-downtime deployment)
**Risk Level:** Low (only changes token expiry, no breaking changes)
