# CORRECT CLOUDINARY FOLDER STRUCTURE

## Folder Naming Convention

**RULE**: Parent module folders use **Capital Letters**, subfolders (Images/Videos) are inside the parent module.

```
Runinga/
├── ModuleName/          ← Capital letter
│   ├── Images/          ← Inside module folder
│   └── Videos/          ← Inside module folder
```

---

## Complete Folder Structure

```
Runinga/
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
  PROFILE_IMAGES: 'Runinga/Profile/Images',
  PROFILE_VIDEOS: 'Runinga/Profile/Videos',
  
  // Shorts (TikTok-like - permanent)
  SHORTS_VIDEOS: 'Runinga/Shorts/Videos',
  SHORTS_IMAGES: 'Runinga/Shorts/Images',
  
  // Contests
  CONTESTS_IMAGES: 'Runinga/Contests/Images',
  CONTESTS_VIDEOS: 'Runinga/Contests/Videos',
  
  // Feed (Drips)
  DRIPS_IMAGES: 'Runinga/Drips/Images',
  
  // Shop
  SHOP_IMAGES: 'Runinga/Shop/Images',
  
  // Chat - Direct
  CHAT_DIRECT_IMAGES: 'Runinga/Chats/Direct/Images',
  CHAT_DIRECT_VIDEOS: 'Runinga/Chats/Direct/Videos',
  
  // Chat - Normal Groups
  CHAT_GROUP_IMAGES: 'Runinga/Chats/Group/Images',
  CHAT_GROUP_VIDEOS: 'Runinga/Chats/Group/Videos',
  
  // Chat - Chama Groups
  CHAT_CHAMA_IMAGES: 'Runinga/Chats/Chama/Images',
  CHAT_CHAMA_VIDEOS: 'Runinga/Chats/Chama/Videos',
  
  // Chat - Group Avatars
  CHAT_GROUP_AVATAR_IMAGES: 'Runinga/Chats/GroupAvatar/Images',
  
  // Stories (WhatsApp-like status - 24h ephemeral)
  STORIES_IMAGES: 'Runinga/Stories/Images',
  STORIES_VIDEOS: 'Runinga/Stories/Videos',
} as const;
```

### media.routes.ts (Signature Schema)
```typescript
const signatureSchema = z.object({
  folder: z.enum([
    'Runinga/Profile/Images',
    'Runinga/Profile/Videos',
    'Runinga/Shorts/Videos',
    'Runinga/Shorts/Images',
    'Runinga/Contests/Images',
    'Runinga/Contests/Videos',
    'Runinga/Drips/Images',
    'Runinga/Shop/Images',
    'Runinga/Chats/Direct/Images',
    'Runinga/Chats/Direct/Videos',
    'Runinga/Chats/Group/Images',
    'Runinga/Chats/Group/Videos',
    'Runinga/Chats/Chama/Images',
    'Runinga/Chats/Chama/Videos',
    'Runinga/Chats/GroupAvatar/Images',
    'Runinga/Stories/Images',
    'Runinga/Stories/Videos',
  ]),
  resourceType: z.enum(['image', 'video', 'raw']).optional()
});
```

---

## Frontend Configuration

### ApiConstants.kt
```kotlin
object CloudinaryFolders {
    const val PROFILE_PHOTO = "Runinga/Profile/Images"
    const val PROFILE_VIDEO = "Runinga/Profile/Videos"
    
    const val SHORTS_VIDEO = "Runinga/Shorts/Videos"
    const val SHORTS_PHOTO = "Runinga/Shorts/Images"
    
    const val STORIES_IMAGE = "Runinga/Stories/Images"
    const val STORIES_VIDEO = "Runinga/Stories/Videos"
    
    const val CONTESTS_PHOTO = "Runinga/Contests/Images"
    const val CONTESTS_VIDEO = "Runinga/Contests/Videos"
    
    const val FEED_PHOTO = "Runinga/Drips/Images"
    const val SHOP_PHOTO = "Runinga/Shop/Images"
    
    const val CHAT_PHOTO = "Runinga/Chats/Images"
    const val CHAT_VIDEO = "Runinga/Chats/Videos"
    const val CHAT_AUDIO = "Runinga/Chats/Audio"
    
    const val CHAMA_RECEIPTS = "Runinga/Chama/Receipts"
}
```

