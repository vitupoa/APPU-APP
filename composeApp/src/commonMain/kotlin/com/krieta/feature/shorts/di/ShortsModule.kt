package com.krieta.feature.shorts.di

import com.krieta.feature.shorts.data.remote.ShortsApi
import com.krieta.feature.shorts.data.repository.ShortsRepositoryImpl
import com.krieta.feature.shorts.domain.repository.ShortsRepository
import com.krieta.feature.shorts.presentation.viewmodel.ShortsViewModel
import org.koin.dsl.module

val shortsModule = module {
    single { ShortsApi(get()) }
    single<ShortsRepository> { ShortsRepositoryImpl(get()) }
    factory { ShortsViewModel(get(), get()) }
    factory { com.krieta.feature.shorts.presentation.viewmodel.CreateShortViewModel(get(), get()) }
}
