# Comment System - Complete Fix & Troubleshooting Guide

## Problem
Users get "Something went wrong. Please try again" when trying to comment on drips/posts.

## All Fixes Applied

### 1. Backend Route Parameter Bugs (8 endpoints)
**File**: `backend/src/modules/comments/comments.routes.ts`

Changed all instances from `req.params.comment_id` to `req.params.commentId`:
- Line 65: getReplies route
- Line 119: updateComment route  
- Line 138: deleteComment route
- Line 152: likeComment route
- Line 166: unlikeComment route
- Line 180: pinComment route
- Line 194: unpinComment route
- Line 208: reportComment route

### 2. Backend Service Parameter Naming (8 methods)
**File**: `backend/src/modules/comments/comments.service.ts`

Changed parameter from `content_id` to `contentId` in:
- getComments()
- createComment()
- updateCommentSettings()
- getCommentSettings()
- getContentOwner()
- getCommentCount()
- incrementContentCommentCountTx()
- decrementContentCommentCountTx()

### 3. Added ID Generation
**File**: `backend/src/modules/comments/comments.service.ts`

```typescript
const commentId = crypto.randomUUID();
const newComment = await tx.comments.create({
  data: {
    id: commentId,  // Explicit ID
    // ...other fields
  }
});
```

### 4. Added Comprehensive Error Logging
**Files**: 
- `backend/src/modules/comments/comments.routes.ts`
- `backend/src/modules/comments/comments.service.ts`

Added console.log statements to track:
- Request parameters
- Comment settings
- Database operations
- Content owner lookup
- Errors with stack traces

### 5. Frontend DTO Updates
**File**: `composeApp/src/commonMain/kotlin/com/krieta/feature/comments/data/remote/CommentDtos.kt`

Added dual field support for snake_case and camelCase:
```kotlin
val contentId: String? = null,
val content_id: String? = null,
val parentId: String? = null,
val parent_id: String? = null,
```

Changed request DTO to use backend field names:
```kotlin
data class CreateCommentRequestDto(
    val text: String,
    val parent_id: String? = null,  // Changed from parentId
    val replyToUserId: String? = null
)
```

### 6. Frontend Mapper Updates
**File**: `composeApp/src/commonMain/kotlin/com/krieta/feature/comments/data/repository/CommentsRepositoryImpl.kt`

```kotlin
private fun CommentDto.toDomain() = Comment(
    contentId = contentId ?: content_id ?: "",
    parentId = parentId ?: parent_id,
    // ...
)
```

### 7. Added Test Endpoint
**File**: `backend/src/modules/comments/comments.routes.ts`

```typescript
router.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Comments API is accessible',
    timestamp: new Date().toISOString()
  });
});
```

## Testing Instructions

### 1. Test API Accessibility
```bash
curl http://localhost:3000/api/v1/comments/test
```

Expected response:
```json
{
  "status": "ok",
  "message": "Comments API is accessible",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Test Getting Comments (No Auth)
```bash
curl "http://localhost:3000/api/v1/comments?contentType=short&contentId=YOUR_CONTENT_ID&sortBy=latest&limit=20"
```

Expected response:
```json
{
  "comments": [],
  "settings": {
    "commentsEnabled": true,
    "repliesEnabled": true,
    "totalComments": 0
  },
  "nextCursor": null
}
```

### 3. Test Creating Comment (With Auth)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test comment","parent_id":null,"replyToUserId":null}' \
  "http://localhost:3000/api/v1/comments?contentType=short&contentId=YOUR_CONTENT_ID"
```

Expected response:
```json
{
  "success": true,
  "comment": {
    "id": "comment-uuid",
    "content_id": "content-uuid",
    "contentType": "short",
    "author": { /* user data */ },
    "text": "Test comment",
    "likesCount": 0,
    "repliesCount": 0,
    // ...other fields
  }
}
```

### 4. Use Test Scripts

**Windows (PowerShell)**:
```powershell
cd backend
.\test-comments.ps1 -AuthToken "your-token" -ContentId "actual-id"
```

**Linux/Mac (Bash)**:
```bash
cd backend
export AUTH_TOKEN="your-token"
export CONTENT_ID="actual-id"
bash test-comments.sh
```

## Troubleshooting

### Issue 1: "Invalid token" or "Token expired"
**Cause**: JWT token is invalid or expired
**Solution**: 
1. Login again to get a fresh token
2. Check token expiry time
3. Verify JWT_SECRET is correct in backend

### Issue 2: "Content not found" or empty comments
**Cause**: The short/post doesn't exist in database
**Solution**:
1. Verify contentId is correct UUID
2. Check if content exists: `SELECT * FROM shorts WHERE id = 'your-id'`
3. Create test content if needed

