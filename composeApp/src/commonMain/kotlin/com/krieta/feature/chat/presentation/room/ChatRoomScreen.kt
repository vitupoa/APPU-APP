package com.krieta.feature.chat.presentation.room
import androidx.compose.foundation.combinedClickable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import org.koin.core.parameter.parametersOf

class ChatRoomScreen(private val chatId: String, private val chatTitle: String) : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ChatRoomViewModel> { parametersOf(chatId) }
        val state by viewModel.state.collectAsState()
        
        var messageText by remember { mutableStateOf("") }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(chatTitle, fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), contentDescription = "Back")
                        }
                    }
                )
            },
            bottomBar = {
                Column {
                    // Reply bar
                    val replyingToMessage = state.replyingTo
                    if (replyingToMessage != null) {
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceVariant,
                            tonalElevation = 1.dp
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    Icons.Default.Reply,
                                    contentDescription = null,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "Replying to ${replyingToMessage.sender?.displayName ?: "Unknown"}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        text = replyingToMessage.payload,
                                        fontSize = 11.sp,
                                        maxLines = 1,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                    )
                                }
                                IconButton(onClick = { viewModel.setReplyTo(null) }) {
                                    Icon(Icons.Default.Close, contentDescription = "Cancel reply")
                                }
                            }
                        }
                    }
                    
                    ChatInputBar(
                        text = messageText,
                        onTextChange = { messageText = it },
                        onSend = { 
                            viewModel.sendMessage(messageText)
                            messageText = "" 
                        }
                    )
                }
            }
        ) { padding ->
            if (state.isLoading && state.messages.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp),
                    reverseLayout = true,
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    items(state.messages, key = { it.id }) { message ->
                        val isMine = message.senderId == state.currentUserId
                        ChatBubble(
                            message = message,
                            isMine = isMine,
                            onReply = { viewModel.setReplyTo(message) },
                            onDelete = { viewModel.deleteMessage(message.id) },
                            onForward = { /* Show chat selector dialog */ }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ChatBubble(
    message: com.krieta.feature.chat.domain.model.ChatMessage,
    isMine: Boolean,
    onReply: () -> Unit,
    onDelete: () -> Unit,
    onForward: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    
    val backgroundColor = if (isMine) Color(0xFF4CAF50) else MaterialTheme.colorScheme.surfaceVariant
    val textColor = if (isMine) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
    val alignment = if (isMine) Alignment.CenterEnd else Alignment.CenterStart
    val shape = if (isMine) {
        RoundedCornerShape(16.dp, 16.dp, 0.dp, 16.dp)
    } else {
        RoundedCornerShape(16.dp, 16.dp, 16.dp, 0.dp)
    }

    Box(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        contentAlignment = alignment
    ) {
        Column(
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            // Reply indicator
            if (message.replyTo != null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 4.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color.Black.copy(alpha = 0.1f))
                        .padding(8.dp)
                ) {
                    Column {
                        Text(
                            text = message.replyTo.sender?.displayName ?: "Unknown",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = textColor.copy(alpha = 0.7f)
                        )
                        Text(
                            text = message.replyTo.payload,
                            fontSize = 11.sp,
                            maxLines = 2,
                            color = textColor.copy(alpha = 0.6f)
                        )
                    }
                }
            }
            
            // Forwarded indicator
            if (message.forwardedFrom != null) {
                Text(
                    text = "Forwarded from ${message.forwardedFrom.displayName}",
                    fontSize = 11.sp,
                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                    color = textColor.copy(alpha = 0.7f),
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }
            
            Box(
                modifier = Modifier
                    .clip(shape)
                    .background(backgroundColor)
                    .padding(12.dp)
                    .combinedClickable(
                        onClick = {},
                        onLongClick = { showMenu = true }
                    )
            ) {
                Text(text = message.payload, color = textColor, fontSize = 15.sp)
            }
            
            // Context menu
            DropdownMenu(
                expanded = showMenu,
                onDismissRequest = { showMenu = false }
            ) {
                DropdownMenuItem(
                    text = { Text("Reply") },
                    onClick = {
                        onReply()
                        showMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.Reply, contentDescription = null) }
                )
                if (isMine) {
                    DropdownMenuItem(
                        text = { Text("Delete") },
                        onClick = {
                            onDelete()
                            showMenu = false
                        },
                        leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null) }
                    )
                }
                DropdownMenuItem(
                    text = { Text("Forward") },
                    onClick = {
                        onForward()
                        showMenu = false
                    },
                    leadingIcon = { Icon(Icons.Default.Forward, contentDescription = null) }
                )
            }
        }
    }
}

@Composable
fun ChatInputBar(text: String, onTextChange: (String) -> Unit, onSend: () -> Unit) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp)
                .windowInsetsPadding(WindowInsets.navigationBars),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextField(
                value = text,
                onValueChange = onTextChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text("Message...") },
                shape = RoundedCornerShape(24.dp),
                colors = TextFieldDefaults.colors(
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent
                )
            )
            Spacer(modifier = Modifier.width(8.dp))
            IconButton(
                onClick = onSend,
                modifier = Modifier.clip(RoundedCornerShape(50)).background(MaterialTheme.colorScheme.primary)
            ) {
                Icon(painterResource(Res.drawable.ic_send), contentDescription = "Send", tint = MaterialTheme.colorScheme.onPrimary)
            }
        }
    }
}
