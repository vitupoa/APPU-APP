package com.krieta.feature.feed.di

import com.krieta.feature.feed.data.local.DripLocalDataSource
import com.krieta.feature.feed.data.remote.FeedApi
import com.krieta.feature.feed.data.repository.FeedRepositoryImpl
import com.krieta.feature.feed.domain.repository.FeedRepository
import com.krieta.feature.feed.presentation.viewmodel.FeedViewModel
import org.koin.dsl.module

val feedModule = module {
    single { FeedApi(get()) }
    single { DripLocalDataSource(get()) }
    single<FeedRepository> { FeedRepositoryImpl(get(), get(), get(), get()) }
    factory { FeedViewModel(get(), get()) }
    factory { com.krieta.feature.feed.presentation.viewmodel.CreatePostViewModel(get(), get()) }
}
