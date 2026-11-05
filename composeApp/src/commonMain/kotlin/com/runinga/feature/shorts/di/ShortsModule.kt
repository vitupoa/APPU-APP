package com.runinga.feature.shorts.di

import com.runinga.feature.shorts.data.local.ShortLocalDataSource
import com.runinga.feature.shorts.data.remote.ShortsApi
import com.runinga.feature.shorts.data.repository.ShortsRepositoryImpl
import com.runinga.feature.shorts.domain.repository.ShortsRepository
import com.runinga.feature.shorts.presentation.viewmodel.ShortsViewModel
import org.koin.dsl.module

val shortsModule = module {
    single { ShortsApi(get()) }
    single { ShortLocalDataSource(get()) }
    single<ShortsRepository> { ShortsRepositoryImpl(get(), get(), get()) }
    factory { ShortsViewModel(get(), get(), get()) }  // shortsRepository, feedRepository, sponsoredManager
    factory { com.runinga.feature.shorts.presentation.viewmodel.CreateShortViewModel(get(), get()) }
}