### Issue 3: "Validation failed"
**Cause**: Request parameters don't match schema
**Solution**:
1. Check contentType is one of: 'post', 'short', 'contest_submission'
2. Verify contentId is valid UUID format
3. Ensure text is 1-500 characters
4. Check body contains required fields

### Issue 4: Database connection errors
**Cause**: Prisma client not connected or schema mismatch
**Solution**:
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### Issue 5: "Comments are disabled"
**Cause**: Comment settings disabled for this content
**Solution**:
1. Check comment_settings table
2. Enable comments:
```sql
UPDATE comment_settings 
SET comments_enabled = true, replies_enabled = true
WHERE content_id = 'your-id';
```

### Issue 6: Frontend still shows error
**Cause**: Frontend code not updated or cached
**Solution**:
1. Rebuild Kotlin app: `./gradlew clean build`
2. Clear app cache on device
3. Reinstall app
4. Check API base URL is correct

## Monitoring

### Check Backend Logs
Look for these log messages:
- ✅ "Creating comment:" - Comment creation started
- ✅ "Comment settings:" - Settings retrieved
- ✅ "Comment created successfully:" - Success
- ❌ "Error creating comment:" - Failure

### Check Database
```sql
-- Check if comment was created
SELECT * FROM comments 
WHERE content_id = 'your-content-id' 
ORDER BY created_at DESC 
LIMIT 5;

-- Check comment count
SELECT COUNT(*) FROM comments 
WHERE content_id = 'your-content-id';

-- Check comment settings
SELECT * FROM comment_settings 
WHERE content_id = 'your-content-id';
```

### Check Network Requests (Frontend)
1. Open browser/app dev tools
2. Go to Network tab
3. Filter for "comments"
4. Check request/response:
   - Request URL should have contentType and contentId params
   - Request body should have text, parent_id, replyToUserId
   - Response should be 201 with comment data

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Something went wrong" | Generic error catch-all | Check backend logs |
| "Missing or invalid authorization header" | No auth token | Login and pass token |
| "Validation failed" | Invalid parameters | Check contentType, contentId format |
| "Comments are disabled" | Settings disabled | Update comment_settings |
| "Invalid signature" | JWT issue | Get new token |
| "Comment text must be 500 characters or less" | Text too long | Shorten comment |
| "Content not found" | Short/post doesn't exist | Verify contentId |

## API Contract Reference

### POST /api/v1/comments

**Query Parameters:**
- `contentType`: "post" | "short" | "contest_submission"
- `contentId`: UUID string

**Headers:**
- `Authorization`: "Bearer {jwt-token}"
- `Content-Type`: "application/json"

**Body:**
```json
{
  "text": "string (1-500 chars)",
  "parent_id": "uuid | null",
  "replyToUserId": "uuid | null"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "comment": {
    "id": "uuid",
    "content_id": "uuid",
    "contentType": "string",
    "author": {...},
    "text": "string",
    "parent_id": "uuid | null",
    "replyToUser": {...} | null,
    "likesCount": 0,
    "repliesCount": 0,
    "isLiked": false,
    "isPinned": false,
    "isEdited": false,
    "canDelete": boolean,
    "canEdit": boolean,
    "canPin": boolean,
    "canReply": boolean,
    "createdAt": "ISO-8601 string",
    "editedAt": "ISO-8601 string | null"
  }
}
```

**Error Responses:**
- `400`: Validation failed / Bad request
- `401`: Not authenticated
- `403`: Not authorized
- `500`: Server error

## Deployment Checklist

### Backend
- [ ] All TypeScript files compiled without errors
- [ ] Prisma client regenerated
- [ ] Environment variables set (DATABASE_URL, JWT_SECRET)
- [ ] Server restarted
- [ ] Test endpoint accessible
- [ ] Logs showing no errors

### Frontend
- [ ] Kotlin code compiled
- [ ] DTOs updated
- [ ] Repository mapper updated
- [ ] App rebuilt
- [ ] App tested on device
- [ ] Network requests verified

## Success Criteria

✅ Test endpoint returns 200 OK
✅ GET comments returns valid response structure
✅ POST comment creates comment in database
✅ Comment appears in app immediately
✅ Like/unlike works
✅ Reply works
✅ Edit/delete works for author
✅ No errors in backend logs
✅ No crashes in mobile app

## Support

If issues persist after all fixes:
1. Check backend logs for specific errors
2. Verify database schema matches Prisma schema
3. Test API directly with curl/Postman
4. Check mobile app network logs
5. Verify JWT token is valid
6. Ensure contentId refers to existing content

All fixes have been applied. Comments should now work correctly.
