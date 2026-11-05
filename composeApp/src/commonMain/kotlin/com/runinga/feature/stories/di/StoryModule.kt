package com.runinga.feature.stories.di

import com.runinga.feature.stories.data.remote.StoryApi
import com.runinga.feature.stories.data.repository.StoryRepositoryImpl
import com.runinga.feature.stories.domain.repository.StoryRepository
import com.runinga.feature.stories.presentation.viewmodel.StoriesViewModel
import org.koin.dsl.module

val storiesModule = module {
    single { StoryApi(get()) }
    single<StoryRepository> { StoryRepositoryImpl(get()) }
    
    factory { StoriesViewModel(get()) }
}
