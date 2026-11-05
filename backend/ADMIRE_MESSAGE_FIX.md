# Admire/Love and Message Button Fixes

## Issues Fixed

### 1. Admire/Love Functionality
**Problem:** When clicking the +plus button or Admire button on profiles (in shorts, contests, or profile screen), the admire action doesn't work.

**Root Cause:** 
- The `admires` table requires an `id` field (UUID) which wasn't being generated
- Duplicate admire attempts weren't being handled properly
- The unlove logic was deleting the admire relationship instead of just removing lover status

**Solution:**
Updated `/backend/src/modules/user/user.service.ts`:

1. **Fixed `admire()` method:**
   - Added check for existing admire relationship to prevent duplicates
   - Added `crypto.randomUUID()` to generate the required `id` field
   - Returns existing relationship status if already admiring

2. **Fixed `unlove()` method:**
   - Now properly sets `is_lovers` to `false` on both sides
   - Maintains the admiring relationship (doesn't delete the record)
   - Updates both the admirer→admired and admired→admirer relationships

### 2. Message Button Functionality
**Problem:** Message button is not clickable and doesn't initiate chat with the creator.

**Root Cause:** Frontend not properly calling the existing chat creation endpoint.

**Solution:**
The backend endpoint already exists and works correctly:

**Endpoint:** `POST /api/v1/chat/direct`

**Request Body:**
```json
{
  "recipient_id": "creator_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "chat": {
    "id": "chat_id",
    "type": "DIRECT",
    "participants": [...],
    "messages": [...]
  }
}
```

## API Endpoints Summary

### Admire/Love Endpoints

1. **Admire a User**
   - **POST** `/api/v1/users/:id/admire`
   - Admires a user. If mutual, both become lovers automatically.
   - Returns: `{ admired: true, isLovers: boolean }`

2. **Unadmire a User**
   - **DELETE** `/api/v1/users/:id/admire`
   - Removes admire relationship. If lovers, both lose lover status.
   - Returns: `{ admired: false }`

3. **Unlove a User**
   - **DELETE** `/api/v1/users/:id/love`
   - Removes lover status but keeps admiring relationship.
   - Returns: `{ isLovers: false, admiring: true }`

4. **Get Admirers**
   - **GET** `/api/v1/users/:id/admirers?cursor=xxx`
   - Returns paginated list of users who admire this user.

5. **Get Admiring**
   - **GET** `/api/v1/users/:id/admiring?cursor=xxx`
   - Returns paginated list of users this user admires.

6. **Get Lovers**
   - **GET** `/api/v1/users/:id/lovers?cursor=xxx`
   - Returns paginated list of mutual admirers (lovers).

### Chat/Message Endpoints

1. **Create Direct Chat**
   - **POST** `/api/v1/chat/direct`
   - Body: `{ "recipient_id": "user_id" }`
   - Creates or returns existing direct chat with a user.

2. **Send Message**
   - **POST** `/api/v1/chat/:chatId/messages`
   - Body: `{ "payload": "message text", "media_url": "optional", "media_type": "optional" }`
   - Sends a message in the chat.

## Frontend Integration Guide

### Admire Button Implementation

```kotlin
// When user clicks Admire button
fun admireCreator(creatorId: String) {
    viewModelScope.launch {
        try {
            val response = apiService.admireUser(creatorId)
            if (response.isLovers) {
                // Show "You are now lovers!"
                updateUIToLoversState()
            } else {
                // Show "You are now admiring"
                updateUIToAdmiringState()
            }
        } catch (e: Exception) {
            // Handle error (e.g., "Cannot admire yourself")
            showError(e.message)
        }
    }
}

// When user clicks Unadmire button
fun unadmireCreator(creatorId: String) {
    viewModelScope.launch {
        try {
            apiService.unadmireUser(creatorId)
            updateUIToNotAdmiringState()
        } catch (e: Exception) {
            showError(e.message)
        }
    }
}
```

### Message Button Implementation

```kotlin
// When user clicks Message button
fun messageCreator(creatorId: String) {
    viewModelScope.launch {
        try {
            // Create or get existing chat
            val response = apiService.createDirectChat(
                CreateChatRequest(recipient_id = creatorId)
            )
            
            // Navigate to chat screen with the chat ID
            navigateToChatScreen(response.chat.id)
        } catch (e: Exception) {
            if (e.message?.contains("locked") == true) {
                // Show locked chat message with unlock task
                showLockedChatDialog(creatorId)
            } else {
                showError(e.message)
            }
        }
    }
}
```

## Testing

### Test Admire Functionality
1. Open any short/contest
2. Click the profile picture to view creator profile
3. Click "Admire" button → Should show success
4. Check if button changes to "Admiring" state
5. Click "Unadmire" button → Should show success

### Test Message Functionality
1. Open any creator profile
2. Click "Message" button
3. Should navigate to chat screen with that creator
4. If chat is locked, should show unlock task modal

### Test Mutual Love
1. User A admires User B
2. User B admires User A
3. Both should automatically become "Lovers"
4. Both should see "Lovers" badge on each other's profiles

## Database Schema Reference

### Admires Table
```sql
CREATE TABLE admires (
  id TEXT PRIMARY KEY,
  admirer_id TEXT NOT NULL REFERENCES user(id),
  admired_id TEXT NOT NULL REFERENCES user(id),
  is_lovers BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(admirer_id, admired_id)
);
```

## Notes

1. **Self-Admire Protection:** Users cannot admire themselves. API returns error.

2. **Automatic Lover Detection:** When two users admire each other, both records are automatically updated with `is_lovers = true`.

3. **Locked Chat Feature:** Some creators may have locked chats requiring task completion before messaging. Handle this in the UI.

4. **Real-time Updates:** Chat messages are broadcast via WebSocket. Subscribe to `chat:new_message` event.

5. **Profile Relationship Status:** When viewing a profile, the API returns `relationshipStatus`:
   - `"NONE"` - No relationship
   - `"ADMIRING"` - You admire them
   - `"ADMIRED_BY"` - They admire you
   - `"LOVERS"` - Mutual admirers

## Error Handling

Common errors to handle:

- `"Cannot admire yourself"` - User tried to admire their own profile
- `"Not admiring this user"` - User tried to unadmire someone they don't admire
- `"Not lovers with this user"` - User tried to unlove someone they're not lovers with
- `"Chat is locked. Unlock fee: X Rc"` - Chat requires task completion
- `"User not found"` - Creator profile doesn't exist

## Deployment

All fixes are in the backend service layer. No database migrations required. Simply restart the backend service to apply changes.
