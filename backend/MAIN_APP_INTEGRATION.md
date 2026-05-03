# Main App Integration - Changes Summary

## What Was Updated

### 1. **Imports Added**
```typescript
import { setRLSContext } from './middleware/rls.js';
import { globalRateLimiter } from './middleware/rateLimiting.js';
import subscriptionRoutes from './modules/user/subscription.routes.js';
```

### 2. **Global Rate Limiting Added**
```typescript
app.use(globalRateLimiter); // Redis-backed global rate limiting
```
- Applied after existing rate limiters
- Uses Railway Redis for distributed rate limiting
- Limits: 1000 requests per 15 minutes per user

### 3. **RLS Context Middleware Updated**
```typescript
// Changed from rlsMiddleware to setRLSContext
return setRLSContext(req as any, res, next);
```
- Uses new RLS context middleware
- Sets PostgreSQL session variables for Row-Level Security
- Automatically handles user context and admin privileges

### 4. **Subscription Routes Added**
```typescript
app.use('/api/v1/subscriptions', subscriptionRoutes);
```
- Mounted at `/api/v1/subscriptions`
- Includes all subscription CRUD operations
- Integrated with RLS, rate limiting, fraud detection, and audit logging

## Middleware Order (Important!)

The middleware is applied in this order:
1. **Security headers** (Helmet, CORS)
2. **Body parsing** (JSON, URL-encoded)
3. **Request logging**
4. **Rate limiting** (rateLimiter → apiRateLimiter → globalRateLimiter)
5. **Input sanitization** (XSS, path traversal, command injection)
6. **RLS context** (setRLSContext for authenticated routes)
7. **Route handlers**
8. **Error handler** (must be last)

## Routes Protected by New Security

All routes under `/api/v1/` now have:
- ✅ Global rate limiting (Redis-backed)
- ✅ RLS context (PostgreSQL session variables)
- ✅ Fraud detection (on specific endpoints)
- ✅ Audit logging (on specific endpoints)

### Specific Protected Routes

#### Content Lock Routes (`/api/v1/content-lock`)
- `POST /unlock` - Unlock rate limiter + fraud detection
- `GET /check-access` - Access check rate limiter
- `GET /convert` - Conversion rate limiter

#### Subscription Routes (`/api/v1/subscriptions`)
- `POST /` - Subscription rate limiter + fraud detection
- `POST /:id/cancel` - Subscription rate limiter
- `GET /` - Access check rate limiter
- `GET /tiers` - Access check rate limiter

## Next Steps

1. ✅ Main app updated
2. ⏳ Install dependencies: `npm install express-rate-limit rate-limit-redis ioredis zod`
3. ⏳ Configure Railway Redis environment variables
4. ⏳ Run RLS migration
5. ⏳ Deploy and test

## Testing the Integration

After deployment, verify:

```bash
# Test global rate limiting
for i in {1..1005}; do
  curl https://your-app.railway.app/api/v1/feed
done
# Should get 429 after 1000 requests

# Test RLS context
curl https://your-app.railway.app/api/v1/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"
# Should only return user's own subscriptions

# Test fraud detection
curl -X POST https://your-app.railway.app/api/v1/content-lock/unlock \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"contentId":"test","contentType":"SHORT"}'
# Rapid attempts should trigger fraud detection
```

## Rollback Plan

If issues occur, you can temporarily disable features:

### Disable Global Rate Limiting
Comment out in `index.ts`:
```typescript
// app.use(globalRateLimiter);
```

### Disable RLS Context
Revert to old middleware:
```typescript
return rlsMiddleware(req as any, res, next);
```

### Disable Fraud Detection
Comment out in route files:
```typescript
// const fraudCheck = await FraudDetectionService.checkUnlockFraud(...);
```

## Monitoring

Watch for these in logs:
- `✅ Connected to Railway Redis` - Redis connection successful
- `[FRAUD DETECTED]` - Suspicious activity blocked
- `[AUDIT]` - Security events logged
- `429 Too Many Requests` - Rate limiting working

## Support

If you encounter issues:
1. Check Railway Redis is running
2. Verify environment variables are set
3. Check logs for connection errors
4. Review `RAILWAY_REDIS_SETUP.md` for troubleshooting
