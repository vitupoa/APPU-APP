package com.runinga.feature.chat.presentation.list

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.remember
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.runinga.feature.chat.domain.model.Chat
import com.runinga.feature.chat.domain.model.ChatType
import com.runinga.feature.chat.presentation.room.ChatRoomScreen
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import com.runinga.feature.stories.presentation.viewmodel.StoriesViewModel
import com.runinga.feature.stories.presentation.components.StoriesRow
import com.runinga.feature.stories.presentation.screen.StoryViewerScreen
import coil3.compose.AsyncImage
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.background


class ChatListScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ChatListViewModel>()
        val storiesViewModel = koinScreenModel<StoriesViewModel>()
        val chamaViewModel = koinScreenModel<com.runinga.feature.chama.presentation.ChamaListViewModel>()
        val state by viewModel.state.collectAsState()
        val storiesState by storiesViewModel.state.collectAsState()
        val chamaState by chamaViewModel.state.collectAsState()
        val scope = rememberCoroutineScope()
        
        // Use LaunchedEffect with a key that changes when returning from other screens
        // This will re-trigger when the navigator changes
        LaunchedEffect(navigator.lastItem) {
            viewModel.refreshChats()
            storiesViewModel.refresh()
            chamaViewModel.loadMyChamas()
        }
        
        // Additional delayed refresh for stories uploaded in background
        LaunchedEffect(Unit) {
            delay(2000)
            storiesViewModel.refresh()
        }
        
        val tokenManager = org.koin.compose.koinInject<com.runinga.com.core.security.TokenManager>()
        val currentUserId = runBlocking { tokenManager.getUserId() }
        
        var showChatMenu by remember { mutableStateOf(false) }
        var searchQuery by remember { mutableStateOf("") }
        var selectedTab by remember { mutableStateOf(ChatTab.ALL) }
        var isRefreshing by remember { mutableStateOf(false) }
        var isSearchExpanded by remember { mutableStateOf(false) }
        val searchFocusRequester = remember { FocusRequester() }
        
        // Collect IDs of users who have active stories for yellow ring indicator
        val storyCreatorIds = remember(storiesState.storyGroups) {
            storiesState.storyGroups.map { it.creator.id }.toSet()
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        AnimatedVisibility(
                            visible = isSearchExpanded,
                            enter = fadeIn() + slideInHorizontally { it / 2 },
                            exit = fadeOut() + slideOutHorizontally { it / 2 }
                        ) {
                            OutlinedTextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .heightIn(max = 48.dp)
                                    .focusRequester(searchFocusRequester),
                                placeholder = { Text("Search chats, groups...", fontSize = 14.sp) },
                                singleLine = true,
                                shape = RoundedCornerShape(24.dp),
                                trailingIcon = {
                                    IconButton(onClick = {
                                        searchQuery = ""
                                        isSearchExpanded = false
                                    }) {
                                        Icon(Icons.Default.Close, contentDescription = "Close search")
                                    }
                                },
                                textStyle = MaterialTheme.typography.bodyMedium
                            )
                        }
                        if (!isSearchExpanded) {
                            Text("Chats", fontWeight = FontWeight.Bold)
                        }
                    },
                    actions = {
                        if (!isSearchExpanded) {
                            IconButton(
                                onClick = {
                                    isSearchExpanded = true
                                    scope.launch {
                                        delay(100)
                                        try { searchFocusRequester.requestFocus() } catch (_: Exception) {}
                                    }
                                }
                            ) {
                                Icon(Icons.Default.Search, "Search")
                            }
                        }
                        IconButton(
                            onClick = {
                                if (!isRefreshing) {
                                    isRefreshing = true
                                    viewModel.refreshChats()
                                    scope.launch {
                                        delay(1000)
                                        isRefreshing = false
                                    }
                                }
                            }
                        ) {
                            if (isRefreshing) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(24.dp),
                                    strokeWidth = 2.dp
                                )
                            } else {
                                Icon(Icons.Default.Refresh, "Refresh")
                            }
                        }
                    }
                )
            },
            floatingActionButton = {
                ChatFloatingActionMenu(
                    expanded = showChatMenu,
                    onExpandChange = { showChatMenu = it },
                    onNewDirectChat = {
                        navigator.push(com.runinga.feature.chat.presentation.screen.UserSearchScreen())
                        showChatMenu = false
                    },
                    onNewGroup = {
                        navigator.push(com.runinga.feature.chat.presentation.screen.CreateGroupScreen())
                        showChatMenu = false
                    },
                    onNewChama = {
                        navigator.push(com.runinga.feature.chama.presentation.wizard.CreateChamaScreen())
                        showChatMenu = false
                    }
                )
            }
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                // Stories row always visible (WhatsApp Status-style)
                StoriesRow(
                    storyGroups = storiesState.storyGroups,
                    myStories = storiesState.myStories,
                    onStoryGroupClick = { group ->
                        val index = if (group == storiesState.myStories) {
                            -1
                        } else {
                            storiesState.storyGroups.indexOf(group)
                        }
                        
                        val allGroups = if (storiesState.myStories != null) {
                            listOf(storiesState.myStories!!) + storiesState.storyGroups
                        } else {
                            storiesState.storyGroups
                        }
                        
                        val actualIndex = if (index == -1) 0 else if (storiesState.myStories != null) index + 1 else index
                        
                        navigator.push(StoryViewerScreen(
                            initialGroupIndex = actualIndex,
                            storyGroups = allGroups,
                            onStoryViewed = { storyId ->
                                storiesViewModel.markStoryAsViewed(storyId)
                            },
                            onStoryDeleted = { storyId ->
                                storiesViewModel.deleteStory(storyId)
                            },
                            currentUserId = currentUserId
                        ))
                    },
                    onAddStoryClick = {
                        navigator.push(com.runinga.feature.stories.presentation.screen.CreateStoryScreen())
                    }
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)

                PrimaryScrollableTabRow(
                    selectedTabIndex = selectedTab.ordinal,
                    modifier = Modifier.fillMaxWidth(),
                    edgePadding = 16.dp
                ) {
                    ChatTab.values().forEach { tab ->
                        Tab(
                            selected = selectedTab == tab,
                            onClick = { selectedTab = tab },
                            text = { Text(tab.title) }
                        )
                    }
                }

                if (state.isLoading && state.chats.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                } else if (state.chats.isEmpty() && chamaState.myChamas.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No chats yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                } else {
                    val allChats = buildList {
                        addAll(state.chats.map { ChatListItem.RegularChat(it) })
                        addAll(chamaState.myChamas.map { ChatListItem.ChamaChat(it) })
                    }.sortedByDescending { item ->
                        when (item) {
                            is ChatListItem.RegularChat -> item.chat.updatedAt
                            is ChatListItem.ChamaChat -> Instant.parse(item.chama.createdAt)
                        }
                    }

                    val tabFilteredChats = when (selectedTab) {
                        ChatTab.ALL -> allChats
                        ChatTab.DIRECT -> allChats.filter { 
                            it is ChatListItem.RegularChat && it.chat.type == ChatType.DIRECT 
                        }
                        ChatTab.GROUP -> allChats.filter { 
                            it is ChatListItem.RegularChat && it.chat.type == ChatType.GROUP 
                        }
                        ChatTab.CHAMA -> allChats.filter { it is ChatListItem.ChamaChat }
                        ChatTab.UNREAD -> allChats.filter { item ->
                            when (item) {
                                is ChatListItem.RegularChat -> item.chat.latestMessage?.status != "read"
                                is ChatListItem.ChamaChat -> false
                            }
                        }
                        ChatTab.ARCHIVED -> allChats.filter { false }
                        ChatTab.FAVORITES -> allChats.filter { false }
                    }

                    val filteredChats = if (searchQuery.isBlank()) {
                        tabFilteredChats
                    } else {
                        tabFilteredChats.filter { item ->
                            when (item) {
                                is ChatListItem.RegularChat -> {
                                    val chat = item.chat
                                    val chatName = chat.name ?: chat.participants.firstOrNull()?.user?.displayName ?: ""
                                    val username = chat.participants.firstOrNull()?.user?.username ?: ""
                                    chatName.contains(searchQuery, ignoreCase = true) || 
                                    username.contains(searchQuery, ignoreCase = true)
                                }
                                is ChatListItem.ChamaChat -> {
                                    item.chama.name.contains(searchQuery, ignoreCase = true) ||
                                    item.chama.description?.contains(searchQuery, ignoreCase = true) == true
                                }
                            }
                        }
                    }

                    if (filteredChats.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    when (selectedTab) {
                                        ChatTab.ALL -> "No chats found"
                                        ChatTab.DIRECT -> "No direct chats found"
                                        ChatTab.GROUP -> "No groups found"
                                        ChatTab.CHAMA -> "No chama groups found"
                                        ChatTab.UNREAD -> "No unread chats"
                                        ChatTab.ARCHIVED -> "No archived chats"
                                        ChatTab.FAVORITES -> "No favorite chats"
                                    },
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            items(filteredChats, key = { 
                                when (it) {
                                    is ChatListItem.RegularChat -> "chat_${it.chat.id}"
                                    is ChatListItem.ChamaChat -> "chama_${it.chama.id}"
                                }
                            }) { item ->
                                when (item) {
                                    is ChatListItem.RegularChat -> {
                                        ChatItem(
                                            chat = item.chat,
                                            hasActiveStory = item.chat.participants.any { p ->
                                                p.user?.id in storyCreatorIds
                                            }
                                        ) {
                                            navigator.push(ChatRoomScreen(
                                                item.chat.id, 
                                                item.chat.name ?: item.chat.participants.firstOrNull()?.user?.displayName ?: "Chat"
                                            ))
                                        }
                                    }
                                    is ChatListItem.ChamaChat -> {
                                        ChamaGroupItem(chama = item.chama) {
                                            navigator.push(com.runinga.feature.chama.presentation.dashboard.ChamaDashboardScreen(item.chama.id))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

enum class ChatTab(val title: String) {
    ALL("All"),
    DIRECT("Direct"),
    GROUP("Groups"),
    CHAMA("Chama"),
    UNREAD("Unread"),
    ARCHIVED("Archived"),
    FAVORITES("Favorites")
}

sealed class ChatListItem {
    data class RegularChat(val chat: Chat) : ChatListItem()
    data class ChamaChat(val chama: com.runinga.feature.chama.data.remote.dto.ChamaDto) : ChatListItem()
}

@Composable
fun ChatItem(chat: Chat, hasActiveStory: Boolean = false, onClick: () -> Unit) {
    val storyRingColor = Color(0xFFFFCC00) // Yellow ring for active stories
    val avatarUrl = chat.avatarUrl ?: chat.participants.firstOrNull()?.user?.avatarUrl
    val displayName = chat.name ?: chat.participants.firstOrNull()?.user?.displayName ?: "Unknown"
    val username = chat.participants.firstOrNull()?.user?.username ?: ""
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar with optional yellow story ring
        Box(
            modifier = Modifier
                .size(52.dp)
                .then(
                    if (hasActiveStory) {
                        Modifier.border(2.5.dp, storyRingColor, CircleShape)
                    } else {
                        Modifier
                    }
                ),
            contentAlignment = Alignment.Center
        ) {
            Surface(
                modifier = Modifier
                    .size(if (hasActiveStory) 46.dp else 52.dp)
                    .clip(CircleShape),
                color = if (chat.type == ChatType.GROUP)
                    MaterialTheme.colorScheme.secondaryContainer
                else
                    MaterialTheme.colorScheme.surfaceVariant
            ) {
                if (chat.type == ChatType.GROUP) {
                    Box(contentAlignment = Alignment.Center) {
                        Text("👥", fontSize = 24.sp)
                    }
                } else if (avatarUrl != null) {
                    AsyncImage(
                        model = avatarUrl,
                        contentDescription = "$displayName avatar",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = displayName.take(1).uppercase(),
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = displayName,
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
            
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                if (chat.type == ChatType.GROUP) {
                    Text(
                        "👥",
                        fontSize = 12.sp
                    )
                }
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
}

@Composable
fun ChamaGroupItem(chama: com.runinga.feature.chama.data.remote.dto.ChamaDto, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            modifier = Modifier.size(52.dp).clip(CircleShape),
            color = MaterialTheme.colorScheme.tertiaryContainer
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text("🏦", fontSize = 24.sp)
            }
        }
        
        Spacer(modifier = Modifier.width(16.dp))
        
        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = chama.name,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f)
                )
                
                Text(
                    text = "${chama.members.size} members",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Text(
                    "🏦",
                    fontSize = 12.sp
                )
                Text(
                    text = chama.description ?: "Chama group",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
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

@Composable
fun ChatFloatingActionMenu(
    expanded: Boolean,
    onExpandChange: (Boolean) -> Unit,
    onNewDirectChat: () -> Unit,
    onNewGroup: () -> Unit,
    onNewChama: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.End,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        AnimatedVisibility(
            visible = expanded,
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ChatMenuOption(
                    icon = "🏦",
                    label = "New Chama",
                    onClick = onNewChama
                )
                
                ChatMenuOption(
                    icon = "👥",
                    label = "New Group",
                    onClick = onNewGroup
                )
                
                ChatMenuOption(
                    icon = "💬",
                    label = "New Chat",
                    onClick = onNewDirectChat
                )
            }
        }
        
        FloatingActionButton(
            onClick = { onExpandChange(!expanded) },
            containerColor = androidx.compose.ui.graphics.Color(0xFFFFCC00)
        ) {
            Icon(
                imageVector = if (expanded) Icons.Default.Close else Icons.Default.Add,
                contentDescription = if (expanded) "Close menu" else "Open menu",
                tint = androidx.compose.ui.graphics.Color.Black
            )
        }
    }
}

@Composable
fun ChatMenuOption(
    icon: String,
    label: String,
    onClick: () -> Unit
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Surface(
            shape = RoundedCornerShape(8.dp),
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 4.dp
        ) {
            Text(
                text = label,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Medium
            )
        }
        
        FloatingActionButton(
            onClick = onClick,
            modifier = Modifier.size(48.dp),
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        ) {
            Text(icon, fontSize = 20.sp)
        }
    }
}
