package com.runinga.feature.explore.di

import com.runinga.feature.explore.data.repository.ExploreRepositoryImpl
import com.runinga.feature.explore.domain.repository.ExploreRepository
import com.runinga.feature.explore.presentation.viewmodel.ExploreViewModel
import org.koin.dsl.module

val exploreModule = module {
    single<ExploreRepository> { ExploreRepositoryImpl(get()) }
    factory { ExploreViewModel(get()) }
}
