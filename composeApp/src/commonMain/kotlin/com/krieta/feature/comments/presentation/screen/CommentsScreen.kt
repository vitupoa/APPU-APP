package com.krieta.feature.comments.presentation.screen

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.com.core.theme.KrietaColors
import com.krieta.com.core.util.DateTimeUtil
import com.krieta.feature.comments.domain.model.Comment
import com.krieta.feature.comments.domain.model.CommentSortType
import com.krieta.feature.comments.domain.model.ContentType
import com.krieta.feature.comments.presentation.viewmodel.CommentsViewModel
import com.krieta.feature.profile.presentation.screen.ProfileScreen
import kotlinx.coroutines.launch
import org.koin.core.parameter.parametersOf

data class CommentsScreen(
    val contentType: ContentType,
    val contentId: String,
    val currentUserId: String,
    val onVideoStateChange: ((Boolean) -> Unit)? = null // Callback to pause/resume video
) : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val viewModel = koinScreenModel<CommentsViewModel> {
            parametersOf(contentType, contentId, currentUserId)
        }
        val state by viewModel.state.collectAsState()
        val navigator = LocalNavigator.currentOrThrow
        val listState = rememberLazyListState()
        val scope = rememberCoroutineScope()

        var showSortMenu by remember { mutableStateOf(false) }
        var showReportDialog by remember { mutableStateOf<Comment?>(null) }

        // Pause video when screen opens
        DisposableEffect(Unit) {
            onVideoStateChange?.invoke(false) // Pause video
            onDispose {
                onVideoStateChange?.invoke(true) // Resume video when closing
            }
        }

        Scaffold(
            modifier = Modifier.imePadding(),
            topBar = {
                TopAppBar(
                    title = {
                        Column {
                            Text("Comments")
                            state.settings?.let {
                                Text(
                                    "${it.totalComments} comments",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.Gray
                                )
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    },
                    actions = {
                        IconButton(onClick = { showSortMenu = true }) {
                            Icon(Icons.AutoMirrored.Filled.Sort, "Sort")
                        }
                        DropdownMenu(
                            expanded = showSortMenu,
                            onDismissRequest = { showSortMenu = false }
                        ) {
                            CommentSortType.values().forEach { sortType ->
                                DropdownMenuItem(
                                    text = { Text(sortType.name.lowercase().replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }) },
                                    onClick = {
                                        viewModel.setSortType(sortType)
                                        showSortMenu = false
                                    },
                                    leadingIcon = {
                                        if (state.sortType == sortType) {
                                            Icon(painterResource(Res.drawable.ic_check), null, tint = KrietaColors.Primary)
                                        }
                                    }
                                )
                            }
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.Black
                    )
                )
            },
            bottomBar = {
                CommentInputBar(
                    text = state.commentText,
                    onTextChange = viewModel::setCommentText,
                    onSend = {
                        if (state.editingComment != null) {
                            viewModel.updateComment()
                        } else {
                            viewModel.postComment()
                        }
                    },
                    replyingTo = state.replyingTo,
                    editingComment = state.editingComment,
                    onCancelReply = { viewModel.setReplyingTo(null) },
                    onCancelEdit = { viewModel.setEditingComment(null) },
                    enabled = state.settings?.commentsEnabled == true
                )
            },
            containerColor = Color.Black
        ) { padding ->
            Box(modifier = Modifier.fillMaxSize().padding(padding)) {
                if (state.isLoading && state.comments.isEmpty()) {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = KrietaColors.Primary
                    )
                } else if (state.comments.isEmpty()) {
                    EmptyCommentsState(
                        modifier = Modifier.align(Alignment.Center),
                        enabled = state.settings?.commentsEnabled == true
                    )
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(vertical = 8.dp)
                    ) {
                        items(
                            items = state.comments,
                            key = { it.id }
                        ) { comment ->
                            CommentItem(
                                comment = comment,
                                onReply = { viewModel.setReplyingTo(it) },
                                onEdit = { viewModel.setEditingComment(it) },
                                onDelete = { viewModel.deleteComment(it.id) },
                                onLike = { viewModel.toggleLike(it) },
                                onPin = { viewModel.togglePin(it) },
                                onReport = { showReportDialog = it },
                                onToggleExpand = { viewModel.toggleCommentExpanded(it.id) },
                                onProfileClick = { navigator.push(ProfileScreen(it.author.id)) },
                                isExpanded = comment.id in state.expandedComments,
                                depth = 0
                            )
                        }

                        if (state.nextCursor != null) {
                            item {
                                Box(
                                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    if (state.isLoadingMore) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(24.dp),
                                            color = KrietaColors.Primary
                                        )
                                    } else {
                                        TextButton(onClick = { viewModel.loadMoreComments() }) {
                                            Text("Load more comments")
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                state.error?.let { error ->
                    Snackbar(
                        modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp),
                        action = {
                            TextButton(onClick = { viewModel.clearError() }) {
                                Text("Dismiss")
                            }
                        }
                    ) {
                        Text(error)
                    }
                }
            }
        }

        showReportDialog?.let { comment ->
            ReportCommentDialog(
                onDismiss = { showReportDialog = null },
                onReport = { reason ->
                    viewModel.reportComment(comment.id, reason)
                    showReportDialog = null
                }
            )
        }
    }
}

@Composable
private fun CommentItem(
    comment: Comment,
    onReply: (Comment) -> Unit,
    onEdit: (Comment) -> Unit,
    onDelete: (Comment) -> Unit,
    onLike: (Comment) -> Unit,
    onPin: (Comment) -> Unit,
    onReport: (Comment) -> Unit,
    onToggleExpand: (Comment) -> Unit,
    onProfileClick: (Comment) -> Unit,
    isExpanded: Boolean,
    depth: Int
) {
    var showMenu by remember { mutableStateOf(false) }
    val backgroundColor = if (comment.isPinned) {
        Color(0xFF1A1A1A)
    } else if (comment.isHighlighted) {
        Color(0xFF2A2A00)
    } else {
        Color.Transparent
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(backgroundColor)
            .padding(start = (depth * 32).dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Avatar
            AsyncImage(
                model = comment.author.avatarUrl,
                contentDescription = null,
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .clickable { onProfileClick(comment) }
                    .background(Color.Gray)
            )

            Column(modifier = Modifier.weight(1f)) {
                // Author info
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = comment.author.displayName,
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    if (comment.author.isVerified) {
                        Icon(
                            Icons.Default.Verified,
                            contentDescription = "Verified",
                            modifier = Modifier.size(16.dp),
                            tint = Color(0xFF1DA1F2)
                        )
                    }
                    if (comment.author.isContentOwner) {
                        Text(
                            "Creator",
                            style = MaterialTheme.typography.labelSmall,
                            color = KrietaColors.Primary,
                            modifier = Modifier
                                .background(KrietaColors.Primary.copy(alpha = 0.2f), RoundedCornerShape(4.dp))
                                .padding(horizontal = 4.dp, vertical = 2.dp)
                        )
                    }
                    if (comment.isPinned) {
                        Icon(
                            Icons.Default.PushPin,
                            contentDescription = "Pinned",
                            modifier = Modifier.size(14.dp),
                            tint = KrietaColors.Primary
                        )
                    }
                    Spacer(Modifier.weight(1f))
                    Text(
                        DateTimeUtil.timeAgo(comment.createdAt),
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }

                // Reply indicator
                comment.replyToUser?.let { replyTo ->
                    Text(
                        "Replying to @${replyTo.username}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF1DA1F2),
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }

                // Comment text
                Text(
                    text = comment.text,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White,
                    modifier = Modifier.padding(vertical = 4.dp)
                )

                if (comment.isEdited) {
                    Text(
                        "(edited)",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }

                // Action buttons
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 8.dp)
                ) {
                    // Like
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.clickable { onLike(comment) }
                    ) {
                        Icon(
                            if (comment.isLiked) painterResource(Res.drawable.ic_favorite) else painterResource(Res.drawable.ic_favorite)Border,
                            contentDescription = "Like",
                            modifier = Modifier.size(18.dp),
                            tint = if (comment.isLiked) Color.Red else Color.Gray
                        )
                        if (comment.likesCount > 0) {
                            Text(
                                "${comment.likesCount}",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray
                            )
                        }
                    }

                    // Reply
                    if (comment.canReply) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            modifier = Modifier.clickable { onReply(comment) }
                        ) {
                            Icon(
                                Icons.AutoMirrored.Filled.Reply,
                                contentDescription = "Reply",
                                modifier = Modifier.size(18.dp),
                                tint = Color.Gray
                            )
                            if (comment.repliesCount > 0) {
                                Text(
                                    "${comment.repliesCount}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = Color.Gray
                                )
                            }
                        }
                    }

                    // More options
                    Box {
                        IconButton(
                            onClick = { showMenu = true },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                painterResource(Res.drawable.ic_more_vert),
                                contentDescription = "More",
                                modifier = Modifier.size(18.dp),
                                tint = Color.Gray
                            )
                        }

                        DropdownMenu(
                            expanded = showMenu,
                            onDismissRequest = { showMenu = false }
                        ) {
                            if (comment.canEdit) {
                                DropdownMenuItem(
                                    text = { Text("Edit") },
                                    onClick = {
                                        onEdit(comment)
                                        showMenu = false
                                    },
                                    leadingIcon = { Icon(painterResource(Res.drawable.ic_edit), null) }
                                )
                            }
                            if (comment.canDelete) {
                                DropdownMenuItem(
                                    text = { Text("Delete") },
                                    onClick = {
                                        onDelete(comment)
                                        showMenu = false
                                    },
                                    leadingIcon = { Icon(painterResource(Res.drawable.ic_delete), null) }
                                )
                            }
                            if (comment.canPin) {
                                DropdownMenuItem(
                                    text = { Text(if (comment.isPinned) "Unpin" else "Pin") },
                                    onClick = {
                                        onPin(comment)
                                        showMenu = false
                                    },
                                    leadingIcon = { Icon(Icons.Default.PushPin, null) }
                                )
                            }
                            DropdownMenuItem(
                                text = { Text("Report") },
                                onClick = {
                                    onReport(comment)
                                    showMenu = false
                                },
                                leadingIcon = { Icon(Icons.Default.Flag, null) }
                            )
                            DropdownMenuItem(
                                text = { Text("Copy text") },
                                onClick = {
                                    // TODO: Copy to clipboard
                                    showMenu = false
                                },
                                leadingIcon = { Icon(Icons.Default.ContentCopy, null) }
                            )
                        }
                    }
                }

                // Show replies button
                if (comment.repliesCount > 0) {
                    TextButton(
                        onClick = { onToggleExpand(comment) },
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        Icon(
                            if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            if (isExpanded) "Hide replies" else "View ${comment.repliesCount} ${if (comment.repliesCount == 1) "reply" else "replies"}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }

        // Nested replies
        AnimatedVisibility(
            visible = isExpanded && comment.replies.isNotEmpty(),
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            Column {
                comment.replies.forEach { reply ->
                    CommentItem(
                        comment = reply,
                        onReply = onReply,
                        onEdit = onEdit,
                        onDelete = onDelete,
                        onLike = onLike,
                        onPin = onPin,
                        onReport = onReport,
                        onToggleExpand = onToggleExpand,
                        onProfileClick = onProfileClick,
                        isExpanded = false,
                        depth = depth + 1
                    )
                }
            }
        }

        HorizontalDivider(color = Color(0xFF1A1A1A), thickness = 1.dp)
    }
}

@Composable
private fun CommentInputBar(
    text: String,
    onTextChange: (String) -> Unit,
    onSend: () -> Unit,
    replyingTo: Comment?,
    editingComment: Comment?,
    onCancelReply: () -> Unit,
    onCancelEdit: () -> Unit,
    enabled: Boolean
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1A1A1A))
    ) {
        // Reply/Edit indicator
        replyingTo?.let { comment ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF2A2A2A))
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.AutoMirrored.Filled.Reply,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = Color.Gray
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "Replying to ${comment.author.displayName}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
                IconButton(onClick = onCancelReply, modifier = Modifier.size(24.dp)) {
                    Icon(painterResource(Res.drawable.ic_close), "Cancel", tint = Color.Gray)
                }
            }
        }

        editingComment?.let {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF2A2A2A))
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        painterResource(Res.drawable.ic_edit),
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = Color.Gray
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "Editing comment",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
                IconButton(onClick = onCancelEdit, modifier = Modifier.size(24.dp)) {
                    Icon(painterResource(Res.drawable.ic_close), "Cancel", tint = Color.Gray)
                }
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextField(
                value = text,
                onValueChange = onTextChange,
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text(
                        if (!enabled) "Comments are disabled"
                        else if (editingComment != null) "Edit your comment..."
                        else if (replyingTo != null) "Write a reply..."
                        else "Add a comment...",
                        color = Color.Gray
                    )
                },
                enabled = enabled,
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color(0xFF2A2A2A),
                    unfocusedContainerColor = Color(0xFF2A2A2A),
                    disabledContainerColor = Color(0xFF1A1A1A),
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White
                ),
                shape = RoundedCornerShape(24.dp),
                maxLines = 4
            )

            IconButton(
                onClick = onSend,
                enabled = enabled && text.trim().isNotEmpty()
            ) {
                Icon(
                    Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Send",
                    tint = if (text.trim().isNotEmpty()) KrietaColors.Primary else Color.Gray
                )
            }
        }
    }
}

@Composable
private fun EmptyCommentsState(
    modifier: Modifier = Modifier,
    enabled: Boolean
) {
    Column(
        modifier = modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            Icons.Default.ChatBubbleOutline,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = Color.Gray
        )
        Text(
            if (enabled) "No comments yet" else "Comments are disabled",
            style = MaterialTheme.typography.titleMedium,
            color = Color.Gray
        )
        if (enabled) {
            Text(
                "Be the first to comment!",
                style = MaterialTheme.typography.bodyMedium,
                color = Color.Gray
            )
        }
    }
}

@Composable
private fun ReportCommentDialog(
    onDismiss: () -> Unit,
    onReport: (String) -> Unit
) {
    var selectedReason by remember { mutableStateOf("") }
    val reasons = listOf(
        "Spam",
        "Harassment",
        "Hate speech",
        "Violence",
        "Misinformation",
        "Other"
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Report Comment") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Why are you reporting this comment?")
                reasons.forEach { reason ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedReason = reason }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedReason == reason,
                            onClick = { selectedReason = reason }
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(reason)
                    }
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onReport(selectedReason) },
                enabled = selectedReason.isNotEmpty()
            ) {
                Text("Report")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
