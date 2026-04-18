# Comments System Integration Guide

## Quick Integration

### 1. Add Comment Button to Shorts

**File**: `ShortsScreen.kt`

```kotlin
// In the action buttons section
Row(
    modifier = Modifier
        .align(Alignment.BottomEnd)
        .padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
) {
    // ... existing buttons ...
    
    // Comment button
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable {
            navigator.push(
                CommentsScreen(
                    contentType = ContentType.SHORT,
                    contentId = short.id,
                    currentUserId = viewModel.getCurrentUserId()
                )
            )
        }
    ) {
        Icon(
            Icons.Default.Comment,
            contentDescription = "Comments",
            modifier = Modifier.size(28.dp),
            tint = Color.White
        )
        if (short.commentsCount > 0) {
            Text(
                formatCount(short.commentsCount),
                style = MaterialTheme.typography.bodySmall,
                color = Color.White
            )
        }
    }
}
```

### 2. Add Comment Button to Drips (Posts)

**File**: `DripsScreen.kt` or `FeedScreen.kt`

```kotlin
// In the post actions row
Row(
    modifier = Modifier
        .fillMaxWidth()
        .padding(horizontal = 16.dp, vertical = 8.dp),
    horizontalArrangement = Arrangement.SpaceBetween
) {
    // Like button
    IconButton(onClick = { viewModel.toggleLike(post) }) {
        Icon(
            if (post.isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
            contentDescription = "Like",
            tint = if (post.isLiked) Color.Red else Color.White
        )
    }
    
    // Comment button
    IconButton(onClick = {
        navigator.push(
            CommentsScreen(
                contentType = ContentType.POST,
                contentId = post.id,
                currentUserId = viewModel.getCurrentUserId()
            )
        )
    }) {
        Badge(
            content = { if (post.commentsCount > 0) Text("${post.commentsCount}") }
        ) {
            Icon(
                Icons.Default.Comment,
                contentDescription = "Comments",
                tint = Color.White
            )
        }
    }
    
    // ... other buttons ...
}
```

### 3. Add Comment Button to Contest Submissions

**File**: `ContestSubmissionFeedScreen.kt`

```kotlin
// In the action buttons section
Column(
    modifier = Modifier
        .align(Alignment.BottomEnd)
        .padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(16.dp)
) {
    // ... existing buttons ...
    
    // Comment button
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable {
            navigator.push(
                CommentsScreen(
                    contentType = ContentType.CONTEST_SUBMISSION,
                    contentId = submission.id,
                    currentUserId = viewModel.getCurrentUserId()
                )
            )
        }
    ) {
        Icon(
            Icons.Default.Comment,
            contentDescription = "Comments",
            modifier = Modifier.size(28.dp),
            tint = Color.White
        )
        if (submission.commentsCount > 0) {
            Text(
                "${submission.commentsCount}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.White
            )
        }
    }
}
```

## Required Imports

Add these imports to your screen files:

```kotlin
import com.krieta.feature.comments.presentation.screen.CommentsScreen
import com.krieta.feature.comments.domain.model.ContentType
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Comment
```

## Update Domain Models

### Add commentsCount to Models

**ShortsModels.kt**:
```kotlin
data class Short(
    // ... existing fields ...
    val commentsCount: Int = 0
)
```

**FeedModels.kt**:
```kotlin
data class Post(
    // ... existing fields ...
    val commentsCount: Int = 0
)
```

**ContestsModels.kt**:
```kotlin
data class ContestSubmission(
    // ... existing fields ...
    val commentsCount: Int = 0
)
```

### Update DTOs

**ShortsDtos.kt**:
```kotlin
@Serializable
data class ShortDto(
    // ... existing fields ...
    val commentsCount: Int = 0
)
```

**FeedDtos.kt**:
```kotlin
@Serializable
data class PostDto(
    // ... existing fields ...
    val commentsCount: Int = 0
)
```

**ContestsDtos.kt**:
```kotlin
@Serializable
data class ContestSubmissionDto(
    // ... existing fields ...
    val commentsCount: Int = 0
)
```

