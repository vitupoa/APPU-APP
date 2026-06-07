# Debugging Guide - API Serialization Errors

## Quick Fix Summary

Fixed critical backend API issues causing JsonConvertException errors in the Android app.

## What Was Wrong

### 1. Route Parameter Mismatches
- **Chat routes**: Used `chatId` in URL but controller expected `chat_id` ❌
- **Wallet controller**: Used `user_id` instead of `userId` ❌

### 2. Response Format Mismatches
- **Stories API**: Returned `stories` field but client expected `feed` ❌
- **Missing endpoint**: No route for fetching single post by ID ❌

## What's Fixed

✅ All route parameters now match between routes and controllers
✅ Stories API returns correct response format
✅ Added `GET /api/v1/feed/:id` endpoint for single post fetching
✅ Backend compiled with all fixes

## Testing Commands

### Test Wallet Balance
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/wallet/balance?currency=KES"
```

### Test Chat List
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/chat?page=1&limit=20"
```

### Test Stories Feed
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/stories/feed"
```

### Test Drips Feed
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/feed?limit=20"
```

### Test Single Post
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:3000/api/v1/feed/POST_ID"
```

## Expected Responses

### Wallet Balance
```json
{
  "krBalance": 100.5,
  "fiatEquivalent": 12856.25,
  "currency": "KES",
  "isWalletUnlocked": true
}
```

### Chat List
```json
{
  "success": true,
  "chats": [...]
}
```

### Stories/Feed
```json
{
  "success": true,
  "feed": [...]
}
```

### Single Post
```json
{
  "id": "post-id",
  "creator": {...},
  "imageUrls": [...],
  "caption": "...",
  "likesCount": 0,
  "commentsCount": 0,
  "isLiked": false
}
```

## If Drips Still Empty

### Check 1: Authentication
- Verify token is valid
- Check token in Authorization header
- Look for 401 Unauthorized in logs

### Check 2: Database
```sql
-- Check if posts exist
SELECT COUNT(*) FROM post;

-- Check recent posts
SELECT id, caption, created_at FROM post 
ORDER BY created_at DESC LIMIT 10;
```

### Check 3: Feed Algorithm
- Feed requires users in same country
- Check user's country field is set
- Verify `admires` table has data for personalized feed

### Check 4: Content Lock
- Ensure `ContentLockService.checkAccess()` is working
- Check locked posts are properly filtered
- Verify image URLs are returned for unlocked content

## Common Errors & Solutions

### Error: "Fields [...] are required for type"
**Cause**: Backend returning wrong response structure
**Solution**: Check controller response matches DTO in Kotlin client

### Error: "Post not found"
**Cause**: Post ID doesn't exist or user lacks permission
**Solution**: Verify post exists in database and user has access

### Error: Empty feed array
**Cause**: No posts in database or feed algorithm returned nothing
**Solution**: 
1. Seed database with test posts
2. Check user country matches posts
3. Verify feed service is running correctly

## Restart Backend

After fixes, restart the backend server:

```bash
cd backend
npm run dev
# or
npm start
```

## Monitor Logs

Watch for these patterns in Android logcat:
```
✅ Good: HTTP 200 OK with data
✅ Good: Feed loaded with X items

❌ Bad: JsonConvertException
❌ Bad: HTTP 401/403/500
❌ Bad: Empty items array with no error
```

## Files to Check

If issues persist, examine these files:

1. **Kotlin Client**:
   - `FeedApi.kt` - API definitions
   - `FeedViewModel.kt` - Business logic
   - `DripsScreen.kt` - UI rendering

2. **Backend**:
   - `feed.routes.ts` - Endpoint definitions
   - `feed.service.ts` - Data fetching logic
   - `auth.middleware.ts` - Authentication

3. **Database**:
   - `schema.prisma` - Data models
   - Check `post`, `user`, `admires` tables

## Success Indicators

✅ No JsonConvertException in logs
✅ HTTP 200 responses from feed endpoint
✅ Posts array contains items
✅ Images load in Drips screen
✅ Like/comment buttons work
✅ Pull-to-refresh works

## Need More Help?

Check these files for detailed implementation:
- `BACKEND_API_FIXES.md` - Complete fix documentation
- Backend logs for error messages
- Android logcat for client-side errors
