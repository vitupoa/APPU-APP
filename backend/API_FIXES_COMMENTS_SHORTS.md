# API Fixes - Comments & Shorts Endpoints

## Issues Found from Logcat

### 1. Comments API Error
```
JsonConvertException: Fields [comments, settings] are required for type 'CommentsResponseDto', but they were missing at path: $
```

**Problem**: The Kotlin app sends query parameter as `contentId` but the backend expected `content_id`.

**Solution**: Updated validation schema and route handlers in `comments.routes.ts` to use `contentId` consistently.

### 2. Shorts API Error
```
JsonConvertException: Fields [id, creator, videoUrl, caption, createdAt] are required for type 'ShortDto', but they were missing at path: $
```

**Problem**: The Kotlin app calls `/api/v1/shorts` but only `/api/v1/shorts/feed` was defined.

**Solution**: Added default shorts endpoint at `/api/v1/shorts` that mirrors the feed logic.

## Changes Made

### File: `backend/src/modules/comments/comments.routes.ts`

1. **Updated validation schema**:
   - Changed `content_id` to `contentId` in `getCommentsSchema`

2. **Updated route handlers**:
   - `GET /api/v1/comments` - Uses `contentId` from query params
   - `POST /api/v1/comments` - Uses `contentId` from query params
   - `PUT /api/v1/comments/settings` - Uses `contentId` from query params

### File: `backend/src/modules/shorts/shorts.routes.ts`

1. **Added default endpoint**:
   - `GET /api/v1/shorts` - Returns shorts feed (discover or admiring)
   - Kept existing `GET /api/v1/shorts/feed` for backward compatibility

## API Request Format

### Comments API

**Correct Request**:
```
GET /api/v1/comments?contentType=short&contentId=af9ca4a6-3374-4ce9-823c-43d844c3958d&sortBy=latest&limit=20
```

**Expected Response**:
```json
{
  "comments": [...],
  "settings": {
    "commentsEnabled": true,
    "repliesEnabled": true,
    "totalComments": 0
  },
  "nextCursor": null
}
```

### Shorts API

**Correct Request**:
```
GET /api/v1/shorts?type=discover&limit=20
```

**Expected Response**:
```json
{
  "items": [
    {
      "id": "...",
      "creator": {...},
      "videoUrl": "...",
      "caption": "...",
      "createdAt": "..."
    }
  ],
  "nextCursor": null
}
```

## Testing

After deploying these changes, test:

1. **Comments endpoint**:
   ```bash
   curl "https://your-api.railway.app/api/v1/comments?contentType=short&contentId=VALID_UUID&sortBy=latest"
   ```

2. **Shorts endpoint**:
   ```bash
   curl "https://your-api.railway.app/api/v1/shorts?type=discover"
   ```

## Deployment

1. Commit the changes:
   ```bash
   git add .
   git commit -m "Fix comments and shorts API parameter names"
   git push
   ```

2. Railway will auto-deploy the changes

3. Test the endpoints with your Kotlin app

## Next Steps

If you still see errors after deployment:

1. Check Railway logs for any errors
2. Verify the API responses match Kotlin DTO structure
3. Check if there are any authentication issues
4. Verify database has the required data