## Helper Function

Add this helper to format large numbers:

```kotlin
fun formatCount(count: Int): String {
    return when {
        count >= 1_000_000 -> "${count / 1_000_000}M"
        count >= 1_000 -> "${count / 1_000}K"
        else -> count.toString()
    }
}
```

## Real-Time Updates

### Listen to WebSocket Events

In your ViewModels, listen for comment count updates:

```kotlin
init {
    viewModelScope.launch {
        webSocketService.commentUpdateFlow.collect { event ->
            val data = Json.decodeFromString<CommentUpdateEvent>(event)
            updateCommentCount(data.contentId, data.newCount)
        }
    }
}
```

### WebSocket Event Structure

```typescript
// Backend emits this when comment is added/deleted
io.to(`content:${contentId}`).emit('comment_update', {
    contentId,
    contentType,
    newCount: totalComments
});
```

## Testing Checklist

- [ ] Comment button appears on all content types
- [ ] Comment count displays correctly
- [ ] Clicking button opens CommentsScreen
- [ ] Comments screen shows correct content
- [ ] Can post new comments
- [ ] Can reply to comments
- [ ] Can like comments
- [ ] Can delete own comments
- [ ] Content owner can delete any comment
- [ ] Real-time count updates work
- [ ] Navigation back works correctly

## Example: Complete Integration

Here's a complete example for Shorts:

```kotlin
// ShortsScreen.kt
@Composable
fun ShortsScreen() {
    val viewModel = getScreenModel<ShortsViewModel>()
    val state by viewModel.state.collectAsState()
    val navigator = LocalNavigator.currentOrThrow

    // ... existing code ...

    // Action buttons
    Column(
        modifier = Modifier
            .align(Alignment.BottomEnd)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Like button
        ActionButton(
            icon = if (short.isLiked) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
            count = short.likesCount,
            tint = if (short.isLiked) Color.Red else Color.White,
            onClick = { viewModel.toggleLike(short) }
        )

        // Comment button
        ActionButton(
            icon = Icons.Default.Comment,
            count = short.commentsCount,
            tint = Color.White,
            onClick = {
                navigator.push(
                    CommentsScreen(
                        contentType = ContentType.SHORT,
                        contentId = short.id,
                        currentUserId = viewModel.getCurrentUserId()
                    )
                )
            }
        )

        // Share button
        ActionButton(
            icon = Icons.Default.Share,
            count = short.sharesCount,
            tint = Color.White,
            onClick = { viewModel.shareShort(short) }
        )
    }
}

@Composable
private fun ActionButton(
    icon: ImageVector,
    count: Int,
    tint: Color,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Icon(
            icon,
            contentDescription = null,
            modifier = Modifier.size(28.dp),
            tint = tint
        )
        if (count > 0) {
            Text(
                formatCount(count),
                style = MaterialTheme.typography.bodySmall,
                color = Color.White
            )
        }
    }
}
```

## Backend Integration

The backend needs to:

1. **Increment comment count** when comment is created
2. **Decrement comment count** when comment is deleted
3. **Return comment count** in all content responses
4. **Emit WebSocket events** for real-time updates

Example backend code:

```typescript
// When creating comment
await prisma.$transaction([
    // Create comment
    prisma.comment.create({ data: commentData }),
    
    // Increment count
    prisma[contentTable].update({
        where: { id: contentId },
        data: { commentsCount: { increment: 1 } }
    })
]);

// Emit WebSocket event
io.to(`content:${contentId}`).emit('comment_update', {
    contentId,
    contentType,
    newCount: await getCommentCount(contentId, contentType)
});
```

## Summary

The comment system is now ready to integrate into:
- ✅ Shorts (video content)
- ✅ Drips/Posts (feed content)
- ✅ Contest Submissions

All you need to do is:
1. Add the comment button to your UI
2. Update your models to include `commentsCount`
3. Implement the backend endpoints
4. Test the integration

The system handles all the complexity of nested comments, permissions, and real-time updates automatically!
