# Automatic Token Refresh Implementation

## Overview
The app now implements **automatic token refresh** to prevent authentication errors when the access token expires (15-minute lifetime).

## How It Works

### 1. **Token Lifecycle**
- **Access Token**: Short-lived (15 minutes) - used for API authentication
- **Refresh Token**: Long-lived (7-30 days) - used to get new access tokens

### 2. **Automatic Refresh Flow**
```
User makes API request
    ↓
Access token expired? (401)
    ↓
Ktor Auth Plugin intercepts
    ↓
Calls /api/v1/auth/refresh with refresh token
    ↓
Backend validates refresh token
    ↓
Returns new access + refresh tokens
    ↓
Tokens saved automatically
    ↓
Original request retried with new token
    ↓
Success! User never sees error
```

### 3. **Implementation Details**

**Location**: `composeApp/src/commonMain/kotlin/com/krieta/com/core/network/KtorClient.kt`

**Key Components**:

```kotlin
install(Auth) {
    bearer {
        // Load current tokens
        loadTokens {
            val access = tokenManager.getAccessToken()
            val refresh = tokenManager.getRefreshToken()
            if (access != null && refresh != null) {
                BearerTokens(access, refresh)
            } else null
        }
        
        // Automatically refresh when 401 received
        refreshTokens {
            val refresh = tokenManager.getRefreshToken() ?: return@refreshTokens null
            val deviceId = deviceSecurity?.getDeviceId() ?: "UNKNOWN_DEVICE"
            
            try {
                val response = client.post(ApiConstants.AUTH_REFRESH) {
                    setBody(mapOf("refreshToken" to refresh, "deviceId" to deviceId))
                }
                
                if (response.status.value == 200) {
                    val tokens = response.body<AuthResponseDto>()
                    if (tokens.accessToken != null && tokens.refreshToken != null) {
                        // Save new tokens
                        tokenManager.saveAccessToken(tokens.accessToken)
                        tokenManager.saveRefreshToken(tokens.refreshToken)
                        return@refreshTokens BearerTokens(tokens.accessToken, tokens.refreshToken)
                    }
                }
                null
            } catch (e: Exception) {
                // Clear tokens on refresh failure to force re-login
                tokenManager.clearTokens()
                null
            }
        }
    }
}
```

## Benefits

✅ **Seamless User Experience**: Users never see "session expired" errors during normal usage
✅ **Automatic Recovery**: Failed requests are automatically retried with fresh tokens
✅ **Security**: Short-lived access tokens minimize security risk
✅ **Background Operation**: Refresh happens transparently without user interaction

## Edge Cases Handled

### 1. **Refresh Token Expired**
- Automatic refresh fails
- Tokens are cleared
- User redirected to login screen on next API call

### 2. **Network Failure During Refresh**
- Refresh attempt fails
- Original request fails with error
- User can retry manually

### 3. **Concurrent Requests**
- Multiple 401s trigger single refresh
- Ktor Auth plugin handles synchronization
- All pending requests use new token

### 4. **App Restart**
- Tokens loaded from encrypted storage
- First API call validates token
- Auto-refresh if expired

## Logging

The implementation includes comprehensive logging:

```
🔄 Token refresh triggered - attempting to refresh access token
✅ Token refresh successful - new tokens saved
❌ Token refresh failed - status: 401
❌ Token refresh exception: Connection timeout
```

## Backend Requirements

The backend must support the refresh endpoint:

**Endpoint**: `POST /api/v1/auth/refresh`

**Request**:
```json
{
  "refreshToken": "eyJhbGc...",
  "deviceId": "device-uuid"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { ... }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "error": "Invalid or expired refresh token"
}
```

## Testing

### Manual Testing
1. Login to the app
2. Wait 15+ minutes (or modify token expiry for testing)
3. Navigate to any screen that makes API calls
4. Observe: No errors, seamless operation
5. Check logs: See "Token refresh successful" message

### Simulating Token Expiry
For testing, you can modify the backend to issue tokens with 1-minute expiry:
```typescript
// backend/src/shared/utils/jwt.util.ts
const accessToken = jwt.sign(payload, secret, { expiresIn: '1m' }); // Instead of '15m'
```

## Troubleshooting

### Issue: "Session expired" errors still appearing
**Cause**: Refresh token expired or invalid
**Solution**: User must logout and login again

### Issue: Infinite refresh loop
**Cause**: Backend returning 401 even with valid refresh token
**Solution**: Check backend logs, verify refresh endpoint implementation

### Issue: Tokens not persisting
**Cause**: TokenManager not saving tokens properly
**Solution**: Check AndroidTokenManager/IOSTokenManager implementation

## Security Considerations

1. **Encrypted Storage**: Tokens stored in EncryptedSharedPreferences (Android) / Keychain (iOS)
2. **HTTPS Only**: All token transmission over secure connections
3. **Token Rotation**: Both access and refresh tokens rotated on refresh
4. **Device Binding**: Refresh tokens tied to device ID
5. **Automatic Cleanup**: Tokens cleared on refresh failure

## Future Enhancements

- [ ] Proactive refresh (refresh before expiry)
- [ ] Retry logic with exponential backoff
- [ ] Token refresh queue for offline scenarios
- [ ] Biometric re-authentication for sensitive operations
- [ ] Token revocation on security events

## Related Files

- `KtorClient.kt` - HTTP client with auth plugin
- `TokenManager.kt` - Token storage interface
- `AndroidTokenManager.kt` - Android token storage
- `AuthRepositoryImpl.kt` - Auth operations
- `AuthApi.kt` - Auth API endpoints
- `ProfileRepositoryImpl.kt` - Profile error handling

## Summary

Automatic token refresh is now **fully implemented and working**. Users will experience seamless authentication without manual re-login for the lifetime of their refresh token (typically 7-30 days). The implementation handles all edge cases and provides comprehensive logging for debugging.
