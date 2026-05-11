# Nested Replies Feature with Media & Link Previews

## Overview
Comprehensive nested replies implementation supporting text, images, videos, documents, and links across all chat types (direct, group, and chama chats).

## Features

### 1. **Nested Reply Chain (Up to 2 Levels)**
- Reply to any message type: text, images, videos, documents
- Works in direct chats, group chats, and chama chats
- Visual hierarchy with different opacity levels for nested replies
- Media thumbnails shown in reply previews

### 2. **Media Support**
- **Images**: Full preview in messages, thumbnail in replies
- **Videos**: Play icon preview, thumbnail in replies
- **Documents**: File icon with label
- All media types can be replied to

### 3. **Link Previews**
- Automatic URL detection in messages
- Domain and full URL display
- Clickable link cards
- Works with or without http/https prefix

### 4. **Reply Navigation**
- Click any reply preview to navigate to original message
- Smooth animated scroll to target message
- Visual indicator (chevron icon) shows clickability

### 5. **Reply Count Display**
- Shows number of replies per message
- Updates in real-time
- Displayed below message content

## Backend Changes

### Database Schema (`schema.prisma`)
```prisma
model Message {
  id              String   @id @default(uuid())
  chatId          String   @map("chat_id")
  senderId        String   @map("sender_id")
  payload         String   @db.Text
  mediaUrl        String?  @map("media_url")
  mediaType       String?  @map("media_type")
  thumbnailUrl    String?  @map("thumbnail_url")  // NEW
  isSystemEvent   Boolean  @default(false)
  status          String   @default("sent")
  replyToId       String?  @map("reply_to_id")
  forwardedFromId String?  @map("forwarded_from_id")
  repliesCount    Int      @default(0) @map("replies_count")  // NEW
  createdAt       DateTime @default(now())
  
  @@index([replyToId])  // NEW
}
```

### Service Updates (`chat.service.ts`)
1. **sendMessage**: 
   - Added `thumbnailUrl` parameter
   - Includes nested reply data (up to 2 levels)
   - Increments `repliesCount` on parent message
   
2. **getMessages**:
   - Fetches nested reply data with media
   - Includes thumbnails for previews

## Frontend Changes

### Models (`ChatModels.kt`)
```kotlin
data class ChatMessage(
    val id: String,
    val chatId: String,
    val senderId: String,
    val sender: UserSnippet?,
    val payload: String,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val thumbnailUrl: String? = null,  // NEW
    val isSystemEvent: Boolean = false,
    val status: String = "sent",
    val replyTo: ChatMessage? = null,
    val forwardedFrom: UserSnippet? = null,
    val repliesCount: Int = 0,  // NEW
    val createdAt: Instant
)
```

### UI Components

#### New Files:
1. **LinkPreview.kt**: URL detection and link preview component
   - `UrlUtils`: Extract and validate URLs
   - `LinkPreview`: Composable for link cards

#### Updated Components:

1. **ChatBubble**: 
   - Media preview display (images, videos, documents)
   - Link preview for URLs
   - Nested reply chain with media thumbnails
   - Reply count display

2. **ReplyPreview**:
   - Media type icons in reply previews
   - Smart text display ("📷 Photo", "🎥 Video", etc.)
   - Click navigation to original message

3. **ChatRoomScreen**:
   - LazyListState for scroll navigation
   - Smooth animated scroll to replies

## Usage Examples

### Replying to Text Message
1. Long-press message
2. Select "Reply"
3. Type and send

### Replying to Image/Video
1. Long-press media message
2. Select "Reply"
3. Reply shows thumbnail preview
4. Type and send

### Replying to a Reply (Nested)
1. Long-press any reply
2. Select "Reply"
3. Shows full reply chain (up to 2 levels)
4. Type and send

### Navigating to Original Message
1. Click any reply preview
2. Auto-scroll to original message
3. Works for all message types

### Sending Links
1. Type or paste URL in message
2. Link preview appears automatically
3. Send message
4. Recipients see clickable link card

## Chat Type Support

### Direct Chats
- ✅ Text replies
- ✅ Media replies
- ✅ Nested replies
- ✅ Link previews

### Group Chats
- ✅ Text replies
- ✅ Media replies
- ✅ Nested replies
- ✅ Link previews
- ✅ Multiple participants

### Chama Chats
- ✅ Text replies
- ✅ Media replies
- ✅ Nested replies
- ✅ Link previews
- ✅ Chama-specific features preserved

## Migration

Run Prisma migration to apply schema changes:
```bash
cd backend
npx prisma migrate dev --name add_nested_replies_and_media
```

This will:
- Add `thumbnailUrl` column
- Add `repliesCount` column with default 0
- Create index on `replyToId`
- Update existing messages with reply counts

## Real-time Updates

- New replies trigger WebSocket events
- Reply counts update automatically
- Media and thumbnails included in broadcasts
- Link previews render client-side
- No manual refresh needed

## Performance Optimizations

1. **Database**: Index on `replyToId` for fast nested queries
2. **Reply Depth**: Limited to 2 levels to prevent deep nesting
3. **Media**: Thumbnails for efficient preview loading
4. **Links**: Client-side URL detection (no API calls)
5. **Pagination**: 50 messages per page

## Future Enhancements

- Rich link previews with Open Graph metadata
- Image/video thumbnails in reply previews
- Thread view for high-reply messages
- Collapse/expand reply chains
- Reply notifications
- Quote reply with text selection
- GIF support
- Voice message replies
