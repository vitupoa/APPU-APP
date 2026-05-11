package com.krieta.feature.chat.presentation.room
import androidx.compose.foundation.combinedClickable
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.rememberCoroutineScope
import kotlinx.coroutines.launch


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.clickable

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
import com.krieta.feature.chat.presentation.media.MediaPickerBottomSheet
import com.krieta.feature.chat.presentation.media.MediaPreviewDialog
import com.krieta.feature.chat.presentation.media.rememberImagePicker
import com.krieta.feature.chat.presentation.media.rememberVideoPicker
import com.krieta.feature.chat.presentation.media.rememberDocumentPicker
import org.koin.core.parameter.parametersOf

class ChatRoomScreen(private val chatId: String, private val chatTitle: String) : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ChatRoomViewModel> { parametersOf(chatId) }
        val state by viewModel.state.collectAsState()
        
        var messageText by remember { mutableStateOf("") }
        var showMediaPicker by remember { mutableStateOf(false) }
        val listState = rememberLazyListState()
        val coroutineScope = rememberCoroutineScope()
        
        val imagePicker = rememberImagePicker { mediaFile ->
            viewModel.onMediaSelected(
                uri = mediaFile.uri,
                type = "image",
                fileName = mediaFile.fileName,
                fileSize = mediaFile.fileSize,
                bytes = mediaFile.bytes
            )
        }
        
        val videoPicker = rememberVideoPicker { mediaFile ->
            viewModel.onMediaSelected(
                uri = mediaFile.uri,
                type = "video",
                fileName = mediaFile.fileName,
                fileSize = mediaFile.fileSize,
                bytes = mediaFile.bytes
            )
        }
        
        val documentPicker = rememberDocumentPicker { mediaFile ->
            viewModel.onMediaSelected(
                uri = mediaFile.uri,
                type = "document",
                fileName = mediaFile.fileName,
                fileSize = mediaFile.fileSize,
                bytes = mediaFile.bytes
            )
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Column {
                            Text(chatTitle, fontWeight = FontWeight.Bold)
                            if (state.typingUsers.isNotEmpty()) {
                                Text(
                                    text = when (state.typingUsers.size) {
                                        1 -> "${state.typingUsers[0].displayName} is typing..."
                                        2 -> "${state.typingUsers[0].displayName} and ${state.typingUsers[1].displayName} are typing..."
                                        else -> "${state.typingUsers.size} people are typing..."
                                    },
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                    },
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
                        onTextChange = { 
                            messageText = it
                            viewModel.onTextChanged(it)
                        },
                        onSend = { 
                            viewModel.sendMessage(messageText)
                            messageText = "" 
                        },
                        onAttachClick = { showMediaPicker = true }
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
                    state = listState,
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
                            onForward = { /* Show chat selector dialog */ },
                            onNavigateToReply = { messageId ->
                                // Find message index and scroll to it
                                val index = state.messages.indexOfFirst { it.id == messageId }
                                if (index != -1) {
                                    coroutineScope.launch {
                                        listState.animateScrollToItem(index)
                                    }
                                }
                            }
                        )
                    }
                }
            }
        }
        
        // Media picker bottom sheet
        if (showMediaPicker) {
            MediaPickerBottomSheet(
                onImagePick = imagePicker,
                onVideoPick = videoPicker,
                onDocumentPick = documentPicker,
                onDismiss = { showMediaPicker = false }
            )
        }
        
        // Media preview dialog
        if (state.selectedMedia != null) {
            MediaPreviewDialog(
                mediaUri = state.selectedMedia?.uri,
                mediaType = state.selectedMedia?.type ?: "image",
                fileName = state.selectedMedia?.fileName ?: "file",
                fileSize = state.selectedMedia?.fileSize ?: 0,
                uploadProgress = state.uploadProgress,
                onSend = { viewModel.sendMediaMessage(messageText) },
                onCancel = { viewModel.cancelMediaSelection() }
            )
        }
    }
}

