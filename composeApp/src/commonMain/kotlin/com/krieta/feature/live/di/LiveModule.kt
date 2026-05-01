package com.krieta.feature.live.di

import com.krieta.feature.live.data.repository.LiveRepositoryImpl
import com.krieta.feature.live.data.socket.LiveSocketManager
import com.krieta.feature.live.domain.repository.LiveRepository
import com.krieta.feature.live.presentation.viewmodel.ViewerLiveViewModel
import org.koin.dsl.module
import kotlinx.coroutines.runBlocking

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
        
        // Get user session from TokenManager
        val userSession = runBlocking { tokenManager.getUserSession() }
        val userId = userSession?.userId ?: runBlocking { tokenManager.getUserId() } ?: "unknown"
        val username = userSession?.username ?: "user"
        val avatarUrl = userSession?.avatarUrl
        
        ViewerLiveViewModel(
            liveRepository = get(),
            socketManager = get(),
            streamId = streamId,
            tokenManager = tokenManager,
            currentUserId = userId,
            currentUsername = username,
            currentUserAvatar = avatarUrl
        )
    }
}
