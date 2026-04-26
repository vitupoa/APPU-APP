package com.krieta.feature.live.di

import com.krieta.feature.live.data.repository.LiveRepositoryImpl
import com.krieta.feature.live.domain.repository.LiveRepository
import com.krieta.feature.live.presentation.viewmodel.ViewerLiveViewModel
import org.koin.dsl.module

val liveModule = module {
    single<LiveRepository> { LiveRepositoryImpl(get()) }
    
    factory { (streamId: String) ->
        ViewerLiveViewModel(liveRepository = get(), streamId = streamId)
    }
}
