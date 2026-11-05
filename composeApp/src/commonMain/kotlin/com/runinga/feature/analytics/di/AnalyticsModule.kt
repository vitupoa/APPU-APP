package com.runinga.feature.analytics.di

import com.runinga.feature.analytics.data.remote.AnalyticsApi
import com.runinga.feature.analytics.data.repository.AnalyticsRepositoryImpl
import com.runinga.feature.analytics.domain.repository.AnalyticsRepository
import com.runinga.feature.analytics.presentation.viewmodel.AnalyticsViewModel
import org.koin.dsl.module

val analyticsModule = module {
    single { AnalyticsApi(get()) }
    single<AnalyticsRepository> { AnalyticsRepositoryImpl(get()) }
    factory { AnalyticsViewModel(get()) }
}
