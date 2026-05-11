package com.krieta.com.core.di

import com.krieta.com.core.location.UserCurrencyProvider
import com.krieta.com.core.network.KtorClientFactory
import com.krieta.com.core.offline.MediaCacheManager
import com.krieta.com.core.offline.OfflineActionQueue
import com.krieta.com.core.offline.OfflineModeGuard
import com.krieta.com.core.security.DatabaseEncryption
import com.krieta.com.core.security.DataIntegrityChecker
import com.krieta.com.core.security.FinancialTransactionSecurity
import com.krieta.com.core.security.SecurityManager
import com.krieta.com.core.security.TokenManager
import com.krieta.com.core.security.DeviceSecurity
import com.krieta.com.core.session.SessionManager
import com.krieta.feature.auth.di.authModule
import com.krieta.feature.contests.di.contestsModule
import com.krieta.feature.feed.di.feedModule
import com.krieta.feature.shorts.di.shortsModule
import com.krieta.feature.wallet.di.walletModule
import com.krieta.feature.profile.di.profileModule
import com.krieta.feature.shop.di.shopModule
import com.krieta.feature.live.di.liveModule
import com.krieta.feature.analytics.di.analyticsModule
import com.krieta.feature.comments.di.commentsModule
import com.krieta.feature.marketplace.di.marketplaceModule
import com.krieta.feature.explore.di.exploreModule
import com.krieta.com.core.network.WebSocketService
import io.ktor.client.HttpClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import org.koin.core.module.Module
import org.koin.dsl.module

expect fun platformModule(): Module

val coreModule = module {
    single<HttpClient> { KtorClientFactory.create(get<TokenManager>(), get<DeviceSecurity>(), get<SessionManager>()) }
    single { WebSocketService(get(), get()) }
    single { com.krieta.com.core.network.CloudinaryUploader(get()) }
    single<com.krieta.com.core.upload.UploadApi> { com.krieta.com.core.upload.UploadApiImpl(get()) }
    single { SessionManager() }
    single { UserCurrencyProvider(get(), get()) }
    
    // Offline support
    single { CoroutineScope(SupervisorJob()) }
    single { OfflineModeGuard() }
    single { OfflineActionQueue(get(), get(), get()) }
    
    // Security
    single { DatabaseEncryption(get()) }
    single { DataIntegrityChecker(get()) }
    single { FinancialTransactionSecurity() }
    single { SecurityManager(get(), get(), get(), get()) }
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
        commentsModule,
        exploreModule,
        com.krieta.feature.chat.di.chatModule,
        com.krieta.feature.stories.di.storiesModule,
        com.krieta.feature.chama.di.chamaModule,
        com.krieta.feature.sponsored.di.sponsoredModule,
        marketplaceModule,
        liveModule,
    )
