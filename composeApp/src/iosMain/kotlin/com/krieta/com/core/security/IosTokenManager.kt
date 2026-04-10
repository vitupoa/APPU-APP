package com.krieta.com.core.security

import platform.Foundation.NSUserDefaults
import platform.Security.SecItemAdd
import platform.Security.SecItemCopyMatching
import platform.Security.SecItemDelete
import platform.Foundation.NSData
import platform.Foundation.NSString
import platform.Foundation.NSUTF8StringEncoding
import platform.Foundation.create
import platform.Foundation.dataUsingEncoding

class IosTokenManager : TokenManager {
    private val defaults = NSUserDefaults.standardUserDefaults

    // For production, use Keychain Services for secure storage
    // This is a simplified implementation using NSUserDefaults for initial development
    // TODO: Replace with proper Keychain implementation using Security framework

    override suspend fun saveAccessToken(token: String) {
        defaults.setObject(token, forKey = KEY_ACCESS_TOKEN)
    }

    override suspend fun getAccessToken(): String? {
        return defaults.stringForKey(KEY_ACCESS_TOKEN)
    }

    override suspend fun saveRefreshToken(token: String) {
        defaults.setObject(token, forKey = KEY_REFRESH_TOKEN)
    }

    override suspend fun getRefreshToken(): String? {
        return defaults.stringForKey(KEY_REFRESH_TOKEN)
    }

    override suspend fun clearTokens() {
        defaults.removeObjectForKey(KEY_ACCESS_TOKEN)
        defaults.removeObjectForKey(KEY_REFRESH_TOKEN)
    }

    override suspend fun isLoggedIn(): Boolean {
        return getAccessToken() != null
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "krieta_access_token"
        private const val KEY_REFRESH_TOKEN = "krieta_refresh_token"
    }
}
