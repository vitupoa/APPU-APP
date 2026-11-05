package com.runinga.com.core.di

import com.runinga.com.core.location.LocationProvider
import com.runinga.com.core.oauth.IOSOAuthBrowser
import com.runinga.com.core.oauth.OAuthBrowser
import com.runinga.com.core.offline.MediaCacheManager
import com.runinga.com.core.security.DeviceSecurity
import com.runinga.com.core.security.IosDeviceSecurity
import com.runinga.com.core.security.IosTokenManager
import com.runinga.com.core.security.TokenManager
import com.runinga.com.core.security.BiometricAuthenticator
import com.runinga.com.core.security.IosBiometricAuthenticator
import com.runinga.com.core.security.SecureKeyStorage
import com.runinga.com.core.security.IosSecureKeyStorage
import com.runinga.com.security.DeviceSecurityChecker
import org.koin.core.module.Module
import org.koin.dsl.module

actual fun platformModule(): Module = module {
    single<TokenManager> { IosTokenManager() }
    single<DeviceSecurity> { IosDeviceSecurity() }
    single { LocationProvider() }
    single<OAuthBrowser> { IOSOAuthBrowser() }
    single<BiometricAuthenticator> { IosBiometricAuthenticator() }
    single<SecureKeyStorage> { IosSecureKeyStorage() }
    single { DeviceSecurityChecker() }
    single { MediaCacheManager() }
}

actual fun getShareManager(): com.runinga.com.core.util.ShareManager {
    return com.runinga.com.core.util.IosShareManager()
}
