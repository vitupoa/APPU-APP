package com.krieta.feature.stories.presentation.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.layout.ContentScale
import coil3.compose.AsyncImage
import com.krieta.feature.stories.domain.model.StoryGroup

@Composable
fun StoriesRow(
    storyGroups: List<StoryGroup>,
    myStories: StoryGroup?,
    onStoryGroupClick: (StoryGroup) -> Unit,
    onAddStoryClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    LazyRow(
        modifier = modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // "My Story" / Add Story Button
        item {
            if (myStories != null && myStories.stories.isNotEmpty()) {
                MyStoryItem(
                    myStories = myStories,
                    onClick = { onStoryGroupClick(myStories) }
                )
            } else {
                AddStoryItem(onClick = onAddStoryClick)
            }
        }

        items(storyGroups, key = { it.creator.id }) { group ->
            StoryAvatarItem(
                group = group,
                onClick = { onStoryGroupClick(group) }
            )
        }
    }
}

@Composable
fun MyStoryItem(
    myStories: StoryGroup,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(64.dp).clickable(onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .border(2.dp, Color(0xFFFFCC00), CircleShape)
                .padding(4.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surfaceVariant)
        ) {
            AsyncImage(
                model = myStories.creator.avatarUrl ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=${myStories.creator.username}",
                contentDescription = "My Avatar",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
            
            // Add story indicator
            Box(
                modifier = Modifier
                    .align(Alignment.BottomEnd)
                    .size(20.dp)
                    .clip(CircleShape)
                    .background(Color(0xFFFFCC00)),
                contentAlignment = Alignment.Center
            ) {
                Text("+", fontSize = 14.sp, color = Color.Black)
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "My Story",
            style = MaterialTheme.typography.labelSmall,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun StoryAvatarItem(
    group: StoryGroup,
    onClick: () -> Unit
) {
    val hasUnseen = group.stories.any { !it.isViewed }
    val borderColor = if (hasUnseen) {
        Brush.sweepGradient(
            colors = listOf(
                MaterialTheme.colorScheme.primary,
                MaterialTheme.colorScheme.tertiary,
                MaterialTheme.colorScheme.primary
            )
        )
    } else {
        SolidColor(Color.LightGray)
    }

    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(64.dp).clickable(onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .border(2.dp, borderColor, CircleShape)
                .padding(4.dp) // Gap between border and image
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.surfaceVariant)
        ) {
            AsyncImage(
                model = group.creator.avatarUrl ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=${group.creator.username}",
                contentDescription = "Avatar",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = group.creator.displayName,
            style = MaterialTheme.typography.labelSmall,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
fun AddStoryItem(onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(64.dp).clickable(onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .border(2.dp, Color.LightGray, CircleShape)
                .padding(4.dp)
                .clip(CircleShape)
                .background(MaterialTheme.colorScheme.primaryContainer),
            contentAlignment = Alignment.Center
        ) {
            Text("+", fontSize = 24.sp, color = MaterialTheme.colorScheme.onPrimaryContainer)
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "Your Story",
            style = MaterialTheme.typography.labelSmall,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}
