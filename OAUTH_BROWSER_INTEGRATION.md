# OAuth Browser Integration - Complete Guide

## Overview

Platform-specific OAuth browser integration for TikTok, Instagram, and YouTube authentication using:
- **Android**: Custom Tabs (in-app browser)
- **iOS**: ASWebAuthenticationSession (secure authentication)

## Architecture

### Common Interface
```kotlin
interface OAuthBrowser {
    suspend fun openAuthUrl(url: String, callbackScheme: String): OAuthResult
}

sealed class OAuthResult {
    data class Success(val code: String, val state: String)
    data class Error(val message: String)
    object Cancelled
}
```

### Platform Implementations

#### Android (Custom Tabs)
- Opens OAuth URL in Chrome Custom Tab
- Handles callback via deep link intent filter
- Callback scheme: `runinga://oauth`

#### iOS (ASWebAuthenticationSession)
- Opens OAuth URL in secure authentication session
- Automatic callback handling
- Callback scheme: `runinga`

## API Endpoints Connected

### 1. Get OAuth Authorization URL
```
GET /api/v1/marketplace/oauth/{platform}/authorize
```

**Response:**
```json
{
  "authUrl": "https://www.tiktok.com/auth/authorize?...",
  "state": "random_state_string"
}
```

### 2. Handle OAuth Callback
```
POST /api/v1/marketplace/oauth/{platform}/callback
```

**Request:**
```json
{
  "code": "authorization_code",
  "state": "state_from_step_1"
}
```

### 3. Get Connected Accounts
```
GET /api/v1/marketplace/oauth/accounts
```

**Response:**
```json
{
  "accounts": [
    {
      "id": "acc_123",
      "platform": "tiktok",
      "username": "@creator",
      "displayName": "Creator Name",
      "followerCount": 50000,
      "isVerified": true,
      "lastSyncedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 4. Disconnect Account
```
DELETE /api/v1/marketplace/oauth/{platform}/disconnect
```

## Usage in ViewModel

```kotlin
class OAuthViewModel(
    private val repository: MarketplaceRepository,
    private val oauthBrowser: OAuthBrowser
) : ScreenModel {
    
    fun connectAccount(platform: String) {
        screenModelScope.launch {
            // 1. Get OAuth URL from backend
            val result = repository.getOAuthUrl(platform)
            val authUrl = result.data.authUrl
            
            // 2. Open platform-specific browser
            when (val browserResult = oauthBrowser.openAuthUrl(authUrl, "runinga")) {
                is OAuthResult.Success -> {
                    // 3. Send code to backend
                    handleCallback(platform, browserResult.code, browserResult.state)
                }
                is OAuthResult.Error -> {
                    // Handle error
                }
                is OAuthResult.Cancelled -> {
                    // User cancelled
                }
            }
        }
    }
}
```

## Android Setup

### 1. AndroidManifest.xml
```xml
<activity android:name=".MainActivity">
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="runinga" android:host="oauth" />
    </intent-filter>
</activity>
```

### 2. build.gradle.kts
```kotlin
dependencies {
    implementation("androidx.browser:browser:1.7.0")
}
```

### 3. Handle Deep Link in MainActivity
```kotlin
override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    intent?.data?.let { uri ->
        if (uri.scheme == "runinga" && uri.host == "oauth") {
            val oauthBrowser = get<OAuthBrowser>() as AndroidOAuthBrowser
            oauthBrowser.handleCallback(uri)
        }
    }
}
```

## iOS Setup

### 1. Info.plist
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>runinga</string>
        </array>
    </dict>
</array>
```

### 2. No additional code needed
ASWebAuthenticationSession handles callbacks automatically.

## Testing

### Test TikTok OAuth
```kotlin
viewModel.connectAccount("tiktok")
```

**Expected Flow:**
1. Browser opens TikTok authorization page
2. User logs in and approves
3. Browser redirects to `runinga://oauth?code=XXX&state=YYY`
4. App handles callback and exchanges code for token
5. Account appears in connected accounts list

### Test Instagram OAuth
```kotlin
viewModel.connectAccount("instagram")
```

### Test YouTube OAuth
```kotlin
viewModel.connectAccount("youtube")
```

## Backend Configuration Required

### Environment Variables
```env
# TikTok
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_REDIRECT_URI=https://your-backend.com/api/v1/marketplace/oauth/tiktok/callback

# Instagram
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret
INSTAGRAM_REDIRECT_URI=https://your-backend.com/api/v1/marketplace/oauth/instagram/callback

# YouTube
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
YOUTUBE_REDIRECT_URI=https://your-backend.com/api/v1/marketplace/oauth/youtube/callback
```

## Security Features

### Android
- Custom Tabs use Chrome's security
- Deep link validation
- State parameter for CSRF protection

### iOS
- ASWebAuthenticationSession is sandboxed
- Automatic cookie isolation
- System-level security

### Backend
- State parameter validation
- Token encryption in database
- Automatic token refresh
- Secure token storage

## Error Handling

### Common Errors

**"Invalid callback"**
- Missing code or state parameter
- Solution: Check OAuth provider configuration

**"Failed to connect account"**
- Backend token exchange failed
- Solution: Verify client credentials

**"User cancelled"**
- User closed browser without completing OAuth
- Solution: Normal behavior, no action needed

## Paystack Multi-Country Support

**Does it require backend connection?** YES

Paystack multi-country support is **fully implemented** and requires backend connection for:

1. **Country Selection**: Frontend fetches supported countries from backend
2. **Bank Lists**: Dynamic bank loading per country from Paystack API
3. **Account Verification**: Real-time verification for NG/GH/ZA (Kenya not supported)
4. **Withdrawals**: Country-specific account types and currency conversion

**What's Implemented:**

✅ Backend: 4 countries (NG, GH, ZA, KE) with account type mapping
✅ Backend: Country-specific bank lists with currency info
✅ Backend: Real-time account verification (NG/GH/ZA only)
✅ Backend: Currency conversion (Rc → NGN/GHS/ZAR/KES)
✅ Frontend: Country dropdown with currency display
✅ Frontend: Dynamic bank loading per country
✅ Frontend: Kenya warning for no verification
✅ Frontend: Automatic currency conversion

**API Endpoints:**
- `GET /api/v1/payments/paystack/countries` - List supported countries
- `GET /api/v1/payments/banks?country=XX` - Get banks for country
- `POST /api/v1/payments/verify-account` - Verify account (with country)
- `POST /api/v1/payments/withdraw` - Initiate withdrawal (with country)

## Status

✅ **OAuth Browser Integration**: Complete
✅ **API Endpoints**: Connected
✅ **Platform Implementations**: Android + iOS
✅ **Dependency Injection**: Configured
✅ **Deep Link Handling**: Android configured
✅ **Paystack Multi-Country**: Complete and connected

**Ready for Testing** 🚀
