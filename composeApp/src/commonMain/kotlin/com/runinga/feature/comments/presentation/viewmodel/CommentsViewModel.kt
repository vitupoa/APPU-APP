package com.runinga.feature.comments.presentation.viewmodel

import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.runinga.com.core.network.NetworkResult
import com.runinga.com.core.util.currentTimeMillis
import com.runinga.feature.comments.domain.model.Comment
import com.runinga.feature.comments.domain.model.CommentSettings
import com.runinga.feature.comments.domain.model.CommentSortType
import com.runinga.feature.comments.domain.model.ContentType
import com.runinga.feature.comments.domain.repository.CommentsRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import com.runinga.com.core.util.currentTimeMillis

data class CommentsState(
    val comments: List<Comment> = emptyList(),
    val settings: CommentSettings? = null,
    val isLoading: Boolean = false,
    val isLoadingMore: Boolean = false,
    val error: String? = null,
    val nextCursor: String? = null,
    val sortType: CommentSortType = CommentSortType.LATEST,
    val replyingTo: Comment? = null,
    val editingComment: Comment? = null,
    val commentText: String = "",
    val expandedComments: Set<String> = emptySet(),
    val highlightedComments: Set<String> = emptySet()
)

class CommentsViewModel(
    private val repository: CommentsRepository,
    private val contentType: ContentType,
    private val contentId: String,
    private val currentUserId: String
) : ScreenModel {

    private val _state = MutableStateFlow(CommentsState())
    val state: StateFlow<CommentsState> = _state

    private val repliesCache = mutableMapOf<String, Pair<List<Comment>, String?>>()

    init {
        loadComments()
        loadSettings()
    }

    fun loadComments(refresh: Boolean = false) {
        if (refresh) {
            _state.update { it.copy(comments = emptyList(), nextCursor = null) }
            repliesCache.clear()
        }

        screenModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }

            when (val result = repository.getComments(
                contentType = contentType,
                contentId = contentId,
                sortBy = _state.value.sortType,
                cursor = null,
                limit = 20
            )) {
                is NetworkResult.Success -> {
                    val (comments, nextCursor) = result.data
                    val builtTree = buildCommentTree(comments)
                    // Auto-expand all comments that have replies
                    val autoExpandIds = comments.filter { it.repliesCount > 0 }.map { it.id }.toSet()
                    _state.update {
                        it.copy(
                            comments = builtTree,
                            nextCursor = nextCursor,
                            isLoading = false,
                            expandedComments = it.expandedComments + autoExpandIds
                        )
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(error = result.message, isLoading = false) }
                }
            }
        }
    }

    fun loadMoreComments() {
        val cursor = _state.value.nextCursor ?: return
        if (_state.value.isLoadingMore) return

        screenModelScope.launch {
            _state.update { it.copy(isLoadingMore = true) }

            when (val result = repository.getComments(
                contentType = contentType,
                contentId = contentId,
                sortBy = _state.value.sortType,
                cursor = cursor,
                limit = 20
            )) {
                is NetworkResult.Success -> {
                    val (newComments, nextCursor) = result.data
                    _state.update {
                        it.copy(
                            comments = it.comments + buildCommentTree(newComments),
                            nextCursor = nextCursor,
                            isLoadingMore = false
                        )
                    }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(isLoadingMore = false) }
                }
            }
        }
    }

    fun loadReplies(commentId: String) {
        if (repliesCache.containsKey(commentId)) {
            val (replies, _) = repliesCache[commentId]!!
            updateCommentReplies(commentId, replies)
            return
        }

        screenModelScope.launch {
            when (val result = repository.getReplies(commentId, null, 10)) {
                is NetworkResult.Success -> {
                    val (replies, nextCursor) = result.data
                    repliesCache[commentId] = replies to nextCursor
                    updateCommentReplies(commentId, replies)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {}
            }
        }
    }

    fun postComment() {
        val text = _state.value.commentText.trim()
        if (text.isEmpty()) return

        val replyingTo = _state.value.replyingTo
        val parentId = replyingTo?.id
        val replyToUserId = replyingTo?.author?.id

        screenModelScope.launch {
            // Optimistic update
            val tempComment = createTempComment(text, parentId, replyToUserId)
            addCommentOptimistically(tempComment)
            _state.update { it.copy(commentText = "", replyingTo = null) }

            when (val result = repository.createComment(
                contentType = contentType,
                contentId = contentId,
                text = text,
                parentId = parentId,
                replyToUserId = replyToUserId
            )) {
                is NetworkResult.Success -> {
                    replaceOptimisticComment(tempComment.id, result.data)
                    // Refresh to get accurate reply counts and structure from backend
                    loadComments(refresh = true)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    removeOptimisticComment(tempComment.id)
                    _state.update { it.copy(error = result.message ?: "Failed to post comment") }
                }
            }
        }
    }

    fun updateComment() {
        val editing = _state.value.editingComment ?: return
        val text = _state.value.commentText.trim()
        if (text.isEmpty()) return

        screenModelScope.launch {
            when (val result = repository.updateComment(editing.id, text)) {
                is NetworkResult.Success -> {
                    updateCommentInList(result.data)
                    _state.update { it.copy(editingComment = null, commentText = "") }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(error = result.message) }
                }
            }
        }
    }

    fun deleteComment(commentId: String) {
        screenModelScope.launch {
            // Optimistic delete
            removeCommentFromList(commentId)

            when (val result = repository.deleteComment(commentId)) {
                is NetworkResult.Success -> {
                    // Already removed
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    loadComments(refresh = true)
                    _state.update { it.copy(error = result.message) }
                }
            }
        }
    }

    fun toggleLike(comment: Comment) {
        screenModelScope.launch {
            // Optimistic update
            val updatedComment = comment.copy(
                isLiked = !comment.isLiked,
                likesCount = if (comment.isLiked) comment.likesCount - 1 else comment.likesCount + 1
            )
            updateCommentInList(updatedComment)

            val result = if (comment.isLiked) {
                repository.unlikeComment(comment.id)
            } else {
                repository.likeComment(comment.id)
            }

            when (result) {
                is NetworkResult.Success -> {
                    updateCommentInList(result.data)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    updateCommentInList(comment)
                }
            }
        }
    }

    fun togglePin(comment: Comment) {
        screenModelScope.launch {
            val result = if (comment.isPinned) {
                repository.unpinComment(comment.id)
            } else {
                repository.pinComment(comment.id)
            }

            when (result) {
                is NetworkResult.Success -> {
                    updateCommentInList(result.data)
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(error = result.message) }
                }
            }
        }
    }

    fun reportComment(commentId: String, reason: String) {
        screenModelScope.launch {
            when (repository.reportComment(commentId, reason)) {
                is NetworkResult.Success -> {
                    // Show success message
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {
                    _state.update { it.copy(error = "Failed to report comment") }
                }
            }
        }
    }

    fun toggleCommentExpanded(commentId: String) {
        _state.update {
            val expanded = it.expandedComments.toMutableSet()
            if (commentId in expanded) {
                expanded.remove(commentId)
            } else {
                expanded.add(commentId)
                loadReplies(commentId)
            }
            it.copy(expandedComments = expanded)
        }
    }

    fun setReplyingTo(comment: Comment?) {
        _state.update { it.copy(replyingTo = comment, editingComment = null, commentText = "") }
    }

    fun setEditingComment(comment: Comment?) {
        _state.update {
            it.copy(
                editingComment = comment,
                replyingTo = null,
                commentText = comment?.text ?: ""
            )
        }
    }

    fun setCommentText(text: String) {
        _state.update { it.copy(commentText = text) }
    }

    fun setSortType(sortType: CommentSortType) {
        _state.update { it.copy(sortType = sortType) }
        loadComments(refresh = true)
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }

    private fun loadSettings() {
        screenModelScope.launch {
            when (val result = repository.getCommentSettings(contentType, contentId)) {
                is NetworkResult.Success -> {
                    _state.update { it.copy(settings = result.data) }
                }
                is NetworkResult.Loading -> {}
                is NetworkResult.Error -> {}
            }
        }
    }

    private fun buildCommentTree(comments: List<Comment>): List<Comment> {
        val commentMap = comments.associateBy { it.id }
        val topLevel = mutableListOf<Comment>()
        val childrenMap = mutableMapOf<String, MutableList<Comment>>()
        
        // Group children by parent ID
        comments.forEach { comment ->
            if (comment.parentId == null) {
                topLevel.add(comment)
            } else {
                childrenMap.getOrPut(comment.parentId) { mutableListOf() }.add(comment)
            }
        }
        
        // Recursively build tree
        fun attachChildren(comment: Comment): Comment {
            val children = childrenMap[comment.id]?.map { attachChildren(it) } ?: emptyList()
            return comment.copy(replies = children)
        }
        
        return topLevel.map { attachChildren(it) }.sortedByDescending { it.isPinned }
    }

    private fun createTempComment(text: String, parentId: String?, replyToUserId: String?): Comment {
        val replyingToComment = _state.value.replyingTo
        return Comment(
            id = "temp_${kotlinx.datetime.Clock.System.now().toEpochMilliseconds()}",
            contentId = contentId,
            contentType = contentType,
            author = com.runinga.feature.comments.domain.model.CommentAuthor(
                id = currentUserId,
                username = "You",
                displayName = "You",
                avatarUrl = null,
                isVerified = false,
                isContentOwner = false
            ),
            text = text,
            parentId = parentId,
            replyToUser = replyingToComment?.author,
            likesCount = 0,
            repliesCount = 0,
            isLiked = false,
            isPinned = false,
            isEdited = false,
            canDelete = true,
            canEdit = true,
            canPin = false,
            canReply = true,
            createdAt = kotlinx.datetime.Clock.System.now(),
            editedAt = null
        )
    }

    private fun addCommentOptimistically(comment: Comment) {
        _state.update {
            if (comment.parentId == null) {
                it.copy(comments = listOf(comment) + it.comments)
            } else {
                // Ensure parent comment is expanded when adding a reply
                val expandedSet = it.expandedComments.toMutableSet()
                expandedSet.add(comment.parentId)
                it.copy(
                    comments = addReplyToComment(it.comments, comment.parentId, comment),
                    expandedComments = expandedSet
                )
            }
        }
    }

    private fun replaceOptimisticComment(tempId: String, realComment: Comment) {
        _state.update {
            it.copy(comments = replaceCommentInTree(it.comments, tempId, realComment))
        }
    }

    private fun removeOptimisticComment(tempId: String) {
        _state.update {
            it.copy(comments = removeCommentFromTree(it.comments, tempId))
        }
    }

    private fun updateCommentInList(comment: Comment) {
        _state.update {
            it.copy(comments = updateCommentInTree(it.comments, comment))
        }
    }

    private fun removeCommentFromList(commentId: String) {
        _state.update {
            it.copy(comments = removeCommentFromTree(it.comments, commentId))
        }
    }

    private fun updateCommentReplies(commentId: String, replies: List<Comment>) {
        _state.update {
            it.copy(comments = setCommentReplies(it.comments, commentId, replies))
        }
    }

    private fun addReplyToComment(comments: List<Comment>, parentId: String, reply: Comment): List<Comment> {
        return comments.map { comment ->
            if (comment.id == parentId) {
                comment.copy(
                    replies = listOf(reply) + comment.replies,
                    repliesCount = comment.repliesCount + 1
                )
            } else if (comment.replies.isNotEmpty()) {
                comment.copy(replies = addReplyToComment(comment.replies, parentId, reply))
            } else {
                comment
            }
        }
    }

    private fun replaceCommentInTree(comments: List<Comment>, oldId: String, newComment: Comment): List<Comment> {
        return comments.map { comment ->
            if (comment.id == oldId) {
                newComment
            } else if (comment.replies.isNotEmpty()) {
                comment.copy(replies = replaceCommentInTree(comment.replies, oldId, newComment))
            } else {
                comment
            }
        }
    }

    private fun removeCommentFromTree(comments: List<Comment>, commentId: String): List<Comment> {
        return comments.filter { it.id != commentId }.map { comment ->
            if (comment.replies.isNotEmpty()) {
                comment.copy(replies = removeCommentFromTree(comment.replies, commentId))
            } else {
                comment
            }
        }
    }

    private fun updateCommentInTree(comments: List<Comment>, updatedComment: Comment): List<Comment> {
        return comments.map { comment ->
            if (comment.id == updatedComment.id) {
                updatedComment
            } else if (comment.replies.isNotEmpty()) {
                comment.copy(replies = updateCommentInTree(comment.replies, updatedComment))
            } else {
                comment
            }
        }
    }

    private fun setCommentReplies(comments: List<Comment>, commentId: String, replies: List<Comment>): List<Comment> {
        return comments.map { comment ->
            if (comment.id == commentId) {
                comment.copy(replies = replies, isExpanded = true)
            } else if (comment.replies.isNotEmpty()) {
                comment.copy(replies = setCommentReplies(comment.replies, commentId, replies))
            } else {
                comment
            }
        }
    }
}
