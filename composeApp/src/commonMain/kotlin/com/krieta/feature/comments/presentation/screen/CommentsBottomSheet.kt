package com.krieta.feature.comments.presentation.screen

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
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import com.krieta.com.core.theme.KrietaColors
import com.krieta.com.core.util.DateTimeUtil
import com.krieta.feature.comments.domain.model.Comment
import com.krieta.feature.comments.domain.model.CommentSortType
import com.krieta.feature.comments.presentation.viewmodel.CommentsViewModel
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommentsBottomSheet(
    viewModel: CommentsViewModel,
    onDismiss: () -> Unit,
    onProfileClick: (String) -> Unit
) {
    val state by viewModel.state.collectAsState()
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val listState = rememberLazyListState()
    var showSortMenu by remember { mutableStateOf(false) }
    var showReportDialog by remember { mutableStateOf<Comment?>(null) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Color(0xFF1A1A1A),
        dragHandle = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .width(40.dp)
                        .height(4.dp)
                        .background(Color.Gray, RoundedCornerShape(2.dp))
                )
            }
        }
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "Comments",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    state.settings?.let {
                        Text(
                            "${it.totalComments} comments",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray
                        )
                    }
                }
                IconButton(onClick = { showSortMenu = true }) {
                    Icon(
                        painterResource(Res.drawable.ic_sort),
                        "Sort",
                        tint = Color.White
                    )
                }
                DropdownMenu(
                    expanded = showSortMenu,
                    onDismissRequest = { showSortMenu = false }
                ) {
                    CommentSortType.values().forEach { sortType ->
                        DropdownMenuItem(
                            text = { Text(sortType.name.lowercase().replaceFirstChar { it.titlecase() }) },
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
            }

            HorizontalDivider(color = Color(0xFF2A2A2A))

            // Comments List
            Box(modifier = Modifier.weight(1f)) {
                when {
                    state.isLoading && state.comments.isEmpty() -> {
                        CircularProgressIndicator(
                            modifier = Modifier.align(Alignment.Center),
                            color = KrietaColors.Primary
                        )
                    }
                    state.comments.isEmpty() -> {
                        EmptyCommentsMessage(
                            modifier = Modifier.align(Alignment.Center),
                            enabled = state.settings?.commentsEnabled == true
                        )
                    }
                    else -> {
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
                                    onLike = { viewModel.toggleLike(it) },
                                    onDelete = { viewModel.deleteComment(it.id) },
                                    onReport = { showReportDialog = it },
                                    onToggleExpand = { viewModel.toggleCommentExpanded(it.id) },
                                    onProfileClick = onProfileClick,
                                    expandedComments = state.expandedComments,
                                    depth = 0
                                )
                            }

                            if (state.nextCursor != null && !state.isLoadingMore) {
                                item {
                                    TextButton(
                                        onClick = { viewModel.loadMoreComments() },
                                        modifier = Modifier.fillMaxWidth().padding(16.dp)
                                    ) {
                                        Text("Load more comments")
                                    }
                                }
                            }
                        }
                    }
                }
            }

            HorizontalDivider(color = Color(0xFF2A2A2A))

            // Input Bar
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
                onCancelReply = { viewModel.setReplyingTo(null) },
                enabled = state.settings?.commentsEnabled == true
            )
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
    onLike: (Comment) -> Unit,
    onDelete: (Comment) -> Unit,
    onReport: (Comment) -> Unit,
    onToggleExpand: (Comment) -> Unit,
    onProfileClick: (String) -> Unit,
    expandedComments: Set<String>,
    depth: Int
) {
    var showMenu by remember { mutableStateOf(false) }
    val isExpanded = comment.id in expandedComments
    val maxDepth = 3 // Limit visual nesting to 3 levels
    val effectiveDepth = depth.coerceAtMost(maxDepth)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(start = (effectiveDepth * 24).dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            AsyncImage(
                model = comment.author.avatarUrl,
                contentDescription = null,
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .clickable { onProfileClick(comment.author.id) }
                    .background(Color.Gray)
            )

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(
                        text = comment.author.displayName,
                        style = MaterialTheme.typography.bodySmall,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        DateTimeUtil.timeAgo(comment.createdAt),
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                    Spacer(Modifier.weight(1f))
                    
                    Box {
                        IconButton(
                            onClick = { showMenu = true },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                painterResource(Res.drawable.ic_more_vert),
                                contentDescription = "More",
                                modifier = Modifier.size(16.dp),
                                tint = Color.Gray
                            )
                        }

                        DropdownMenu(
                            expanded = showMenu,
                            onDismissRequest = { showMenu = false }
                        ) {
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
                            DropdownMenuItem(
                                text = { Text("Report") },
                                onClick = {
                                    onReport(comment)
                                    showMenu = false
                                },
                                leadingIcon = { Icon(painterResource(Res.drawable.ic_flag), null) }
                            )
                        }
                    }
                }

                comment.replyToUser?.let { replyTo ->
                    Text(
                        "Replying to @${replyTo.username}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF1DA1F2),
                        modifier = Modifier.padding(vertical = 2.dp)
                    )
                }

                Text(
                    text = comment.text,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.9f),
                    modifier = Modifier.padding(vertical = 4.dp)
                )

                if (comment.isEdited) {
                    Text(
                        "(edited)",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }

                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.clickable { onLike(comment) }
                    ) {
                        Icon(
                            if (comment.isLiked) painterResource(Res.drawable.ic_favorite) 
                            else painterResource(Res.drawable.ic_favorite_border),
                            contentDescription = "Like",
                            modifier = Modifier.size(16.dp),
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

                    if (comment.canReply) {
                        TextButton(
                            onClick = { onReply(comment) },
                            contentPadding = PaddingValues(0.dp)
                        ) {
                            Text(
                                "Reply",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray
                            )
                        }
                    }
                }

                if (comment.repliesCount > 0 && comment.replies.isNotEmpty()) {
                    TextButton(
                        onClick = { onToggleExpand(comment) },
                        contentPadding = PaddingValues(0.dp),
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        Icon(
                            if (isExpanded) painterResource(Res.drawable.ic_expand_less) 
                            else painterResource(Res.drawable.ic_expand_more),
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(Modifier.width(4.dp))
                        Text(
                            if (isExpanded) "Hide replies" 
                            else "View ${comment.repliesCount} ${if (comment.repliesCount == 1) "reply" else "replies"}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
        }

        if (isExpanded && comment.replies.isNotEmpty()) {
            Column {
                comment.replies.forEach { reply ->
                    CommentItem(
                        comment = reply,
                        onReply = onReply,
                        onLike = onLike,
                        onDelete = onDelete,
                        onReport = onReport,
                        onToggleExpand = onToggleExpand,
                        onProfileClick = onProfileClick,
                        expandedComments = expandedComments,
                        depth = depth + 1
                    )
                }
            }
        }

        if (depth == 0) {
            HorizontalDivider(color = Color(0xFF2A2A2A), thickness = 0.5.dp)
        }
    }
}

@Composable
private fun CommentInputBar(
    text: String,
    onTextChange: (String) -> Unit,
    onSend: () -> Unit,
    replyingTo: Comment?,
    onCancelReply: () -> Unit,
    enabled: Boolean
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xFF1A1A1A))
            .imePadding()
    ) {
        replyingTo?.let { comment ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF2A2A2A))
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Replying to ${comment.author.displayName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.Gray
                )
                IconButton(onClick = onCancelReply, modifier = Modifier.size(24.dp)) {
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
                    painterResource(Res.drawable.ic_send),
                    contentDescription = "Send",
                    tint = if (text.trim().isNotEmpty()) KrietaColors.Primary else Color.Gray
                )
            }
        }
    }
}

@Composable
private fun EmptyCommentsMessage(
    modifier: Modifier = Modifier,
    enabled: Boolean
) {
    Column(
        modifier = modifier.padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Icon(
            painterResource(Res.drawable.ic_chat_bubble_outline),
            contentDescription = null,
            modifier = Modifier.size(48.dp),
            tint = Color.Gray
        )
        Text(
            if (enabled) "No comments yet" else "Comments are disabled",
            style = MaterialTheme.typography.bodyMedium,
            color = Color.Gray
        )
        if (enabled) {
            Text(
                "Be the first to comment!",
                style = MaterialTheme.typography.bodySmall,
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
