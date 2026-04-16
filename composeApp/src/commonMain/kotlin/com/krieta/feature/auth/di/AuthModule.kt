package com.krieta.feature.auth.di

import com.krieta.feature.auth.data.remote.AuthApi
import com.krieta.feature.auth.data.repository.AuthRepositoryImpl
import com.krieta.feature.auth.domain.repository.AuthRepository
import com.krieta.feature.auth.presentation.viewmodel.AuthViewModel
import com.krieta.feature.auth.presentation.viewmodel.RegisterViewModel
import org.koin.dsl.module

val authModule = module {
    single { AuthApi(get()) }
    single<AuthRepository> { AuthRepositoryImpl(get(), get(), get(), get()) }
    
    // ViewModels (in Koin Core for Voyager, we define as factory)
    factory { AuthViewModel(get()) }
    factory { RegisterViewModel(get(), get()) }
}
