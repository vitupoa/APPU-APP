package com.krieta.com.core.navigation

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.material.icons.filled.ChatBubbleOutline
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember

import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabOptions
import com.krieta.feature.chat.presentation.list.ChatListScreen

object ChatsTab : Tab {
    override val options: TabOptions
        @Composable
        get() {
            val title = "Chats"
            val icon = rememberVectorPainter(Icons.Default.ChatBubbleOutline)

            return remember {
                TabOptions(
                    index = 4u,
                    title = title,
                    icon = icon
                )
            }
        }

    @Composable
    override fun Content() {
        Navigator(ChatListScreen())
    }
}