### UploadApi.kt
```kotlin
object CloudinaryFolders {
    const val PROFILE_IMAGES = "Runinga/Profile/Images"
    const val SHORTS_VIDEOS = "Runinga/Shorts/Videos"
    const val SHORTS_IMAGES = "Runinga/Shorts/Images"
    const val CONTESTS_IMAGES = "Runinga/Contests/Images"
    const val CONTESTS_VIDEOS = "Runinga/Contests/Videos"
    const val DRIPS_IMAGES = "Runinga/Drips/Images"
    const val SHOP_IMAGES = "Runinga/Shop/Images"
    const val CHAT_DIRECT_IMAGES = "Runinga/Chats/Direct/Images"
    const val CHAT_DIRECT_VIDEOS = "Runinga/Chats/Direct/Videos"
    const val CHAT_GROUP_IMAGES = "Runinga/Chats/Group/Images"
    const val CHAT_GROUP_VIDEOS = "Runinga/Chats/Group/Videos"
    const val CHAT_CHAMA_IMAGES = "Runinga/Chats/Chama/Images"
    const val CHAT_CHAMA_VIDEOS = "Runinga/Chats/Chama/Videos"
    const val CHAT_GROUP_AVATAR_IMAGES = "Runinga/Chats/GroupAvatar/Images"
    const val STORIES_IMAGES = "Runinga/Stories/Images"
    const val STORIES_VIDEOS = "Runinga/Stories/Videos"
}
```

---

## Upload Implementation

### Shorts Upload (UploadWorker.kt)
```kotlin
UploadType.SHORT -> {
    cloudinaryUploader.uploadMedia(
        ApiConstants.CloudinaryFolders.SHORTS_VIDEO,  // Runinga/Shorts/Videos
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
        ApiConstants.CloudinaryFolders.STORIES_VIDEO  // Runinga/Stories/Videos
    else 
        ApiConstants.CloudinaryFolders.STORIES_IMAGE  // Runinga/Stories/Images
    
    cloudinaryUploader.uploadMedia(folder, filePath, isVideo = isVideo)
}
```

---

## Feature Comparison

| Feature | Type | Duration | Folders |
|---------|------|----------|---------|
| **Shorts** | TikTok-like | Permanent | `Runinga/Shorts/Images`<br>`Runinga/Shorts/Videos` |
| **Stories** | WhatsApp-like | 24 hours | `Runinga/Stories/Images`<br>`Runinga/Stories/Videos` |

---

## Key Points

1. ✅ **Parent folders use Capital letters**: `Shorts/`, `Stories/`, `Profile/`, etc.
2. ✅ **Subfolders are inside parent**: `Runinga/Shorts/Videos` not `Runinga/shorts/Videos`
3. ✅ **Shorts and Stories are separate**: Different folders, different purposes
4. ✅ **Stories are ephemeral**: Tagged with 24h expiration, auto-deleted by cron
5. ✅ **Shorts are permanent**: No expiration tags

---

## Testing Checklist

### Shorts
- [ ] Upload short video → Check `Runinga/Shorts/Videos`
- [ ] Upload short photo → Check `Runinga/Shorts/Images`
- [ ] Verify no expiration tags
- [ ] Verify permanent storage

### Stories
- [ ] Upload story photo → Check `Runinga/Stories/Images`
- [ ] Upload story video → Check `Runinga/Stories/Videos`
- [ ] Verify ephemeral tags present
- [ ] Verify 24h expiration context
- [ ] Verify auto-deletion after 24h
