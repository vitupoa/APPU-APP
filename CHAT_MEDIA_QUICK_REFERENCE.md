# Chat Media Upload - Quick Reference

## 🚀 Quick Start

### Backend Files Created
```
backend/src/utils/media-validator.ts          # Security validation utilities
backend/src/modules/chat/chat-media.controller.ts  # Media upload controller
backend/CHAT_MEDIA_UPLOAD.md                   # Full documentation
```

### Backend Files Modified
```
backend/src/modules/chat/chat.routes.ts        # Added media routes
backend/src/modules/chat/chat.validation.ts    # Added media schemas
backend/src/modules/chat/chat.service.ts       # Added URL validation
```

## 📋 Security Features

### ✅ File Type Validation
- Images: JPEG, PNG, GIF, WebP (max 10MB)
- Videos: MP4, WebM, QuickTime (max 100MB)
- Documents: PDF, DOC, DOCX (max 20MB)
- Blocked: .exe, .bat, .js, .sh, etc.

### ✅ URL Sanitization
- Only HTTPS allowed
- Only Cloudinary domains
- XSS pattern detection
- Query parameter removal
- No localhost/private IPs

### ✅ Content Security
- Script tag removal
- Event handler blocking
- Iframe/embed blocking
- JavaScript protocol blocking
- Payload length limits (10,000 chars)

## 🔑 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/chat/:chatId/media/signature` | POST | Get upload signature |
| `/chat/media/validate` | POST | Validate media URL |
| `/chat/link/validate` | POST | Validate external link |
| `/chat/:chatId/avatar/signature` | POST | Get avatar signature |
| `/chat/:chatId/messages` | POST | Send message with media |

## 📁 Cloudinary Folders

```
Runinga/
├── Chats/
│   ├── Direct/
│   │   ├── Images/
│   │   └── Videos/
│   ├── Group/
│   │   ├── Images/
│   │   └── Videos/
│   ├── Chama/
│   │   ├── Images/
│   │   └── Videos/
│   └── GroupAvatar/
│       └── Images/
```

## 🔄 Upload Flow

```
1. User selects file
   ↓
2. Client validates locally (type, size, extension)
   ↓
3. Request upload signature from backend
   POST /chat/:chatId/media/signature
   ↓
4. Upload directly to Cloudinary (signed)
   POST https://api.cloudinary.com/v1_1/.../upload
   ↓
5. Validate uploaded URL with backend
   POST /chat/media/validate
   ↓
6. Send message with validated URL
   POST /chat/:chatId/messages
```

## 💻 Code Examples

### Get Upload Signature
```typescript
POST /api/v1/chat/:chatId/media/signature
{
  "mediaType": "image",
  "resourceType": "image"
}
```

### Validate Media
```typescript
POST /api/v1/chat/media/validate
{
  "mediaUrl": "https://res.cloudinary.com/...",
  "mediaType": "image"
}
```

### Send Message with Media
```typescript
POST /api/v1/chat/:chatId/messages
{
  "payload": "Check this out!",
  "mediaUrl": "https://res.cloudinary.com/...",
  "mediaType": "image"
}
```

## 🛡️ Security Checks

### Backend Validation
- ✅ User is chat participant
- ✅ File type allowed
- ✅ File size within limits
- ✅ URL from Cloudinary only
- ✅ URL uses HTTPS
- ✅ No malicious patterns
- ✅ Correct folder structure
- ✅ Payload sanitization

### Frontend Validation
- File type check
- File size check
- Extension check
- Preview before send
- Upload progress
- Error handling

## 🧪 Testing Commands

### Test File Upload
```bash
# Get signature
curl -X POST http://localhost:3000/api/v1/chat/{chatId}/media/signature \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"mediaType":"image","resourceType":"image"}'

# Validate media
curl -X POST http://localhost:3000/api/v1/chat/media/validate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"mediaUrl":"https://res.cloudinary.com/...","mediaType":"image"}'
```

### Test Security
```bash
# Should fail - executable file
curl -X POST .../media/validate \
  -d '{"mediaUrl":"https://example.com/malware.exe"}'

# Should fail - XSS attempt
curl -X POST .../media/validate \
  -d '{"mediaUrl":"https://example.com/<script>alert(1)</script>"}'

# Should fail - localhost
curl -X POST .../link/validate \
  -d '{"url":"http://localhost:3000/admin"}'
```

## 📊 Monitoring

### Key Metrics
- Upload success rate
- Validation rejection rate
- Average file size
- Media type distribution
- Security blocks

### Log Messages
```
[Chat Media] Upload signature generated for chat: {chatId}
[Chat Media] Media validation failed: {reason}
[Chat Media] Malicious content detected in URL
[Chat Media] Upload successful: {publicId}
```

## 🚨 Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | Not chat participant | Verify user in chat |
| 400 Bad Request | Invalid file type | Check allowed types |
| 400 Bad Request | File too large | Reduce file size |
| 400 Bad Request | Malicious content | Remove harmful patterns |
| 404 Not Found | Chat doesn't exist | Verify chat ID |

## 🔧 Environment Variables

Required in `.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 📱 Mobile Implementation

See `CHAT_MEDIA_KOTLIN_EXAMPLE.kt` for:
- Kotlin Multiplatform implementation
- Local file validation
- Cloudinary upload
- Backend validation
- Error handling
- UI components

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] Cloudinary webhook setup (optional)
- [ ] Rate limiting configured
- [ ] File size limits tested
- [ ] Security validation tested
- [ ] Error handling tested
- [ ] Mobile app integrated
- [ ] Monitoring enabled

## 🔗 Related Documentation

- `backend/CHAT_MEDIA_UPLOAD.md` - Full documentation
- `backend/src/config/cloudinary.ts` - Cloudinary config
- `CHAT_MEDIA_KOTLIN_EXAMPLE.kt` - Mobile example
- `backend/CLOUDINARY_SECURITY_COMPLETE.md` - Security guide

## 💡 Tips

1. **Always validate on both client and server**
2. **Use signed uploads (no presets)**
3. **Sanitize all user input**
4. **Monitor upload patterns**
5. **Compress media before upload**
6. **Show upload progress to users**
7. **Handle errors gracefully**
8. **Test security thoroughly**

## 🎯 Next Steps

1. Test all endpoints with Postman/curl
2. Implement mobile UI for media picker
3. Add upload progress indicators
4. Implement media preview
5. Add image compression
6. Set up monitoring/alerts
7. Test security scenarios
8. Deploy to production
