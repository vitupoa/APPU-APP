package com.krieta.feature.explore.di

import com.krieta.feature.explore.data.repository.ExploreRepositoryImpl
import com.krieta.feature.explore.domain.repository.ExploreRepository
import com.krieta.feature.explore.presentation.viewmodel.ExploreViewModel
import org.koin.dsl.module

val exploreModule = module {
    single<ExploreRepository> { ExploreRepositoryImpl(get()) }
    factory { ExploreViewModel(get()) }
}
