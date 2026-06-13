# Chat User Search Bug Fix

## Issue
When searching for users to initiate a new direct chat, clicking on a user in the search results did nothing - the app didn't navigate to the chat room.

## Root Cause
The code had several issues:
1. Missing proper import for `ChatRoomScreen`
2. No loading state to prevent multiple clicks
3. No try-catch for exception handling
4. Silent failures when API calls failed

## Fix Applied

### Updated: `UserSearchScreen.kt`

**Changes made:**

1. **Added proper import:**
```kotlin
import com.krieta.feature.chat.presentation.room.ChatRoomScreen
```
Previously used fully qualified name which could cause issues.

2. **Added loading state:**
```kotlin
var isCreatingChat by remember { mutableStateOf(false) }
```
This prevents multiple rapid clicks while chat is being created.

3. **Added try-catch error handling:**
```kotlin
try {
    when (val result = chatRepository.createDirectChat(user.id)) {
        is NetworkResult.Success -> {
            isCreatingChat = false
            navigator.replace(ChatRoomScreen(
                result.data.id,
                user.displayName
            ))
        }
        is NetworkResult.Error -> {
            isCreatingChat = false
            snackbarHostState.showSnackbar(
                result.message ?: "Failed to create chat"
            )
        }
        else -> {
            isCreatingChat = false
        }
    }
} catch (e: Exception) {
    isCreatingChat = false
    snackbarHostState.showSnackbar(
        e.message ?: "An error occurred"
    )
}
```

4. **Added loading indicator in UI:**
```kotlin
UserSearchItem(
    user = user,
    isLoading = isCreatingChat,  // Pass loading state
    onClick = {
        if (!isCreatingChat) {  // Prevent clicks when loading
            // ... create chat
        }
    }
)
```

5. **Updated UserSearchItem to show loading:**
```kotlin
@Composable
fun UserSearchItem(
    user: UserSearchResult,
    isLoading: Boolean = false,  // NEW parameter
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(enabled = !isLoading, onClick = onClick)  // Disable when loading
            // ...
    ) {
        // ... avatar and text
        
        if (isLoading) {  // Show spinner when creating chat
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                strokeWidth = 2.dp
            )
        }
    }
}
```

## How It Works Now

1. User searches for someone
2. User clicks on search result
3. Loading spinner appears, button disabled
4. API call to `createDirectChat(userId)` is made
5. On success: Navigate to ChatRoomScreen with chatId
6. On error: Show error message via Snackbar, re-enable button
7. On exception: Show error message, re-enable button

## Backend Verification

The backend endpoint is working correctly:
- **Endpoint:** `POST /api/chat/direct`
- **Body:** `{ "recipient_id": "uuid" }`
- **Response:** `{ "success": true, "chat": { ... } }`

The DTO serialization is correct with `@SerialName("recipient_id")` annotation.

## Testing Steps

1. Open chat screen
2. Tap "+ New Chat" or search icon
3. Search for a user by name or username
4. Tap on a user from results
5. Loading indicator should appear
6. Should navigate to chat room with that user
7. If error occurs, snackbar shows error message

## Notes

- The fix includes proper error handling for both API errors and exceptions
- Loading state prevents double-clicks
- User gets visual feedback during chat creation
- Error messages are shown if something goes wrong
