# REQUIRED: SecureConfig Initialization

## Android Setup

Add this to your Application class:

```kotlin
// File: composeApp/src/androidMain/kotlin/com/krieta/KrietaApplication.kt

package com.krieta

import android.app.Application
import com.krieta.com.core.security.SecureConfig
import org.koin.android.ext.koin.androidContext
import org.koin.core.context.startKoin

class KrietaApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // REQUIRED: Initialize SecureConfig for HMAC secret storage
        SecureConfig.initialize(this)
        
        // Initialize Koin
        startKoin {
            androidContext(this@KrietaApplication)
            modules(appModules)
        }
    }
}
```

Update AndroidManifest.xml:

```xml
<application
    android:name=".KrietaApplication"
    ...>
```

## iOS Setup

No initialization needed! iOS Keychain is always available.

## Verification

After initialization, the HMAC secret will be:
- ✅ Auto-generated on first access
- ✅ Stored securely (EncryptedSharedPreferences on Android, Keychain on iOS)
- ✅ Persisted across app restarts
- ✅ Unique per device

## Testing

```kotlin
// Test that SecureConfig works
val secret = SecureConfig.HMAC_SECRET
println("HMAC Secret length: ${secret.length}") // Should be 64+
```

## Security Notes

- The secret is generated automatically - you don't need to provide it
- Each device gets its own unique secret
- The secret never leaves the device
- Uninstalling the app will delete the secret (expected behavior)
