# Android Configuration for Security Features

## AndroidManifest.xml

Add the following permissions to your `AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Biometric Authentication -->
    <uses-permission android:name="android.permission.USE_BIOMETRIC" />
    
    <!-- For older devices (API < 28) -->
    <uses-permission android:name="android.permission.USE_FINGERPRINT" />
    
    <!-- Internet for API calls -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- Optional: Check for StrongBox support -->
    <uses-feature
        android:name="android.hardware.strongbox_keystore"
        android:required="false" />
    
    <application
        android:name=".RuningaApplication"
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.Runinga">
        
        <!-- Activities -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
        
    </application>
</manifest>
```

## build.gradle.kts (Module Level)

Add required dependencies:

```kotlin
android {
    namespace = "com.runinga"
    compileSdk = 34
    
    defaultConfig {
        applicationId = "com.runinga"
        minSdk = 23  // Android 6.0 for Keystore
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }
    
    buildFeatures {
        compose = true
    }
}

dependencies {
    // Biometric Authentication
    implementation("androidx.biometric:biometric:1.2.0-alpha05")
    
    // Security Crypto
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    
    // Fragment (required for BiometricPrompt)
    implementation("androidx.fragment:fragment-ktx:1.6.2")
    implementation("androidx.activity:activity-ktx:1.8.2")
}
```

## ProGuard Rules

Add to `proguard-rules.pro`:

```proguard
# Keep security classes
-keep class com.runinga.com.core.security.** { *; }

# Keep Android Keystore classes
-keep class android.security.keystore.** { *; }
-keep class javax.crypto.** { *; }

# Keep Biometric classes
-keep class androidx.biometric.** { *; }
```

## Testing on Physical Device

**Important**: Biometric authentication and hardware security features cannot be fully tested on emulators.

### Required Test Devices:
- Android 6.0+ device with fingerprint sensor
- Android 9.0+ device with StrongBox (Pixel 3+, Samsung S9+)
- Device with enrolled biometric (fingerprint/face)

### Test Checklist:
- [ ] Biometric prompt appears
- [ ] Fingerprint authentication works
- [ ] Face unlock works (if supported)
- [ ] PIN fallback works
- [ ] Hardware key generation succeeds
- [ ] StrongBox detection works (Android 9+)
- [ ] Signing operations complete
- [ ] Encryption/decryption works
