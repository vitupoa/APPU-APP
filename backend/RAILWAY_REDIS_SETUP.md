# Railway Redis Setup Guide

## Step 1: Install Dependencies

```bash
cd backend
npm install express-rate-limit rate-limit-redis ioredis zod
```

## Step 2: Get Railway Redis Connection Details

1. Go to your Railway project dashboard
2. Click on your **Redis service**
3. Go to the **Variables** or **Connect** tab
4. Copy the connection details

You'll see something like:
```
REDIS_URL=redis://default:password@containers-us-west-123.railway.app:6379
```

## Step 3: Configure Environment Variables

Add to your Railway backend service environment variables:

### Option A: Using REDIS_URL (Recommended)
```env
REDIS_URL=redis://default:your-password@your-redis-host.railway.app:6379
REDIS_RATE_LIMIT_DB=1
```

### Option B: Using Individual Parameters
```env
REDIS_HOST=your-redis-host.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_RATE_LIMIT_DB=1
```

## Step 4: Local Development (.env file)

For local development, add to your `backend/.env` file:

```env
# Railway Redis (use the same URL from Railway)
REDIS_URL=redis://default:your-password@your-redis-host.railway.app:6379
REDIS_RATE_LIMIT_DB=1
```

## Step 5: Verify Connection

The rate limiting middleware will automatically connect to Railway Redis using the `REDIS_URL` environment variable.

To test the connection, you can add this to your `backend/src/index.ts`:

```typescript
import { redis } from './middleware/rateLimiting.js';

// Test Redis connection
redis.on('connect', () => {
  console.log('✅ Connected to Railway Redis');
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});
```

## Step 6: Deploy

Push your changes to Railway:

```bash
git add .
git commit -m "Add rate limiting with Railway Redis"
git push
```

Railway will automatically redeploy with the new dependencies and configuration.

## Troubleshooting

### Connection Refused
- Verify `REDIS_URL` is correct in Railway environment variables
- Check that Redis service is running in Railway dashboard

### Authentication Failed
- Verify the password in `REDIS_URL` is correct
- Railway Redis requires authentication by default

### Database Selection Error
- Ensure `REDIS_RATE_LIMIT_DB=1` is set
- Railway Redis supports multiple databases (0-15)

## Testing Rate Limiting

Once deployed, test rate limiting by making multiple requests:

```bash
# Test unlock rate limit (10 requests per minute)
for i in {1..15}; do
  curl -X POST https://your-app.railway.app/api/v1/content-lock/unlock \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"contentId":"test","contentType":"SHORT"}'
  echo ""
done
```

After 10 requests, you should see:
```json
{
  "error": "Too many unlock attempts",
  "message": "You have exceeded the unlock rate limit. Please try again in 1 minute.",
  "retryAfter": 60
}
```

## Rate Limit Configuration

Current limits (can be adjusted in `rateLimiting.ts`):

| Operation | Limit | Window |
|-----------|-------|--------|
| Unlock | 10 requests | 1 minute |
| Subscription | 5 requests | 1 minute |
| Conversion | 30 requests | 1 minute |
| Access Check | 100 requests | 1 minute |
| Failed Unlock | 5 attempts | 15 minutes |
| Global API | 1000 requests | 15 minutes |
| Wallet | 20 requests | 1 minute |

## Redis Database Usage

- **DB 0**: Main application cache (if used)
- **DB 1**: Rate limiting (configured)
- **DB 2-15**: Available for other features

## Next Steps

After setting up Redis:
1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Deploy to Railway
4. ⏳ Run RLS migration (see SECURITY_IMPLEMENTATION_GUIDE.md)
5. ⏳ Test security features
