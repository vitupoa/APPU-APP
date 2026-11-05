package com.runinga.com.core.di

import com.runinga.com.core.location.UserCurrencyProvider
import com.runinga.com.core.network.KtorClientFactory
import com.runinga.com.core.offline.MediaCacheManager
import com.runinga.com.core.offline.OfflineActionQueue
import com.runinga.com.core.offline.OfflineModeGuard
import com.runinga.com.core.security.DatabaseEncryption
import com.runinga.com.core.security.DataIntegrityChecker
import com.runinga.com.core.security.FinancialTransactionSecurity
import com.runinga.com.core.security.SecurityManager
import com.runinga.com.core.security.TokenManager
import com.runinga.com.core.security.DeviceSecurity
import com.runinga.com.core.session.SessionManager
import com.runinga.feature.auth.di.authModule
import com.runinga.feature.contests.di.contestsModule
import com.runinga.feature.feed.di.feedModule
import com.runinga.feature.shorts.di.shortsModule
import com.runinga.feature.wallet.di.walletModule
import com.runinga.feature.profile.di.profileModule
import com.runinga.feature.shop.di.shopModule
import com.runinga.feature.analytics.di.analyticsModule
import com.runinga.feature.comments.di.commentsModule
import com.runinga.feature.marketplace.di.marketplaceModule
import com.runinga.feature.explore.di.exploreModule
import com.runinga.com.core.network.WebSocketService
import io.ktor.client.HttpClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.SupervisorJob
import org.koin.core.module.Module
import org.koin.dsl.module

expect fun platformModule(): Module
expect fun getShareManager(): com.runinga.com.core.util.ShareManager

val coreModule = module {
    single<HttpClient> { KtorClientFactory.create(get<TokenManager>(), get<DeviceSecurity>(), get<SessionManager>()) }
    single { WebSocketService(get(), get()) }
    single { com.runinga.com.core.network.CloudinaryUploader(get()) }
    single<com.runinga.com.core.upload.UploadApi> { com.runinga.com.core.upload.UploadApiImpl(get()) }
    single { SessionManager() }
    single { UserCurrencyProvider(get(), get()) }
    single<com.runinga.com.core.util.ShareManager> { getShareManager() }
    
    // Offline support
    single { CoroutineScope(SupervisorJob()) }
    single { OfflineModeGuard() }
    single<OfflineActionQueue> { OfflineActionQueue(get(), get(), get()) }
    
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
        com.runinga.feature.chat.di.chatModule,
        com.runinga.feature.stories.di.storiesModule,
        com.runinga.feature.chama.di.chamaModule,
        com.runinga.feature.sponsored.di.sponsoredModule,
        marketplaceModule,
    )
