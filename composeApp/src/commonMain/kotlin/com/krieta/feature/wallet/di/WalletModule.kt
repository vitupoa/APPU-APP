package com.krieta.feature.wallet.di

import com.krieta.com.core.location.LocationProvider
import com.krieta.feature.wallet.data.remote.WalletApi
import com.krieta.feature.wallet.data.repository.WalletRepositoryImpl
import com.krieta.feature.wallet.domain.repository.WalletRepository
import com.krieta.feature.wallet.presentation.viewmodel.TopupViewModel
import com.krieta.feature.wallet.presentation.viewmodel.WalletViewModel
import com.krieta.feature.wallet.presentation.viewmodel.WithdrawViewModel
import org.koin.dsl.module

val walletModule = module {
    single { WalletApi(get()) }
    single<WalletRepository> { WalletRepositoryImpl(get()) }

    factory { WalletViewModel(get(), get()) }
    factory {
        val locationProvider = get<LocationProvider>()
        TopupViewModel(get(), locationProvider.getCurrentCurrency())
    }
    factory {
        val locationProvider = get<LocationProvider>()
        val tokenManager = get<com.krieta.com.core.security.TokenManager>()
        val biometricAuth = get<com.krieta.com.core.security.BiometricAuthenticator>()
        val secureStorage = get<com.krieta.com.core.security.SecureKeyStorage>()
        val userId = kotlinx.coroutines.runBlocking { tokenManager.getUserId() } ?: ""
        val deviceId = com.krieta.com.core.util.DeviceFingerprint.getFingerprint()
        WithdrawViewModel(
            walletRepository = get(),
            userCurrency = locationProvider.getCurrentCurrency(),
            biometricAuthenticator = biometricAuth,
            secureKeyStorage = secureStorage,
            userId = userId,
            deviceId = deviceId
        )
    }
}
