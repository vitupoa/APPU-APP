package com.krieta.feature.chat.presentation.list

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.chat.domain.model.Chat
import com.krieta.feature.chat.presentation.room.ChatRoomScreen
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

import com.krieta.feature.stories.presentation.viewmodel.StoriesViewModel
import com.krieta.feature.stories.presentation.components.StoriesRow
import com.krieta.feature.stories.presentation.screen.StoryViewerScreen

class ChatListScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ChatListViewModel>()
        val storiesViewModel = koinScreenModel<StoriesViewModel>()
        val state by viewModel.state.collectAsState()
        val storiesState by storiesViewModel.state.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Chats", fontWeight = FontWeight.Bold) },
                )
            }
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                // Stories Row
                if (!storiesState.isLoading || storiesState.storyGroups.isNotEmpty()) {
                    StoriesRow(
                        storyGroups = storiesState.storyGroups,
                        onStoryGroupClick = { group ->
                            val index = storiesState.storyGroups.indexOf(group)
                            navigator.push(StoryViewerScreen(
                                initialGroupIndex = index,
                                storyGroups = storiesState.storyGroups,
                                onStoryViewed = { storyId ->
                                    storiesViewModel.markStoryAsViewed(storyId)
                                }
                            ))
                        },
                        onAddStoryClick = {
                            navigator.push(com.krieta.feature.stories.presentation.screen.CreateStoryScreen())
                        }
                    )
                    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                }

                if (state.isLoading && state.chats.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else if (state.chats.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No chats yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        items(state.chats, key = { it.id }) { chat ->
                            ChatItem(chat = chat) {
                                navigator.push(ChatRoomScreen(chat.id, chat.name ?: chat.participants.firstOrNull()?.user?.displayName ?: "Chat"))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ChatItem(chat: Chat, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar placeholder
        Surface(
            modifier = Modifier.size(52.dp).clip(CircleShape),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            // Add AsyncImage when Coil is ready
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = chat.name ?: chat.participants.firstOrNull()?.user?.displayName ?: "Unknown",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                
                Text(
                    text = formatTime(chat.updatedAt),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = chat.latestMessage?.payload ?: "Started a chat",
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

private fun formatTime(instant: Instant): String {
    if (instant == Instant.DISTANT_PAST) return ""
    val dateTime = instant.toLocalDateTime(TimeZone.currentSystemDefault())
    val hour = if (dateTime.hour % 12 == 0) 12 else dateTime.hour % 12
    val amPm = if (dateTime.hour < 12) "AM" else "PM"
    val minute = dateTime.minute.toString().padStart(2, '0')
    return "$hour:$minute $amPm"
}
