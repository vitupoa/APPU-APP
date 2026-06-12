# 🚀 Quick Reference: Admire & Message Integration

## ✅ What's Fixed

| Feature | Status | Location |
|---------|--------|----------|
| Backend Admire API | ✅ Fixed | `backend/src/modules/user/user.service.ts` |
| Frontend Admire Button | ✅ Fixed | `ProfileViewModel.kt` → `toggleAdmire()` |
| Message Button | ✅ Fixed | `ProfileViewModel.kt` → `initiateChat()` |
| Shorts +Plus Button | ✅ Working | Already integrated in `ShortsScreen.kt` |
| Error Handling | ✅ Added | Snackbar in `ProfileScreen.kt` |
| Navigation | ✅ Added | NavigationEvents in `ProfileViewModel.kt` |

---

## 🎯 Quick Test Checklist

```
✅ 1. Open any profile → Click "Admire" → Button changes
✅ 2. Open any profile → Click "Message" → Opens chat
✅ 3. In Shorts → Click + button → Admires creator
✅ 4. Mutual admire → Both show "Lovers"
✅ 5. Click "Unadmire" → Button changes back
✅ 6. Locked chat → Shows error with unlock fee
```

---

## 📱 User Flow Examples

### Admiring a Creator from Shorts
```
1. User watches short
2. Clicks + button on avatar
3. ✅ Creator is admired
4. Navigate to profile → Shows "Unadmire"
```

### Messaging a Creator from Profile
```
1. User opens creator profile
2. Clicks "Message" button
3. ✅ Chat screen opens
4. User can start messaging
```

### Becoming Lovers
```
1. User A admires User B
2. User B admires User A
3. ✅ Both see "Unlove" button
4. ✅ Both show 💕 lovers badge
```

---

## 🔧 Key Code Snippets

### Backend: Create Admire with UUID
```typescript
const admire = await tx.admires.create({
  data: { 
    id: crypto.randomUUID(),
    admirer_id: admirerId, 
    admired_id: admiredId 
  }
});
```

### Frontend: Admire a User
```kotlin
// In ProfileViewModel
fun toggleAdmire() {
    when (val result = repository.admire(profile.id)) {
        is NetworkResult.Success -> {
            val isLovers = result.data
            // Update UI state
        }
    }
}
```

### Frontend: Message a User
```kotlin
// In ProfileViewModel
fun initiateChat(chatRepository: ChatRepository) {
    when (val result = chatRepository.createDirectChat(profile.id)) {
        is NetworkResult.Success -> {
            _navigationEvents.tryEmit(NavigationEvent.OpenChat(result.data.id))
        }
    }
}
```

### Frontend: Handle Chat Navigation
```kotlin
// In ProfileScreen
LaunchedEffect(Unit) {
    profileViewModel.navigationEvents.collect { event ->
        when (event) {
            is NavigationEvent.OpenChat -> {
                navigator.push(ChatRoomScreen(event.chatId))
            }
        }
    }
}
```

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot admire yourself"
**Cause:** User tried to admire their own profile  
**Solution:** Hide admire/message buttons on own profile
```kotlin
if (!isOwnProfile) {
    Button(onClick = { toggleAdmire() }) {
        Text("Admire")
    }
}
```

### Issue: Message button not working
**Cause:** ChatRepository not injected  
**Solution:** Add to ProfileScreen
```kotlin
val chatRepository = koinInject<ChatRepository>()
profileViewModel.initiateChat(chatRepository)
```

### Issue: Admire button doesn't update
**Cause:** State not being updated  
**Solution:** Check NetworkResult handling
```kotlin
when (result) {
    is NetworkResult.Success -> {
        // Update state here!
        _state.value = _state.value.copy(...)
    }
}
```

---

## 📡 API Quick Reference

```bash
# Admire user
POST /api/v1/users/:userId/admire
Response: { admired: true, isLovers: false }

# Unadmire user
DELETE /api/v1/users/:userId/admire
Response: { admired: false }

# Create chat
POST /api/v1/chat/direct
Body: { "recipient_id": "user_id" }
Response: { success: true, chat: { id: "...", ... } }
```

---

## 🎨 Button States Reference

```kotlin
when (relationshipStatus) {
    NONE -> "Admire" (Green)
    ADMIRING -> "Unadmire" (Gray)
    ADMIRED_BY -> "Love" (Green)
    LOVERS -> "Unlove" (Gray)
}
```

---

## ⚡ Performance Tips

1. **Debounce button clicks** - Prevent double-taps
2. **Show loading state** - Use CircularProgressIndicator
3. **Cache admire status** - For offline mode
4. **Batch requests** - For multiple admirers

---

## 🔒 Security Checks

- ✅ JWT token required for all requests
- ✅ Cannot admire yourself (backend validates)
- ✅ Locked chat requires task completion
- ✅ Profile must exist before admiring

---

## 📊 Testing Commands

```bash
# Test admire API
curl -X POST http://localhost:3000/api/v1/users/USER_ID/admire \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test chat creation
curl -X POST http://localhost:3000/api/v1/chat/direct \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id":"USER_ID"}'
```

---

## 🎉 Success Criteria

- [x] Admire button works in profile
- [x] +Plus button works in shorts
- [x] Message button opens chat
- [x] Mutual admires become lovers
- [x] Unadmire works correctly
- [x] Error messages show in Snackbar
- [x] Navigation events handled
- [x] Loading states shown

---

## 📞 Quick Help

**Backend not responding?**
- Check if server is running on port 3000
- Verify JWT token is valid
- Check network logs for errors

**Button not updating?**
- Check ProfileViewModel state updates
- Verify repository returns NetworkResult
- Check collectAsState() in composable

**Chat not opening?**
- Verify ChatRepository is injected
- Check navigation events are collected
- Verify ChatRoomScreen route exists

---

## ✨ That's It!

All features are now integrated and working. Test thoroughly and enjoy! 🚀

For detailed documentation, see:
- `INTEGRATION_COMPLETE.md` - Full technical details
- `FRONTEND_FIX_GUIDE.md` - Frontend implementation guide
- `ADMIRE_MESSAGE_FIX.md` - Backend fixes documentation
