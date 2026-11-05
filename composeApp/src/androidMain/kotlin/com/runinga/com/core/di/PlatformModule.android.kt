package com.runinga.com.core.di

import com.runinga.com.core.location.LocationProvider
import com.runinga.com.core.oauth.AndroidOAuthBrowser
import com.runinga.com.core.oauth.OAuthBrowser
import com.runinga.com.core.offline.MediaCacheManager
import com.runinga.com.core.security.AndroidDeviceSecurity
import com.runinga.com.core.security.AndroidTokenManager
import com.runinga.com.core.security.DeviceSecurity
import com.runinga.com.core.security.TokenManager
import com.runinga.com.core.security.BiometricAuthenticator
import com.runinga.com.core.security.AndroidBiometricAuthenticator
import com.runinga.com.core.security.SecureKeyStorage
import com.runinga.com.core.security.AndroidSecureKeyStorage
import com.runinga.com.security.DeviceSecurityChecker
import com.runinga.db.RuningaDatabase
import app.cash.sqldelight.driver.android.AndroidSqliteDriver
import android.content.Context
import org.koin.android.ext.koin.androidContext
import org.koin.core.module.Module
import org.koin.dsl.module

actual fun platformModule(): Module = module {
    // SQLDelight Database
    single<RuningaDatabase> { 
        RuningaDatabase(
            driver = AndroidSqliteDriver(
                schema = RuningaDatabase.Schema,
                context = androidContext(),
                name = "runinga.db"
            )
        )
    }
    
    single<TokenManager> { AndroidTokenManager(androidContext()) }
    single<DeviceSecurity> { AndroidDeviceSecurity(androidContext()) }
    single { LocationProvider(androidContext()) }
    single<OAuthBrowser> { AndroidOAuthBrowser(androidContext()) }
    single<BiometricAuthenticator> { AndroidBiometricAuthenticator(androidContext()) }
    single<SecureKeyStorage> { AndroidSecureKeyStorage(androidContext()) }
    single { DeviceSecurityChecker(androidContext()) }
    single { MediaCacheManager(androidContext()) }
}

actual fun getShareManager(): com.runinga.com.core.util.ShareManager {
    return com.runinga.com.core.util.AndroidShareManager(org.koin.core.context.GlobalContext.get().get())
}
