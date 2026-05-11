# Chat Media Upload Implementation

## Overview
Secure media sharing in direct and group chats with comprehensive security sanitization against malicious files and attacks.

## Features
- ✅ Photo/Image uploads (JPEG, PNG, GIF, WebP)
- ✅ Video uploads (MP4, WebM, QuickTime)
- ✅ PDF document uploads
- ✅ External link sharing with validation
- ✅ Group avatar uploads
- ✅ Security sanitization against XSS, malicious files, and attacks
- ✅ Cloudinary integration (reuses existing setup)
- ✅ Separate folders for direct/group/chama chats

## Security Measures

### 1. File Type Validation
- **Allowed Image Types**: JPEG, PNG, GIF, WebP
- **Allowed Video Types**: MP4, WebM, QuickTime, AVI
- **Allowed Documents**: PDF, DOC, DOCX
- **Blocked Extensions**: .exe, .bat, .cmd, .js, .sh, .ps1, etc.

### 2. File Size Limits
- Images: 10MB max
- Videos: 100MB max
- Documents: 20MB max

### 3. URL Validation
- Only HTTPS URLs allowed
- Only Cloudinary domains accepted
- No localhost or private IP addresses
- XSS pattern detection and blocking
- Query parameter sanitization

### 4. Content Sanitization
- Script tag removal
- Event handler removal (`onclick`, `onerror`, etc.)
- Iframe/embed/object tag blocking
- JavaScript protocol blocking

### 5. Folder Isolation
- Direct chats: `Krieta/Chats/Direct/Images|Videos`
- Group chats: `Krieta/Chats/Group/Images|Videos`
- Chama chats: `Krieta/Chats/Chama/Images|Videos`
- Group avatars: `Krieta/Chats/GroupAvatar/Images`

## API Endpoints

### 1. Get Upload Signature
Generate signed upload parameters for client-side upload.

```http
POST /api/v1/chat/:chatId/media/signature
Authorization: Bearer <token>
Content-Type: application/json

{
  "mediaType": "image",
  "resourceType": "image"
}
```

**Response:**
```json
{
  "success": true,
  "uploadParams": {
    "signature": "abc123...",
    "timestamp": 1234567890,
    "folder": "Krieta/Chats/Direct/Images",
    "resourceType": "image",
    "apiKey": "your_api_key",
    "cloudName": "your_cloud_name"
  }
}
```

### 2. Validate Media URL
Validate uploaded media before sending message.

```http
POST /api/v1/chat/media/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "mediaUrl": "https://res.cloudinary.com/...",
  "mediaType": "image"
}
```

**Response:**
```json
{
  "success": true,
  "sanitizedUrl": "https://res.cloudinary.com/...",
  "mediaType": "image"
}
```

### 3. Validate External Link
Validate external links before sharing.

```http
POST /api/v1/chat/link/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "success": true,
  "sanitizedUrl": "https://example.com/article"
}
```

### 4. Send Message with Media
Send message with validated media.

```http
POST /api/v1/chat/:chatId/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "payload": "Check out this photo!",
  "mediaUrl": "https://res.cloudinary.com/...",
  "mediaType": "image"
}
```

### 5. Get Group Avatar Upload Signature
Generate signature for group avatar upload (admin only).

```http
POST /api/v1/chat/:chatId/avatar/signature
Authorization: Bearer <token>
```

## Client Implementation Flow

### Upload Flow
```
1. User selects file
2. Client validates file type and size
3. Request upload signature from backend
4. Upload directly to Cloudinary with signature
5. Validate uploaded URL with backend
6. Send message with validated media URL
```

### Example Client Code (Kotlin)
```kotlin
// 1. Get upload signature
val response = api.getUploadSignature(chatId, "image", "image")
val params = response.uploadParams

// 2. Upload to Cloudinary
val cloudinaryUrl = uploadToCloudinary(
    file = selectedFile,
    signature = params.signature,
    timestamp = params.timestamp,
    folder = params.folder,
    apiKey = params.apiKey,
    cloudName = params.cloudName
)

// 3. Validate uploaded URL
val validation = api.validateMedia(cloudinaryUrl, "image")

// 4. Send message with media
api.sendMessage(
    chatId = chatId,
    payload = messageText,
    mediaUrl = validation.sanitizedUrl,
    mediaType = "image"
)
```

## Security Best Practices

### Backend
1. ✅ Always validate media URLs before saving
2. ✅ Use signed uploads (no upload presets)
3. ✅ Verify user is chat participant
4. ✅ Sanitize all text content
5. ✅ Enforce folder restrictions
6. ✅ Rate limit upload requests

### Frontend
1. Validate file type before upload
2. Show file size before upload
3. Display upload progress
4. Handle upload errors gracefully
5. Preview media before sending
6. Compress images/videos if needed

## Error Handling

### Common Errors
- `403`: Not authorized to upload in this chat
- `400`: Invalid file type or size
- `400`: Invalid media URL
- `400`: URL contains malicious content
- `404`: Chat not found

### Error Response Format
```json
{
  "success": false,
  "error": "File type not allowed for security reasons"
}
```

## Database Schema
No schema changes required. Uses existing `Message` model:

```prisma
model Message {
  id              String   @id @default(uuid())
  chatId          String
  senderId        String
  payload         String   @db.Text
  mediaUrl        String?  // Cloudinary URL
  mediaType       String?  // image, video, document
  // ... other fields
}
```

## Cloudinary Configuration
Uses existing Cloudinary setup from:
- `backend/src/config/cloudinary.ts`
- Environment variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Testing Checklist

### Security Tests
- [ ] Upload executable file (should be blocked)
- [ ] Upload file with malicious extension
- [ ] Send URL with XSS payload
- [ ] Send localhost URL
- [ ] Send URL with JavaScript protocol
- [ ] Upload oversized file
- [ ] Upload to wrong folder
- [ ] Upload without being participant

### Functional Tests
- [ ] Upload image in direct chat
- [ ] Upload video in group chat
- [ ] Upload PDF document
- [ ] Share external link
- [ ] Update group avatar (admin)
- [ ] Forward message with media
- [ ] Reply to message with media
- [ ] Delete message with media

## Monitoring

### Metrics to Track
- Upload success/failure rate
- Average upload size
- Media type distribution
- Validation rejection reasons
- Upload latency

### Logs to Monitor
- `[Chat Media] Upload signature generated`
- `[Chat Media] Media validation failed: <reason>`
- `[Chat Media] Malicious content detected`
- `[Chat Media] Upload successful`

## Future Enhancements
- [ ] Voice message support
- [ ] Image compression on upload
- [ ] Video thumbnail generation
- [ ] Media gallery view
- [ ] Media download tracking
- [ ] Virus scanning integration
- [ ] Content moderation AI
- [ ] Media expiration (ephemeral)
