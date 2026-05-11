package com.krieta.feature.chat.di

import com.krieta.com.core.network.ApiConstants
import com.krieta.feature.chat.data.local.ChatLocalDataSource
import com.krieta.feature.chat.data.media.ChatMediaUploadService
import com.krieta.feature.chat.data.media.ImageCompressor
import com.krieta.feature.chat.data.remote.ChatApi
import com.krieta.feature.chat.data.repository.ChatRepositoryImpl
import com.krieta.feature.chat.domain.repository.ChatRepository
import com.krieta.feature.chat.domain.ChatEventBus
import com.krieta.feature.chat.presentation.list.ChatListViewModel
import com.krieta.feature.chat.presentation.room.ChatRoomViewModel
import com.krieta.feature.chat.presentation.settings.GroupSettingsViewModel
import com.krieta.feature.chat.presentation.screen.UserSearchViewModel
import com.krieta.feature.chat.presentation.screen.CreateGroupViewModel
import org.koin.dsl.module

val chatModule = module {
    single { ChatApi(get()) }
    single { ChatLocalDataSource(get()) }
    single<ChatRepository> { ChatRepositoryImpl(get(), get(), get()) }
    single { ChatEventBus() }
    single { ImageCompressor() }
    single { 
        ChatMediaUploadService(
            httpClient = get(),
            baseUrl = ApiConstants.BASE_URL,
            authToken = "", // Token will be fetched dynamically
            imageCompressor = get()
        )
    }
    
    factory { ChatListViewModel(get(), get(), get()) }
    factory { (chatId: String) -> ChatRoomViewModel(chatId, get(), get(), get(), get(), get()) }
    factory { (chatId: String) -> GroupSettingsViewModel(chatId, get(), get(), get()) }
    factory { UserSearchViewModel(get()) }
    factory { CreateGroupViewModel(get(), get()) }
}
