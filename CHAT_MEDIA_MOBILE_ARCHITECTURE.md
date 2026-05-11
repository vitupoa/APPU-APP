# Chat Media Upload - Mobile Architecture

## 🏗️ Complete Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              ChatRoomScreen (UI Layer)                  │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  • Attach button                                 │  │    │
│  │  │  • MediaPickerBottomSheet                        │  │    │
│  │  │  • MediaPreviewDialog                            │  │    │
│  │  │  • UploadProgressIndicator                       │  │    │
│  │  │  • Chat bubbles with media                       │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↕                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │           ChatRoomViewModel (Logic Layer)              │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  • pickImage/Video/Document()                    │  │    │
│  │  │  • onMediaSelected()                             │  │    │
│  │  │  • sendMediaMessage()                            │  │    │
│  │  │  • State management                              │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↕                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         ChatMediaUploadService (Upload Layer)          │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  • uploadMedia() → Flow<UploadProgress>          │  │    │
│  │  │  • Local validation                              │  │    │
│  │  │  • Compression integration                       │  │    │
│  │  │  • Progress tracking                             │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↕                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         ImageCompressor (Compression Layer)            │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  • compress() - Resize to 1920x1920             │  │    │
│  │  │  • Quality: 85%                                  │  │    │
│  │  │  • Platform-specific (Android/iOS)              │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↕                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │        MediaUploadMonitor (Monitoring Layer)           │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  • Track metrics                                 │  │    │
│  │  │  • Success/failure rates                         │  │    │
│  │  │  • Error categorization                          │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         ChatMediaController (API Layer)                │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  POST /chat/:chatId/media/signature              │  │    │
│  │  │  POST /chat/media/validate                       │  │    │
│  │  │  POST /chat/link/validate                        │  │    │
│  │  │  POST /chat/:chatId/avatar/signature             │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↕                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         MediaValidator (Security Layer)                │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  • validateMediaFile()                           │  │    │
│  │  │  • validateMediaUrl()                            │  │    │
│  │  │  • validateExternalLink()                        │  │    │
│  │  │  • sanitizeTextContent()                         │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↕                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         CloudinaryConfig (Integration Layer)           │    │
│  │  ┌──────────────────────────────────────────────────┐  │    │
│  │  │  • generateUploadSignature()                     │  │    │
│  │  │  • Folder structure                              │  │    │
│  │  │  • Security settings                             │  │    │
│  │  └──────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDINARY                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  • Receives direct uploads from mobile                          │
│  • Validates signatures                                         │
│  • Stores in organized folders                                  │
│  • Returns secure URLs                                          │
│                                                                  │
│  Folders:                                                       │
│  ├── Krieta/Chats/Direct/Images/                               │
│  ├── Krieta/Chats/Direct/Videos/                               │
│  ├── Krieta/Chats/Group/Images/                                │
│  ├── Krieta/Chats/Group/Videos/                                │
│  ├── Krieta/Chats/Chama/Images/                                │
│  ├── Krieta/Chats/Chama/Videos/                                │
│  └── Krieta/Chats/GroupAvatar/Images/                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Detailed Upload Sequence

```
┌─────────┐         ┌──────────┐         ┌─────────┐         ┌────────────┐
│  User   │         │  Mobile  │         │ Backend │         │ Cloudinary │
└────┬────┘         └────┬─────┘         └────┬────┘         └─────┬──────┘
     │                   │                     │                    │
     │ 1. Tap attach     │                     │                    │
     │──────────────────>│                     │                    │
     │                   │                     │                    │
     │ 2. Select media   │                     │                    │
     │──────────────────>│                     │                    │
     │                   │                     │                    │
     │                   │ 3. Validate locally │                    │
     │                   │────────────────────>│                    │
     │                   │                     │                    │
     │                   │ 4. Request signature│                    │
     │                   │────────────────────>│                    │
     │                   │                     │                    │
     │                   │ 5. Generate & sign  │                    │
     │                   │<────────────────────│                    │
     │                   │                     │                    │
     │                   │ 6. Compress image   │                    │
     │                   │────────────────────>│                    │
     │                   │                     │                    │
     │ 7. Show progress  │                     │                    │
     │<──────────────────│                     │                    │
     │                   │                     │                    │
     │                   │ 8. Upload file      │                    │
     │                   │─────────────────────────────────────────>│
     │                   │                     │                    │
     │                   │                     │ 9. Validate & store│
     │                   │<─────────────────────────────────────────│
     │                   │                     │                    │
     │                   │ 10. Validate URL    │                    │
     │                   │────────────────────>│                    │
     │                   │                     │                    │
     │                   │ 11. Sanitize & OK   │                    │
     │                   │<────────────────────│                    │
     │                   │                     │                    │
     │                   │ 12. Send message    │                    │
     │                   │────────────────────>│                    │
     │                   │                     │                    │
     │ 13. Message sent  │                     │                    │
     │<──────────────────│                     │                    │
     │                   │                     │                    │
```

