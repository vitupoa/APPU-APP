package com.runinga.feature.wallet.di

import com.runinga.com.core.location.LocationProvider
import com.runinga.feature.wallet.data.remote.WalletApi
import com.runinga.feature.wallet.data.repository.WalletRepositoryImpl
import com.runinga.feature.wallet.domain.repository.WalletRepository
import com.runinga.feature.wallet.presentation.viewmodel.TopupViewModel
import com.runinga.feature.wallet.presentation.viewmodel.WalletViewModel
import com.runinga.feature.wallet.presentation.viewmodel.WithdrawViewModel
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
        com.runinga.feature.wallet.presentation.viewmodel.WithdrawViewModel(
            walletRepository = get(),
            userCurrency = get<LocationProvider>().getCurrentCurrency(),
            biometricAuthenticator = get(),
            secureKeyStorage = get(),
            tokenManager = get()
        )
    }
    factory {
        com.runinga.feature.wallet.presentation.withdraw.WithdrawViewModel(
            repository = get(),
            deviceSecurityChecker = get()
        )
    }
}
