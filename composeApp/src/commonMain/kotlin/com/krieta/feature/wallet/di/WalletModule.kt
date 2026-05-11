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
    single<WalletRepository> { WalletRepositoryImpl(get(), get(), get(), get()) }

    factory { WalletViewModel(get(), get()) }
    factory {
        val locationProvider = get<LocationProvider>()
        TopupViewModel(get(), locationProvider.getCurrentCurrency())
    }
    factory {
        com.krieta.feature.wallet.presentation.viewmodel.WithdrawViewModel(
            walletRepository = get(),
            userCurrency = get<LocationProvider>().getCurrentCurrency(),
            biometricAuthenticator = get(),
            secureKeyStorage = get(),
            tokenManager = get()
        )
    }
    factory {
        com.krieta.feature.wallet.presentation.withdraw.WithdrawViewModel(
            repository = get(),
            deviceSecurityChecker = get()
        )
    }
}
