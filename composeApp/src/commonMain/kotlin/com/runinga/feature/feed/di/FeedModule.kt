package com.runinga.feature.feed.di

import com.runinga.feature.feed.data.local.DripLocalDataSource
import com.runinga.feature.feed.data.remote.FeedApi
import com.runinga.feature.feed.data.repository.FeedRepositoryImpl
import com.runinga.feature.feed.domain.repository.FeedRepository
import com.runinga.feature.feed.presentation.viewmodel.FeedViewModel
import org.koin.dsl.module

val feedModule = module {
    single { FeedApi(get()) }
    single { DripLocalDataSource(get()) }
    single<FeedRepository> { FeedRepositoryImpl(get(), get(), get(), get()) }
    factory { FeedViewModel(get(), get()) }
    factory { com.runinga.feature.feed.presentation.viewmodel.CreatePostViewModel(get(), get()) }
}
