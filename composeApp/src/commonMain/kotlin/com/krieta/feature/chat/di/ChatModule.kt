package com.krieta.feature.chat.di

import com.krieta.feature.chat.data.remote.ChatApi
import com.krieta.feature.chat.data.repository.ChatRepositoryImpl
import com.krieta.feature.chat.domain.repository.ChatRepository
import com.krieta.feature.chat.presentation.list.ChatListViewModel
import com.krieta.feature.chat.presentation.room.ChatRoomViewModel
import org.koin.dsl.module

val chatModule = module {
    single { ChatApi(get()) }
    single<ChatRepository> { ChatRepositoryImpl(get()) }
    
    factory { ChatListViewModel(get(), get()) }
    factory { (chatId: String) -> ChatRoomViewModel(chatId, get(), get(), get()) }
}
