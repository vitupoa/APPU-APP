package com.krieta.feature.live.di

import com.krieta.feature.live.data.repository.LiveRepositoryImpl
import com.krieta.feature.live.data.socket.LiveSocketManager
import com.krieta.feature.live.domain.repository.LiveRepository
import com.krieta.feature.live.presentation.viewmodel.ViewerLiveViewModel
import org.koin.dsl.module

val liveModule = module {
    single<LiveRepository> { LiveRepositoryImpl(get()) }
    
    single { 
        LiveSocketManager(
            client = get(),
            baseUrl = "wss://appu-app-production.up.railway.app"
        )
    }
    
    factory { (streamId: String) ->
        val tokenManager = get<com.krieta.com.core.security.TokenManager>()
        ViewerLiveViewModel(
            liveRepository = get(),
            socketManager = get(),
            streamId = streamId,
            tokenManager = tokenManager,
            currentUserId = "current-user", // TODO: Get from auth state
            currentUsername = "user", // TODO: Get from auth state
            currentUserAvatar = null // TODO: Get from auth state
        )
    }
}
