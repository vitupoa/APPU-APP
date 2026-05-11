# Chat Media Upload - Testing Guide

## 🧪 Security Testing

### Test 1: Dangerous File Extensions
**Objective**: Verify dangerous file types are blocked

```bash
# Test .exe file
curl -X POST http://localhost:3000/api/v1/chat/media/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaUrl": "https://res.cloudinary.com/test/malware.exe",
    "mediaType": "document"
  }'

# Expected: 400 Bad Request
# Error: "Only Cloudinary URLs are allowed" or validation fails
```

**Other dangerous extensions to test**:
- .bat, .cmd, .com, .pif, .scr
- .vbs, .js, .jar, .msi
- .sh, .bash, .ps1, .psm1

### Test 2: XSS Attacks
**Objective**: Verify XSS patterns are blocked

```bash
# Test script tag in URL
curl -X POST http://localhost:3000/api/v1/chat/link/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com/<script>alert(1)</script>"
  }'

# Expected: 400 Bad Request
# Error: "URL contains potentially malicious content"
```

**Other XSS patterns to test**:
- `javascript:alert(1)`
- `<iframe src="evil.com">`
- `<img onerror="alert(1)">`
- `onclick="alert(1)"`

### Test 3: Private/Local URLs
**Objective**: Verify localhost and private IPs are blocked

```bash
# Test localhost
curl -X POST http://localhost:3000/api/v1/chat/link/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:3000/admin"}'

# Expected: 400 Bad Request
# Error: "Private/local URLs are not allowed"
```

**Other private URLs to test**:
- `http://127.0.0.1/`
- `http://10.0.0.1/`
- `http://192.168.1.1/`
- `http://172.16.0.1/`

### Test 4: Non-HTTPS URLs
**Objective**: Verify only HTTPS is allowed for media

```bash
# Test HTTP URL
curl -X POST http://localhost:3000/api/v1/chat/media/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaUrl": "http://res.cloudinary.com/test/image.jpg",
    "mediaType": "image"
  }'

# Expected: 400 Bad Request
# Error: "Only HTTPS URLs are allowed"
```

### Test 5: Non-Cloudinary URLs
**Objective**: Verify only Cloudinary URLs are accepted

```bash
# Test external URL
curl -X POST http://localhost:3000/api/v1/chat/media/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaUrl": "https://evil.com/malware.jpg",
    "mediaType": "image"
  }'

# Expected: 400 Bad Request
# Error: "Only Cloudinary URLs are allowed"
```

### Test 6: Unauthorized Access
**Objective**: Verify non-participants cannot upload

```bash
# Try to get signature for chat you're not in
curl -X POST http://localhost:3000/api/v1/chat/WRONG_CHAT_ID/media/signature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaType": "image",
    "resourceType": "image"
  }'

# Expected: 403 Forbidden
# Error: "Not authorized to upload media in this chat"
```

### Test 7: Oversized Files
**Objective**: Verify file size limits (client-side validation)

Test files:
- Image > 10MB (should fail)
- Video > 100MB (should fail)
- Document > 20MB (should fail)

### Test 8: Message Payload Length
**Objective**: Verify payload is limited to 10,000 characters

```bash
# Send message with 10,001 characters
curl -X POST http://localhost:3000/api/v1/chat/CHAT_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": "'$(python -c 'print("A" * 10001)')'",
    "mediaUrl": "https://res.cloudinary.com/test/image.jpg",
    "mediaType": "image"
  }'

# Expected: 400 Bad Request or payload truncated to 10,000
```

## ✅ Functional Testing

### Test 9: Upload Image in Direct Chat
**Steps**:
1. Get upload signature
2. Upload to Cloudinary
3. Validate URL
4. Send message

```bash
# Step 1: Get signature
SIGNATURE=$(curl -X POST http://localhost:3000/api/v1/chat/CHAT_ID/media/signature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mediaType":"image","resourceType":"image"}')

# Step 2: Upload to Cloudinary (use signature from step 1)
# Use Cloudinary API with signature, timestamp, folder, api_key

# Step 3: Validate URL
curl -X POST http://localhost:3000/api/v1/chat/media/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mediaUrl": "CLOUDINARY_URL_FROM_STEP_2",
    "mediaType": "image"
  }'

# Step 4: Send message
curl -X POST http://localhost:3000/api/v1/chat/CHAT_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": "Check out this image!",
    "mediaUrl": "VALIDATED_URL_FROM_STEP_3",
    "mediaType": "image"
  }'

# Expected: 201 Created with message object
```

### Test 10: Upload Video in Group Chat
**Steps**: Same as Test 9, but with:
- `"mediaType": "video"`
- `"resourceType": "video"`
- Video file

### Test 11: Upload PDF Document
**Steps**: Same as Test 9, but with:
- `"mediaType": "document"`
- `"resourceType": "raw"`
- PDF file

### Test 12: Share External Link
```bash
curl -X POST http://localhost:3000/api/v1/chat/link/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Expected: 200 OK with sanitized URL
```

### Test 13: Update Group Avatar (Admin Only)
```bash
# As admin
curl -X POST http://localhost:3000/api/v1/chat/GROUP_CHAT_ID/avatar/signature \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Expected: 200 OK with upload params

# As non-admin
curl -X POST http://localhost:3000/api/v1/chat/GROUP_CHAT_ID/avatar/signature \
  -H "Authorization: Bearer MEMBER_TOKEN"

# Expected: 403 Forbidden
```

