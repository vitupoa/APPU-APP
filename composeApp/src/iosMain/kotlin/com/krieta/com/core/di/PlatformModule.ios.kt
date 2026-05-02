package com.krieta.com.core.di

import com.krieta.com.core.location.LocationProvider
import com.krieta.com.core.oauth.IOSOAuthBrowser
import com.krieta.com.core.oauth.OAuthBrowser
import com.krieta.com.core.security.DeviceSecurity
import com.krieta.com.core.security.IosDeviceSecurity
import com.krieta.com.core.security.IosTokenManager
import com.krieta.com.core.security.TokenManager
import com.krieta.com.core.security.BiometricAuthenticator
import com.krieta.com.core.security.IosBiometricAuthenticator
import com.krieta.com.core.security.SecureKeyStorage
import com.krieta.com.core.security.IosSecureKeyStorage
import com.krieta.com.security.DeviceSecurityChecker
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
}
