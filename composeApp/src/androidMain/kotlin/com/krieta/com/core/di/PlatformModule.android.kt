package com.krieta.com.core.di

import com.krieta.com.core.security.AndroidDeviceSecurity
import com.krieta.com.core.security.AndroidTokenManager
import com.krieta.com.core.security.DeviceSecurity
import com.krieta.com.core.security.TokenManager
import org.koin.android.ext.koin.androidContext
import org.koin.core.module.Module
import org.koin.dsl.module

actual fun platformModule(): Module = module {
    single<TokenManager> { AndroidTokenManager(androidContext()) }
    single<DeviceSecurity> { AndroidDeviceSecurity(androidContext()) }
}
