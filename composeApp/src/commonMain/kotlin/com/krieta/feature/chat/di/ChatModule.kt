package com.krieta.feature.chat.di

import com.krieta.feature.chat.data.remote.ChatApi
import com.krieta.feature.chat.data.repository.ChatRepositoryImpl
import com.krieta.feature.chat.domain.repository.ChatRepository
import com.krieta.feature.chat.presentation.list.ChatListViewModel
import com.krieta.feature.chat.presentation.room.ChatRoomViewModel
import com.krieta.feature.chat.presentation.settings.GroupSettingsViewModel
import com.krieta.feature.chat.presentation.screen.UserSearchViewModel
import com.krieta.feature.chat.presentation.screen.CreateGroupViewModel
import org.koin.dsl.module

val chatModule = module {
    single { ChatApi(get()) }
    single<ChatRepository> { ChatRepositoryImpl(get()) }
    
    factory { ChatListViewModel(get(), get()) }
    factory { (chatId: String) -> ChatRoomViewModel(chatId, get(), get(), get()) }
    factory { (chatId: String) -> GroupSettingsViewModel(chatId, get(), get(), get()) }
    factory { UserSearchViewModel(get()) }
    factory { CreateGroupViewModel(get(), get()) }
}
