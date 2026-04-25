package com.krieta.feature.stories.di

import com.krieta.feature.stories.data.remote.StoryApi
import com.krieta.feature.stories.data.repository.StoryRepositoryImpl
import com.krieta.feature.stories.domain.repository.StoryRepository
import com.krieta.feature.stories.presentation.viewmodel.StoriesViewModel
import org.koin.dsl.module

val storiesModule = module {
    single { StoryApi(get()) }
    single<StoryRepository> { StoryRepositoryImpl(get()) }
    
    factory { StoriesViewModel(get()) }
}