## 🛡️ Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY CHECKPOINTS                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: CLIENT-SIDE (Mobile)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ✓ File type check (MIME)                           │  │
│  │  ✓ File size check                                  │  │
│  │  ✓ Extension check                                  │  │
│  │  ✓ Dangerous file blocking                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  Layer 2: COMPRESSION (Mobile)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ✓ Resize to safe dimensions                        │  │
│  │  ✓ Strip metadata                                   │  │
│  │  ✓ Reduce file size                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  Layer 3: AUTHORIZATION (Backend)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ✓ JWT token verification                           │  │
│  │  ✓ Participant check                                │  │
│  │  ✓ Folder permission check                          │  │
│  │  ✓ Signature generation                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  Layer 4: CLOUDINARY VALIDATION                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ✓ Signature verification                           │  │
│  │  ✓ Folder enforcement                               │  │
│  │  ✓ File processing                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  Layer 5: URL VALIDATION (Backend)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ✓ Cloudinary domain check                          │  │
│  │  ✓ HTTPS enforcement                                │  │
│  │  ✓ XSS pattern detection                            │  │
│  │  ✓ Folder verification                              │  │
│  │  ✓ URL sanitization                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  Layer 6: MESSAGE VALIDATION (Backend)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ✓ Participant re-check                             │  │
│  │  ✓ Media URL re-validation                          │  │
│  │  ✓ Payload sanitization                             │  │
│  │  ✓ Length limits                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📊 State Management

```
ChatRoomState
├── messages: List<ChatMessage>
├── currentUserId: String
├── replyingTo: ChatMessage?
├── selectedMedia: SelectedMedia?
│   ├── uri: String
│   ├── type: String (image/video/document)
│   ├── fileName: String
│   ├── fileSize: Long
│   └── bytes: ByteArray
├── uploadProgress: UploadProgress
│   ├── Idle
│   ├── Compressing(progress: Float)
│   ├── Uploading(progress, bytesUploaded, totalBytes)
│   ├── Validating
│   ├── Success(url: String)
│   └── Error(message: String)
├── isLoading: Boolean
├── error: String?
└── typingUsers: List<UserSnippet>
```

## 🎨 UI Component Hierarchy

```
ChatRoomScreen
├── TopAppBar
│   ├── Back button
│   ├── Chat title
│   └── Typing indicator
├── LazyColumn (Messages)
│   └── ChatBubble (for each message)
│       ├── Reply indicator
│       ├── Forwarded indicator
│       ├── Media content
│       │   ├── AsyncImage (for images)
│       │   ├── Video player (for videos)
│       │   └── Document icon (for PDFs)
│       ├── Text content
│       └── Context menu
└── BottomBar
    ├── UploadProgressIndicator
    ├── Reply bar
    └── ChatInputBar
        ├── Attach button → MediaPickerBottomSheet
        ├── TextField
        └── Send button

MediaPickerBottomSheet
├── Photo option
├── Video option
└── Document option

MediaPreviewDialog
├── Media preview
│   ├── Image (AsyncImage)
│   ├── Video (play icon)
│   └── Document (icon)
├── File info
│   ├── File name
│   └── File size
├── Upload progress
│   ├── Compressing indicator
│   ├── Uploading progress bar
│   ├── Validating spinner
│   └── Error message
├── Send button
└── Cancel button
```

## 📈 Monitoring Dashboard

```
MediaUploadMonitor
├── Metrics
│   ├── totalUploads: Int
│   ├── successfulUploads: Int
│   ├── failedUploads: Int
│   ├── totalBytesUploaded: Long
│   ├── averageUploadTime: Long
│   ├── lastUploadTime: Instant
│   ├── uploadsByType: Map<String, Int>
│   │   ├── "image" → count
│   │   ├── "video" → count
│   │   └── "document" → count
│   └── errorsByType: Map<String, Int>
│       ├── "File too large" → count
│       ├── "Invalid type" → count
│       └── "Upload failed" → count
└── Recent Events (last 100)
    └── UploadEvent
        ├── timestamp
        ├── chatId
        ├── mediaType
        ├── fileSize
        ├── success
        ├── durationMs
        └── errorMessage?
```

## 🔗 Dependency Injection

```
Koin Module
├── ChatMediaUploadService
│   ├── httpClient: HttpClient
│   ├── baseUrl: String
│   ├── authToken: String
│   └── imageCompressor: ImageCompressor
├── ImageCompressor
│   └── Platform-specific implementation
├── MediaUploadMonitor
│   └── Singleton instance
└── ChatRoomViewModel
    ├── chatId: String (parameter)
    ├── repository: ChatRepository
    ├── webSocketService: WebSocketService
    ├── tokenManager: TokenManager
    ├── eventBus: ChatEventBus
    └── mediaUploadService: ChatMediaUploadService
```

---

**Architecture Version**: 1.0
**Last Updated**: 2024
**Status**: ✅ Complete and Ready for Integration
