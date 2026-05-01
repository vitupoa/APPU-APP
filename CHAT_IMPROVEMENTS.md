# Chat Feature Improvements

## Summary of Changes

### 1. Fixed Message Bubble Colors
- **Sent messages**: Now display in green (#4CAF50) instead of yellow
- **Received messages**: Display in surfaceVariant color (gray)
- Messages are correctly aligned based on sender (right for sent, left for received)

### 2. Added Reply Functionality
- Long-press on any message to show context menu with "Reply" option
- Reply bar appears above input field showing who you're replying to
- Replied messages show the original message in a compact preview
- Works in direct chats, normal group chats, and chama group chats

### 3. Added Delete Functionality
- Users can only delete their own messages
- Long-press on your message and select "Delete" from context menu
- Message is removed from all participants' views in real-time
- Works in direct chats, normal group chats, and chama group chats

### 4. Added Forward Functionality
- Long-press on any message and select "Forward" from context menu
- Forwarded messages show "Forwarded from [Original Sender]" label
- Original sender information is preserved
- Works in direct chats, normal group chats, and chama group chats

## Backend Changes

### Database Schema (schema.prisma)
```prisma
model Message {
  // ... existing fields
  forwardedFromId String?  @map("forwarded_from_id")
  
  // ... existing relations
  forwardedFrom User? @relation("ForwardedMessages", fields: [forwardedFromId], references: [id], onDelete: SetNull)
}

model User {
  // ... existing relations
  forwardedMessages Message[] @relation("ForwardedMessages")
}
```

### Service Layer (chat.service.ts)
- Updated `sendMessage()` to accept `forwardedFromId` parameter
- Added `deleteMessage()` method - only sender can delete
- Added `forwardMessage()` method - creates new message with forwardedFromId
- Updated `getMessages()` to include replyTo and forwardedFrom relations

### Controller Layer (chat.controller.ts)
- Updated `sendMessage` endpoint to handle forwardedFromId
- Added `DELETE /chat/messages/:messageId` endpoint
- Added `POST /chat/messages/:messageId/forward` endpoint

### Routes (chat.routes.ts)
```typescript
router.delete('/messages/:messageId', ChatController.deleteMessage);
router.post('/messages/:messageId/forward', ChatController.forwardMessage);
```

## Frontend Changes

### Domain Models (ChatModels.kt)
```kotlin
data class ChatMessage(
    // ... existing fields
    val replyTo: ChatMessage? = null,
    val forwardedFrom: UserSnippet? = null,
    // ...
)
```

### DTOs (ChatDtos.kt)
- Updated `MessageDto` with replyTo and forwardedFrom fields
- Added `ForwardMessageRequest` DTO

### API Layer (ChatApi.kt)
- Updated `sendMessage()` to accept forwardedFromId
- Added `deleteMessage()` method
- Added `forwardMessage()` method

### Repository Layer
- Updated interface and implementation with new methods
- Updated message mapper to include replyTo and forwardedFrom

### ViewModel (ChatRoomViewModel.kt)
- Added `replyingTo` and `selectedMessage` to state
- Added `setReplyTo()` method
- Added `deleteMessage()` method
- Added `forwardMessage()` method
- Added proper currentUserId extraction from JWT token

### UI (ChatRoomScreen.kt)
- Updated ChatBubble to show green for sent messages
- Added reply indicator showing original message preview
- Added forwarded indicator showing original sender
- Added long-press context menu with Reply/Delete/Forward options
- Added reply bar above input field
- Fixed message alignment based on actual sender ID

## Real-time Events

### Socket Events
- `chat:message_deleted` - Broadcast when message is deleted
- `chat:new_message` - Includes replyTo and forwardedFrom data
- `chat:updated` - Chat list updates with latest message

## Migration

Run the following to update your database:
```bash
cd backend
npx prisma migrate dev --name add_forwarded_from
```

Or manually run the SQL:
```sql
ALTER TABLE messages ADD COLUMN forwarded_from_id VARCHAR(255);
ALTER TABLE messages ADD CONSTRAINT messages_forwarded_from_id_fkey 
  FOREIGN KEY (forwarded_from_id) REFERENCES users(id) ON DELETE SET NULL;
```

## Testing Checklist

### Direct Chat
- [ ] Sent messages appear in green on the right
- [ ] Received messages appear in gray on the left
- [ ] Long-press message shows context menu
- [ ] Reply to message works and shows preview
- [ ] Delete own message works
- [ ] Cannot delete other user's messages
- [ ] Forward message to another chat works
- [ ] Forwarded message shows original sender

### Normal Group Chat
- [ ] All above features work in group context
- [ ] Multiple users can reply to same message
- [ ] Deleted messages disappear for all participants

### Chama Group Chat
- [ ] All above features work in chama context
- [ ] Reply/delete/forward work same as normal groups

## Notes

- The forward feature currently shows a placeholder for chat selection dialog
- You may want to implement a chat selector UI for the forward feature
- Consider adding confirmation dialog for delete action
- Consider adding message edit functionality in the future