@Composable
fun ChatBubble(
    message: com.krieta.feature.chat.domain.model.ChatMessage,
    isMine: Boolean,
    onReply: () -> Unit,
    onDelete: () -> Unit,
    onForward: () -> Unit,
    onNavigateToReply: (String) -> Unit
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
            // Nested reply chain (up to 2 levels)
            if (message.replyTo != null) {
                ReplyChain(
                    replyTo = message.replyTo,
                    textColor = textColor,
                    onNavigateToReply = onNavigateToReply
                )
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
                Column {
                    // Media content
                    if (message.mediaUrl != null) {
                        when (message.mediaType) {
                            "image" -> {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(200.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color.Gray.copy(alpha = 0.2f))
                                ) {
                                    // AsyncImage would go here
                                    Icon(
                                        Icons.Default.Image,
                                        contentDescription = "Image",
                                        modifier = Modifier.size(48.dp).align(Alignment.Center),
                                        tint = textColor.copy(alpha = 0.5f)
                                    )
                                }
                                if (message.payload.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                }
                            }
                            "video" -> {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(200.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color.Gray.copy(alpha = 0.2f))
                                ) {
                                    Icon(
                                        Icons.Default.PlayCircle,
                                        contentDescription = "Video",
                                        modifier = Modifier.size(48.dp).align(Alignment.Center),
                                        tint = textColor.copy(alpha = 0.5f)
                                    )
                                }
                                if (message.payload.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                }
                            }
                            "document" -> {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(Color.Gray.copy(alpha = 0.2f))
                                        .padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(
                                        Icons.Default.AttachFile,
                                        contentDescription = "Document",
                                        modifier = Modifier.size(24.dp),
                                        tint = textColor
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Document",
                                        color = textColor,
                                        fontSize = 14.sp
                                    )
                                }
                                if (message.payload.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                }
                            }
                        }
                    }
                    
                    // Text content
                    if (message.payload.isNotEmpty()) {
                        Text(
                            text = message.payload,
                            color = textColor,
                            fontSize = 15.sp
                        )
                        
                        // Link preview if URL detected
                        if (UrlUtils.containsUrl(message.payload)) {
                            val urls = UrlUtils.extractUrls(message.payload)
                            if (urls.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(8.dp))
                                LinkPreview(
                                    url = urls.first(),
                                    textColor = textColor
                                )
                            }
                        }
                    }
                    
                    // Show replies count if any
                    if (message.repliesCount > 0) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "${message.repliesCount} ${if (message.repliesCount == 1) "reply" else "replies"}",
                            fontSize = 11.sp,
                            color = textColor.copy(alpha = 0.6f),
                            fontStyle = androidx.compose.ui.text.font.FontStyle.Italic
                        )
                    }
                }
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
fun ReplyChain(
    replyTo: com.krieta.feature.chat.domain.model.ChatMessage,
    textColor: Color,
    onNavigateToReply: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 4.dp)
    ) {
        // Show parent reply if exists (nested reply)
        if (replyTo.replyTo != null) {
            ReplyPreview(
                message = replyTo.replyTo,
                textColor = textColor,
                isNested = true,
                onNavigateToReply = onNavigateToReply
            )
            Spacer(modifier = Modifier.height(2.dp))
        }
        
        // Show immediate reply
        ReplyPreview(
            message = replyTo,
            textColor = textColor,
            isNested = false,
            onNavigateToReply = onNavigateToReply
        )
    }
}

@Composable
fun ReplyPreview(
    message: com.krieta.feature.chat.domain.model.ChatMessage,
    textColor: Color,
    isNested: Boolean,
    onNavigateToReply: (String) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .background(Color.Black.copy(alpha = if (isNested) 0.05f else 0.1f))
            .clickable { onNavigateToReply(message.id) }
            .padding(8.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .width(3.dp)
                    .height(32.dp)
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = if (isNested) 0.5f else 1f))
            )
            Spacer(modifier = Modifier.width(8.dp))
            
            // Media thumbnail if present
            if (message.mediaUrl != null) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(Color.Gray.copy(alpha = 0.3f))
                ) {
                    when (message.mediaType) {
                        "image" -> {
                            Icon(
                                Icons.Default.Image,
                                contentDescription = "Image",
                                modifier = Modifier.size(20.dp).align(Alignment.Center),
                                tint = textColor.copy(alpha = 0.6f)
                            )
                        }
                        "video" -> {
                            Icon(
                                Icons.Default.PlayCircle,
                                contentDescription = "Video",
                                modifier = Modifier.size(20.dp).align(Alignment.Center),
                                tint = textColor.copy(alpha = 0.6f)
                            )
                        }
                        "document" -> {
                            Icon(
                                Icons.Default.AttachFile,
                                contentDescription = "Document",
                                modifier = Modifier.size(20.dp).align(Alignment.Center),
                                tint = textColor.copy(alpha = 0.6f)
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.width(8.dp))
            }
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = message.sender?.displayName ?: "Unknown",
                    fontSize = if (isNested) 10.sp else 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = textColor.copy(alpha = 0.7f)
                )
                Text(
                    text = if (message.mediaUrl != null && message.payload.isEmpty()) {
                        when (message.mediaType) {
                            "image" -> "📷 Photo"
                            "video" -> "🎥 Video"
                            "document" -> "📎 Document"
                            else -> message.payload
                        }
                    } else message.payload,
                    fontSize = if (isNested) 9.sp else 11.sp,
                    maxLines = 1,
                    color = textColor.copy(alpha = 0.6f)
                )
            }
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = "Navigate to reply",
                modifier = Modifier.size(16.dp),
                tint = textColor.copy(alpha = 0.5f)
            )
        }
    }
}

@Composable
fun ChatInputBar(
    text: String,
    onTextChange: (String) -> Unit,
    onSend: () -> Unit,
    onAttachClick: () -> Unit
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 2.dp
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 8.dp)
                .windowInsetsPadding(WindowInsets.navigationBars),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onAttachClick) {
                Icon(Icons.Default.AttachFile, contentDescription = "Attach")
            }
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
