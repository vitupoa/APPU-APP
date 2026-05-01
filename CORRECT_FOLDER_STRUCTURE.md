# CORRECT CLOUDINARY FOLDER STRUCTURE

## Folder Naming Convention

**RULE**: Parent module folders use **Capital Letters**, subfolders (Images/Videos) are inside the parent module.

```
Krieta/
├── ModuleName/          ← Capital letter
│   ├── Images/          ← Inside module folder
│   └── Videos/          ← Inside module folder
```

---

## Complete Folder Structure

```
Krieta/
├── Profile/
│   ├── Images/          # Profile photos
│   └── Videos/          # Profile videos
│
├── Shorts/              # TikTok-like permanent content
│   ├── Images/          # Short photos/thumbnails
│   └── Videos/          # Short videos
│
├── Stories/             # WhatsApp-like 24h ephemeral status
│   ├── Images/          # Story photos (24h)
│   └── Videos/          # Story videos (24h)
│
├── Contests/
│   ├── Images/          # Contest photos
│   └── Videos/          # Contest videos
│
├── Drips/               # Feed posts
│   └── Images/          # Feed photos
│
├── Shop/
│   └── Images/          # Product images
│
├── Chats/
│   ├── Direct/
│   │   ├── Images/      # Direct chat images
│   │   └── Videos/      # Direct chat videos
│   ├── Group/
│   │   ├── Images/      # Normal group images
│   │   └── Videos/      # Normal group videos
│   ├── Chama/
│   │   ├── Images/      # Chama group images
│   │   └── Videos/      # Chama group videos
│   └── GroupAvatar/
│       └── Images/      # All group avatars
│
└── Chama/
    └── Receipts/        # Chama receipts
```

---

## Backend Configuration

### cloudinary.ts
```typescript
export const CLOUDINARY_FOLDERS = {
  // Profiles
  PROFILE_IMAGES: 'Krieta/Profile/Images',
  PROFILE_VIDEOS: 'Krieta/Profile/Videos',
  
  // Shorts (TikTok-like - permanent)
  SHORTS_VIDEOS: 'Krieta/Shorts/Videos',
  SHORTS_IMAGES: 'Krieta/Shorts/Images',
  
  // Contests
  CONTESTS_IMAGES: 'Krieta/Contests/Images',
  CONTESTS_VIDEOS: 'Krieta/Contests/Videos',
  
  // Feed (Drips)
  DRIPS_IMAGES: 'Krieta/Drips/Images',
  
  // Shop
  SHOP_IMAGES: 'Krieta/Shop/Images',
  
  // Chat - Direct
  CHAT_DIRECT_IMAGES: 'Krieta/Chats/Direct/Images',
  CHAT_DIRECT_VIDEOS: 'Krieta/Chats/Direct/Videos',
  
  // Chat - Normal Groups
  CHAT_GROUP_IMAGES: 'Krieta/Chats/Group/Images',
  CHAT_GROUP_VIDEOS: 'Krieta/Chats/Group/Videos',
  
  // Chat - Chama Groups
  CHAT_CHAMA_IMAGES: 'Krieta/Chats/Chama/Images',
  CHAT_CHAMA_VIDEOS: 'Krieta/Chats/Chama/Videos',
  
  // Chat - Group Avatars
  CHAT_GROUP_AVATAR_IMAGES: 'Krieta/Chats/GroupAvatar/Images',
  
  // Stories (WhatsApp-like status - 24h ephemeral)
  STORIES_IMAGES: 'Krieta/Stories/Images',
  STORIES_VIDEOS: 'Krieta/Stories/Videos',
} as const;
```

### media.routes.ts (Signature Schema)
```typescript
const signatureSchema = z.object({
  folder: z.enum([
    'Krieta/Profile/Images',
    'Krieta/Profile/Videos',
    'Krieta/Shorts/Videos',
    'Krieta/Shorts/Images',
    'Krieta/Contests/Images',
    'Krieta/Contests/Videos',
    'Krieta/Drips/Images',
    'Krieta/Shop/Images',
    'Krieta/Chats/Direct/Images',
    'Krieta/Chats/Direct/Videos',
    'Krieta/Chats/Group/Images',
    'Krieta/Chats/Group/Videos',
    'Krieta/Chats/Chama/Images',
    'Krieta/Chats/Chama/Videos',
    'Krieta/Chats/GroupAvatar/Images',
    'Krieta/Stories/Images',
    'Krieta/Stories/Videos',
  ]),
  resourceType: z.enum(['image', 'video', 'raw']).optional()
});
```

---

## Frontend Configuration

