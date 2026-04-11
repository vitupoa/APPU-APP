package com.krieta.com.core.di

import com.krieta.com.core.location.LocationProvider
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
    single { LocationProvider() }
}

val appModules: List<Module>
    get() = listOf(
        coreModule,
        platformModule(),
        authModule,
        walletModule,
        shortsModule,
        feedModule,
        contestsModule,
        profileModule,
        shopModule,
        analyticsModule,
    )
