# Quick Fix Guide for Frontend Developers

## 🔧 What Was Fixed in Backend

1. ✅ Admire button now works properly
2. ✅ Love/Unlove logic fixed
3. ✅ Duplicate admire handling added
4. ✅ Message button endpoint confirmed working

## 📱 Frontend Changes Needed

### 1. Fix Admire Button in Profile Screen

**File to modify:** `ProfileScreen.kt` or similar

**Issue:** When clicking Admire button, it doesn't call the API properly.

**Fix:**
```kotlin
// In your ProfileViewModel or similar
fun toggleAdmire(creatorId: String, isCurrentlyAdmiring: Boolean) {
    viewModelScope.launch {
        try {
            if (isCurrentlyAdmiring) {
                // Unadmire
                api.delete("/api/v1/users/$creatorId/admire")
                _admiringState.value = false
            } else {
                // Admire
                val response = api.post<AdmireResponse>("/api/v1/users/$creatorId/admire")
                _admiringState.value = true
                _isLovers.value = response.isLovers
            }
        } catch (e: Exception) {
            // Show error toast
            _errorMessage.value = e.message
        }
    }
}
```

### 2. Fix +Plus Button in Shorts/Contests

**Files to modify:** `ShortsScreen.kt`, `ContestsScreen.kt`

**Issue:** Plus button on creator avatar doesn't admire.

**Fix:**
```kotlin
// In the composable where you show the creator avatar
IconButton(
    onClick = { 
        // Call the same admire function
        profileViewModel.toggleAdmire(
            creatorId = creator.id, 
            isCurrentlyAdmiring = creator.isAdmiring
        )
    }
) {
    Icon(
        imageVector = if (creator.isAdmiring) {
            Icons.Default.Check
        } else {
            Icons.Default.Add
        },
        contentDescription = "Admire"
    )
}
```

### 3. Fix Message Button

**File to modify:** `ProfileScreen.kt`

**Issue:** Message button is not clickable.

**Fix:**
```kotlin
Button(
    onClick = {
        viewModelScope.launch {
            try {
                // Create or get existing chat
                val response = api.post<ChatResponse>("/api/v1/chat/direct") {
                    body = CreateChatRequest(recipient_id = creatorId)
                }
                
                // Navigate to chat
                navController.navigate("chat/${response.chat.id}")
            } catch (e: Exception) {
                if (e.message?.contains("locked") == true) {
                    // Show locked chat dialog
                    showLockedChatDialog(creatorId)
                } else {
                    showError(e.message)
                }
            }
        }
    },
    enabled = true // Make sure it's enabled!
) {
    Icon(Icons.Default.Message, contentDescription = null)
    Text("Message")
}
```

## 🌐 API Endpoints Reference

### Admire Actions
```kotlin
// POST /api/v1/users/:id/admire
data class AdmireResponse(
    val admired: Boolean,
    val isLovers: Boolean
)

// DELETE /api/v1/users/:id/admire
// Returns: { admired: false }

// DELETE /api/v1/users/:id/love
// Returns: { isLovers: false, admiring: true }
```

### Chat Creation
```kotlin
// POST /api/v1/chat/direct
data class CreateChatRequest(
    val recipient_id: String
)

data class ChatResponse(
    val success: Boolean,
    val chat: Chat
)

data class Chat(
    val id: String,
    val type: String,
    val participants: List<Participant>,
    // ... other fields
)
```

## 🧪 Testing Checklist

- [ ] Open Shorts feed
- [ ] Click on creator profile picture
- [ ] Profile loads correctly
- [ ] Click "Admire" button → Shows success message
- [ ] Button changes to "Admiring" state
- [ ] Click "Unadmire" → Button goes back to "Admire"
- [ ] Click "Message" button → Opens chat screen
- [ ] Test on Contests tab too
- [ ] Test mutual love (have 2 accounts admire each other)

## ⚠️ Common Issues & Solutions

### Issue: "Cannot admire yourself"
**Cause:** User tried to admire their own profile  
**Fix:** Hide admire button on user's own profile
```kotlin
if (profile.id != currentUserId) {
    AdmireButton(onClick = { ... })
}
```

### Issue: "Chat is locked"
**Cause:** Creator has locked chat requiring task completion  
**Fix:** Show unlock task dialog
```kotlin
if (errorMessage.contains("locked")) {
    LockedChatDialog(
        creatorId = creatorId,
        unlockFee = extractFeeFromError(errorMessage),
        onUnlock = { /* Navigate to task completion */ }
    )
}
```

### Issue: Button not updating after admire
**Cause:** UI state not updating  
**Fix:** Make sure you're updating the state
```kotlin
// In ViewModel
private val _admiringState = MutableStateFlow(false)
val admiringState: StateFlow<Boolean> = _admiringState

// After successful admire
_admiringState.value = true
```

## 🎯 Quick Test Commands

Test admire from terminal:
```bash
# Admire a user
curl -X POST http://localhost:3000/api/v1/users/USER_ID/admire \
  -H "Authorization: Bearer YOUR_TOKEN"

# Unadmire
curl -X DELETE http://localhost:3000/api/v1/users/USER_ID/admire \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create chat
curl -X POST http://localhost:3000/api/v1/chat/direct \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id":"CREATOR_ID"}'
```

## 📞 Support

If you encounter any issues:
1. Check network logs to see the actual API request/response
2. Verify the token is being sent in the header
3. Check if the backend is returning the expected response
4. Verify the state management is working correctly

The backend fixes are complete. Just update the frontend UI to properly call these existing endpoints!
