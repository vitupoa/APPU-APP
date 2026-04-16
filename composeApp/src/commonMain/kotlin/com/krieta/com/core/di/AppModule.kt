package com.krieta.com.core.di

import com.krieta.com.core.location.UserCurrencyProvider
import com.krieta.com.core.network.KtorClientFactory
import com.krieta.com.core.security.TokenManager
import com.krieta.feature.auth.di.authModule
import com.krieta.feature.contests.di.contestsModule
import com.krieta.feature.feed.di.feedModule
import com.krieta.feature.shorts.di.shortsModule
import com.krieta.feature.wallet.di.walletModule
import com.krieta.feature.profile.di.profileModule
import com.krieta.feature.shop.di.shopModule
import com.krieta.feature.analytics.di.analyticsModule
import com.krieta.com.core.network.WebSocketService
import io.ktor.client.HttpClient
import org.koin.core.module.Module
import org.koin.dsl.module

expect fun platformModule(): Module

val coreModule = module {
    single<HttpClient> { KtorClientFactory.create(get<TokenManager>()) }
    single { WebSocketService(get(), get()) }
    single { com.krieta.com.core.network.CloudinaryUploader(get()) }
    // UserCurrencyProvider depends on LocationProvider (from platformModule) + WalletRepository (from walletModule)
    single { UserCurrencyProvider(get(), get()) }
}

val appModules: List<Module>
    get() = listOf(
        platformModule(),  // LocationProvider lives here (platform-specific)
        walletModule,      // WalletRepository must be available before coreModule's UserCurrencyProvider
        coreModule,
        authModule,
        shortsModule,
        feedModule,
        contestsModule,
        profileModule,
        shopModule,
        analyticsModule,
    )
