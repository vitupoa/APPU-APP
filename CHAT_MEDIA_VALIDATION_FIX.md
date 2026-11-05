# Chat Media Upload Validation Fix

## Problem
When sending media in chat, users encountered a validation error:
```
Encountered an unknown key 'error' at offset 2 at path: $
Use 'ignoreUnknownKeys = true' in 'Json {}' builder or '@JsonIgnoreUnknownKeys' annotation to ignore unknown keys.
JSON input: {"error":"Validation failed","details":[{"path":"body.media_type","message":"Required"}]}
```

## Root Cause
The issue had two parts:

### 1. Field Naming Mismatch (Snake Case vs Camel Case)
- **Mobile Client** sent: `mediaUrl` and `mediaType` (camelCase)
- **Backend Expected**: `media_url` and `media_type` (snake_case)

### 2. Validation Logic
The backend validation didn't properly enforce that when sending media, both `media_url` and `media_type` must be provided together.

## Solutions Applied

### Backend Fix (backend/src/modules/chat/chat.validation.ts)
Added refinement validation to ensure both fields are provided together:

```typescript
export const sendMessageSchema = z.object({
  body: z.object({
    payload: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
    media_url: z.string().url().optional(),
    media_type: z.enum(['image', 'video', 'document']).optional(),
    replyToId: z.string().uuid().optional(),
  }).refine(
    (data) => {
      if (data.media_url && !data.media_type) return false;
      if (data.media_type && !data.media_url) return false;
      return true;
    },
    {
      message: 'Both media_url and media_type must be provided together',
    }
  ),
});
```

### Mobile Client Fix (composeApp/src/.../ChatDtos.kt)
Added `@SerialName` annotations to match backend expectations:

```kotlin
@Serializable
data class SendMessageRequest(
    val payload: String,
    @kotlinx.serialization.SerialName("media_url")
    val mediaUrl: String? = null,
    @kotlinx.serialization.SerialName("media_type")
    val mediaType: String? = null,
    val replyToId: String? = null,
    val forwardedFromId: String? = null
)
```

## Testing
To test the fix:

1. **Restart Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Rebuild Mobile App**:
   ```bash
   ./gradlew :composeApp:assembleDebug
   ```

3. **Test Media Upload**:
   - Open a chat
   - Select an image/video
   - Add a caption (optional)
   - Send the media
   - Verify no validation errors occur

## Related Files
- `backend/src/modules/chat/chat.validation.ts` - Validation schema
- `composeApp/src/commonMain/kotlin/com/runinga/feature/chat/data/remote/dto/ChatDtos.kt` - Request DTO
- `backend/CHAT_MEDIA_UPLOAD.md` - Full media upload documentation

## Additional Notes
- The fix ensures consistent field naming across the entire stack
- Both `media_url` and `media_type` are still optional, but if one is provided, both must be provided
- This follows the existing pattern used in other DTOs (e.g., `recipient_id` in `CreateDirectChatRequest`)
