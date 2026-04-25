# Offline Support Dependencies

## Android (Room Database)

Add to `composeApp/build.gradle.kts`:

```kotlin
android {
    // ... existing config
}

dependencies {
    // Room Database for Android
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")
    
    // Existing dependencies...
}
```

## iOS (SQLDelight)

Add to `composeApp/build.gradle.kts`:

```kotlin
kotlin {
    sourceSets {
        commonMain.dependencies {
            // SQLDelight for multiplatform
            implementation("com.squareup.sqldelight:runtime:1.5.5")
            implementation("com.squareup.sqldelight:coroutines-extensions:1.5.5")
        }
        
        androidMain.dependencies {
            implementation("com.squareup.sqldelight:android-driver:1.5.5")
        }
        
        iosMain.dependencies {
            implementation("com.squareup.sqldelight:native-driver:1.5.5")
        }
    }
}
```

## Cloudinary SDK

Add to `backend/package.json`:

```json
{
  "dependencies": {
    "cloudinary": "^1.41.0",
    "node-cron": "^3.0.3"
  }
}
```

## Installation Commands

### Backend:
```bash
cd backend
npm install cloudinary node-cron
```

### Android:
Add KSP plugin to `build.gradle.kts` (project level):
```kotlin
plugins {
    id("com.google.devtools.ksp") version "1.9.20-1.0.14" apply false
}
```

Add to `composeApp/build.gradle.kts`:
```kotlin
plugins {
    id("com.google.devtools.ksp")
}
```

## Usage Example

### Android:
```kotlin
// In your Application class or DI module
val database = ChatDatabase.getDatabase(context)
val syncService = OfflineMessageSyncService(
    context = context,
    localMessageDao = database.localMessageDao(),
    onSyncMessage = { message ->
        // Send to API
        chatApi.sendMessage(...)
    }
)
```

### iOS:
```kotlin
// In your iOS app initialization
val database = LocalMessageDatabase()
val syncService = OfflineMessageSyncService(
    database = database,
    onSyncMessage = { message ->
        // Send to API
        chatApi.sendMessage(...)
    }
)
```

## Features Implemented

### Offline Message Queue:
- ✅ Messages stored locally when offline
- ✅ Automatic sync when connection restored
- ✅ Retry mechanism with exponential backoff
- ✅ Failed message handling after 5 retries
- ✅ Network connectivity monitoring

### Cloudinary Auto-Delete:
- ✅ TTL configuration for ephemeral content
- ✅ Tags and context metadata
- ✅ Cron worker for cleanup
- ✅ Automatic deletion of expired stories
- ✅ Support for images and videos

## Testing

### Test Offline Mode:
1. Turn off internet
2. Send messages in chat
3. Messages show as "pending"
4. Turn on internet
5. Messages automatically sync

### Test Story Cleanup:
1. Create story with 24h expiry
2. Wait for cron job (or trigger manually)
3. Verify story deleted from DB and Cloudinary

## Configuration

### Environment Variables:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Cron Schedule:
- Story cleanup: Every hour (`0 * * * *`)
- Defaulter check: Daily at 2 AM (`0 2 * * *`)
