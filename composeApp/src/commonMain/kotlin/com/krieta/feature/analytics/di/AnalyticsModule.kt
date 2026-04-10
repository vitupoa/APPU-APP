package com.krieta.feature.analytics.di

import com.krieta.feature.analytics.data.remote.AnalyticsApi
import com.krieta.feature.analytics.data.repository.AnalyticsRepositoryImpl
import com.krieta.feature.analytics.domain.repository.AnalyticsRepository
import com.krieta.feature.analytics.presentation.viewmodel.AnalyticsViewModel
import org.koin.dsl.module

val analyticsModule = module {
    single { AnalyticsApi(get()) }
    single<AnalyticsRepository> { AnalyticsRepositoryImpl(get()) }
    factory { AnalyticsViewModel(get()) }
}
