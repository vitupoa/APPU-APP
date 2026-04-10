package com.krieta.com.core.di

import com.krieta.com.core.security.DeviceSecurity
import com.krieta.com.core.security.IosDeviceSecurity
import com.krieta.com.core.security.IosTokenManager
import com.krieta.com.core.security.TokenManager
import org.koin.core.module.Module
import org.koin.dsl.module

actual fun platformModule(): Module = module {
    single<TokenManager> { IosTokenManager() }
    single<DeviceSecurity> { IosDeviceSecurity() }
}