### Test 14: Forward Message with Media
```bash
curl -X POST http://localhost:3000/api/v1/chat/messages/MESSAGE_ID/forward \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"targetChatId": "TARGET_CHAT_ID"}'

# Expected: 200 OK with forwarded message
```

### Test 15: Reply to Message with Media
```bash
curl -X POST http://localhost:3000/api/v1/chat/CHAT_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": "Nice photo!",
    "replyToId": "MESSAGE_WITH_MEDIA_ID"
  }'

# Expected: 201 Created with reply message
```

## 🔍 Edge Cases

### Test 16: Empty Payload with Media
```bash
curl -X POST http://localhost:3000/api/v1/chat/CHAT_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": " ",
    "mediaUrl": "https://res.cloudinary.com/test/image.jpg",
    "mediaType": "image"
  }'

# Expected: 400 Bad Request (payload required)
```

### Test 17: Media Without Payload
```bash
curl -X POST http://localhost:3000/api/v1/chat/CHAT_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payload": "📷",
    "mediaUrl": "https://res.cloudinary.com/test/image.jpg",
    "mediaType": "image"
  }'

# Expected: 201 Created (minimal payload with media)
```

### Test 18: Multiple Media in One Message
```bash
# Currently not supported - should send separate messages
# Test that only one mediaUrl is accepted
```

### Test 19: Concurrent Uploads
```bash
# Send 10 upload requests simultaneously
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/v1/chat/CHAT_ID/media/signature \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"mediaType":"image","resourceType":"image"}' &
done
wait

# Expected: All should succeed with unique signatures
```

### Test 20: Upload After Leaving Chat
```bash
# Step 1: Leave chat
curl -X POST http://localhost:3000/api/v1/chat/CHAT_ID/leave \
  -H "Authorization: Bearer YOUR_TOKEN"

# Step 2: Try to upload
curl -X POST http://localhost:3000/api/v1/chat/CHAT_ID/media/signature \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mediaType":"image","resourceType":"image"}'

# Expected: 403 Forbidden
```

## 📊 Performance Testing

### Test 21: Upload Speed
- Measure time from signature request to message sent
- Target: < 5 seconds for 5MB image

### Test 22: Validation Speed
- Measure URL validation time
- Target: < 100ms

### Test 23: Concurrent Users
- Simulate 100 users uploading simultaneously
- Monitor server resources

## 🐛 Error Handling

### Test 24: Network Failure During Upload
- Disconnect network during Cloudinary upload
- Verify graceful error handling

### Test 25: Invalid Cloudinary Response
- Mock Cloudinary to return error
- Verify error is caught and reported

### Test 26: Database Failure
- Simulate database connection loss
- Verify error handling

## ✅ Test Checklist

### Security Tests
- [ ] Dangerous file extensions blocked
- [ ] XSS patterns blocked
- [ ] Private/local URLs blocked
- [ ] Non-HTTPS URLs blocked
- [ ] Non-Cloudinary URLs blocked
- [ ] Unauthorized access blocked
- [ ] Oversized files blocked
- [ ] Payload length limited

### Functional Tests
- [ ] Image upload in direct chat
- [ ] Video upload in group chat
- [ ] PDF upload
- [ ] External link sharing
- [ ] Group avatar update (admin)
- [ ] Message forwarding with media
- [ ] Message reply with media
- [ ] Delete message with media

### Edge Cases
- [ ] Empty payload with media
- [ ] Media without payload
- [ ] Concurrent uploads
- [ ] Upload after leaving chat
- [ ] Invalid media type
- [ ] Malformed URLs

### Performance Tests
- [ ] Upload speed acceptable
- [ ] Validation speed acceptable
- [ ] Concurrent users handled

### Error Handling
- [ ] Network failures handled
- [ ] Invalid responses handled
- [ ] Database failures handled

## 📝 Test Report Template

```markdown
## Test Report: Chat Media Upload

**Date**: YYYY-MM-DD
**Tester**: Your Name
**Environment**: Development/Staging/Production

### Security Tests
| Test | Status | Notes |
|------|--------|-------|
| Dangerous extensions | ✅/❌ | |
| XSS patterns | ✅/❌ | |
| Private URLs | ✅/❌ | |
| ... | | |

### Functional Tests
| Test | Status | Notes |
|------|--------|-------|
| Image upload | ✅/❌ | |
| Video upload | ✅/❌ | |
| ... | | |

### Issues Found
1. Issue description
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual

### Recommendations
- Recommendation 1
- Recommendation 2

### Sign-off
- [ ] All critical tests passed
- [ ] All security tests passed
- [ ] Ready for production
```

## 🚀 Automated Testing

### Jest Test Example
```typescript
describe('Chat Media Upload', () => {
  it('should block dangerous file extensions', async () => {
    const result = validateMediaFile('application/x-msdownload', 1024, 'malware.exe');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('not allowed');
  });

  it('should validate Cloudinary URLs', async () => {
    const result = validateMediaUrl('https://res.cloudinary.com/test/image.jpg');
    expect(result.isValid).toBe(true);
  });

  it('should block XSS in URLs', async () => {
    const result = validateExternalLink('javascript:alert(1)');
    expect(result.isValid).toBe(false);
  });
});
```

## 🎯 Success Criteria

✅ All security tests pass
✅ All functional tests pass
✅ No critical bugs found
✅ Performance meets targets
✅ Error handling works correctly
✅ Documentation is accurate
