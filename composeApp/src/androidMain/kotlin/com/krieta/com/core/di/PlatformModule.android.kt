package com.krieta.com.core.di

import com.krieta.com.core.location.LocationProvider
import com.krieta.com.core.oauth.AndroidOAuthBrowser
import com.krieta.com.core.oauth.OAuthBrowser
import com.krieta.com.core.security.AndroidDeviceSecurity
import com.krieta.com.core.security.AndroidTokenManager
import com.krieta.com.core.security.DeviceSecurity
import com.krieta.com.core.security.TokenManager
import android.content.Context
import org.koin.android.ext.koin.androidContext
import org.koin.core.module.Module
import org.koin.dsl.module

actual fun platformModule(): Module = module {
    single<Context> { androidContext() }
    single<TokenManager> { AndroidTokenManager(androidContext()) }
    single<DeviceSecurity> { AndroidDeviceSecurity(androidContext()) }
    single { LocationProvider(androidContext()) }
    single<OAuthBrowser> { AndroidOAuthBrowser(androidContext()) }
}