### ApiConstants.kt
```kotlin
object CloudinaryFolders {
    const val PROFILE_PHOTO = "Krieta/Profile/Images"
    const val PROFILE_VIDEO = "Krieta/Profile/Videos"
    
    const val SHORTS_VIDEO = "Krieta/Shorts/Videos"
    const val SHORTS_PHOTO = "Krieta/Shorts/Images"
    
    const val STORIES_IMAGE = "Krieta/Stories/Images"
    const val STORIES_VIDEO = "Krieta/Stories/Videos"
    
    const val CONTESTS_PHOTO = "Krieta/Contests/Images"
    const val CONTESTS_VIDEO = "Krieta/Contests/Videos"
    
    const val FEED_PHOTO = "Krieta/Drips/Images"
    const val SHOP_PHOTO = "Krieta/Shop/Images"
    
    const val CHAT_PHOTO = "Krieta/Chats/Images"
    const val CHAT_VIDEO = "Krieta/Chats/Videos"
    const val CHAT_AUDIO = "Krieta/Chats/Audio"
    
    const val CHAMA_RECEIPTS = "Krieta/Chama/Receipts"
}
```

### UploadApi.kt
```kotlin
object CloudinaryFolders {
    const val PROFILE_IMAGES = "Krieta/Profile/Images"
    const val SHORTS_VIDEOS = "Krieta/Shorts/Videos"
    const val SHORTS_IMAGES = "Krieta/Shorts/Images"
    const val CONTESTS_IMAGES = "Krieta/Contests/Images"
    const val CONTESTS_VIDEOS = "Krieta/Contests/Videos"
    const val DRIPS_IMAGES = "Krieta/Drips/Images"
    const val SHOP_IMAGES = "Krieta/Shop/Images"
    const val CHAT_DIRECT_IMAGES = "Krieta/Chats/Direct/Images"
    const val CHAT_DIRECT_VIDEOS = "Krieta/Chats/Direct/Videos"
    const val CHAT_GROUP_IMAGES = "Krieta/Chats/Group/Images"
    const val CHAT_GROUP_VIDEOS = "Krieta/Chats/Group/Videos"
    const val CHAT_CHAMA_IMAGES = "Krieta/Chats/Chama/Images"
    const val CHAT_CHAMA_VIDEOS = "Krieta/Chats/Chama/Videos"
    const val CHAT_GROUP_AVATAR_IMAGES = "Krieta/Chats/GroupAvatar/Images"
    const val STORIES_IMAGES = "Krieta/Stories/Images"
    const val STORIES_VIDEOS = "Krieta/Stories/Videos"
}
```

---

## Upload Implementation

### Shorts Upload (UploadWorker.kt)
```kotlin
UploadType.SHORT -> {
    cloudinaryUploader.uploadMedia(
        ApiConstants.CloudinaryFolders.SHORTS_VIDEO,  // Krieta/Shorts/Videos
        filePath, 
        isVideo = true
    )
}
```

### Stories Upload (UploadWorker.kt)
```kotlin
UploadType.STORY -> {
    val isVideo = mediaType == "video"
    val folder = if (isVideo) 
        ApiConstants.CloudinaryFolders.STORIES_VIDEO  // Krieta/Stories/Videos
    else 
        ApiConstants.CloudinaryFolders.STORIES_IMAGE  // Krieta/Stories/Images
    
    cloudinaryUploader.uploadMedia(folder, filePath, isVideo = isVideo)
}
```

---

## Feature Comparison

| Feature | Type | Duration | Folders |
|---------|------|----------|---------|
| **Shorts** | TikTok-like | Permanent | `Krieta/Shorts/Images`<br>`Krieta/Shorts/Videos` |
| **Stories** | WhatsApp-like | 24 hours | `Krieta/Stories/Images`<br>`Krieta/Stories/Videos` |

---

## Key Points

1. ✅ **Parent folders use Capital letters**: `Shorts/`, `Stories/`, `Profile/`, etc.
2. ✅ **Subfolders are inside parent**: `Krieta/Shorts/Videos` not `Krieta/shorts/Videos`
3. ✅ **Shorts and Stories are separate**: Different folders, different purposes
4. ✅ **Stories are ephemeral**: Tagged with 24h expiration, auto-deleted by cron
5. ✅ **Shorts are permanent**: No expiration tags

---

## Testing Checklist

### Shorts
- [ ] Upload short video → Check `Krieta/Shorts/Videos`
- [ ] Upload short photo → Check `Krieta/Shorts/Images`
- [ ] Verify no expiration tags
- [ ] Verify permanent storage

### Stories
- [ ] Upload story photo → Check `Krieta/Stories/Images`
- [ ] Upload story video → Check `Krieta/Stories/Videos`
- [ ] Verify ephemeral tags present
- [ ] Verify 24h expiration context
- [ ] Verify auto-deletion after 24h
