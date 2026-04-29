package com.krieta.feature.stories.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.com.core.ui.components.VideoPlayer
import com.krieta.feature.stories.domain.model.StoryGroup
import kotlinx.coroutines.launch

class StoryViewerScreen(
    private val initialGroupIndex: Int,
    private val storyGroups: List<StoryGroup>,
    private val onStoryViewed: (String) -> Unit
) : Screen {

    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        
        var currentGroupIndex by remember { mutableStateOf(initialGroupIndex) }
        val currentGroup = storyGroups.getOrNull(currentGroupIndex)
        
        if (currentGroup == null) {
            LaunchedEffect(Unit) { navigator.pop() }
            return
        }

        var currentStoryIndex by remember { mutableStateOf(0) }
        val currentStory = currentGroup.stories.getOrNull(currentStoryIndex)
        
        if (currentStory == null) {
            // Reached end of stories in this group
            if (currentGroupIndex < storyGroups.size - 1) {
                currentGroupIndex++
                currentStoryIndex = 0
            } else {
                LaunchedEffect(Unit) { navigator.pop() }
            }
            return
        }

        // Auto-advance logic
        val progress = remember { Animatable(0f) }
        val coroutineScope = rememberCoroutineScope()
        var isPaused by remember { mutableStateOf(false) }

        LaunchedEffect(currentStory, isPaused) {
            if (!isPaused) {
                // Determine duration based on media type. e.g. Image = 5s, Video = length of video
                val duration = if (currentStory.mediaType == "video") 15000 else 5000
                progress.animateTo(
                    targetValue = 1f,
                    animationSpec = tween(durationMillis = ((1f - progress.value) * duration).toInt(), easing = LinearEasing)
                )
                
                // Mark viewed
                onStoryViewed(currentStory.id)
                
                // Advance
                if (currentStoryIndex < currentGroup.stories.size - 1) {
                    currentStoryIndex++
                    progress.snapTo(0f)
                } else {
                    if (currentGroupIndex < storyGroups.size - 1) {
                        currentGroupIndex++
                        currentStoryIndex = 0
                        progress.snapTo(0f)
                    } else {
                        navigator.pop()
                    }
                }
            } else {
                progress.stop()
            }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
                .pointerInput(Unit) {
                    detectTapGestures(
                        onPress = {
                            isPaused = true
                            tryAwaitRelease()
                            isPaused = false
                        },
                        onTap = { offset ->
                            // Tap right to next, tap left to previous
                            if (offset.x > size.width / 2) {
                                // Next
                                coroutineScope.launch {
                                    onStoryViewed(currentStory.id)
                                    progress.snapTo(0f)
                                    if (currentStoryIndex < currentGroup.stories.size - 1) {
                                        currentStoryIndex++
                                    } else {
                                        if (currentGroupIndex < storyGroups.size - 1) {
                                            currentGroupIndex++
                                            currentStoryIndex = 0
                                        } else {
                                            navigator.pop()
                                        }
                                    }
                                }
                            } else {
                                // Previous
                                coroutineScope.launch {
                                    progress.snapTo(0f)
                                    if (currentStoryIndex > 0) {
                                        currentStoryIndex--
                                    } else {
                                        if (currentGroupIndex > 0) {
                                            currentGroupIndex--
                                            currentStoryIndex = storyGroups[currentGroupIndex].stories.size - 1
                                        }
                                    }
                                }
                            }
                        }
                    )
                }
        ) {
            // Media Layer
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                if (currentStory.mediaType == "text") {
                    Box(modifier = Modifier.fillMaxSize().background(Color.DarkGray), contentAlignment = Alignment.Center) {
                        Text(
                            text = currentStory.text ?: "",
                            color = Color.White,
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(32.dp)
                        )
                    }
                } else {
                    Box(modifier = Modifier.fillMaxSize().background(Color.Black)) {
                        if (currentStory.mediaType == "video") {
                            VideoPlayer(
                                url = currentStory.mediaUrl,
                                isPlaying = !isPaused,
                                modifier = Modifier.fillMaxSize()
                            )
                        } else {
                            AsyncImage(
                                model = currentStory.mediaUrl,
                                contentDescription = "Story Media",
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.fillMaxSize()
                            )
                        }
                    }
                }
                
                // Optional text overlay
                if (currentStory.mediaType != "text" && !currentStory.text.isNullOrBlank()) {
                    Text(
                        text = currentStory.text,
                        color = Color.White,
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 64.dp)
                            .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                            .padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }

            // Top Overlay Layer (Progress bars and User info)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .windowInsetsPadding(WindowInsets.statusBars)
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                // Progress Bars
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    for (i in currentGroup.stories.indices) {
                        LinearProgressIndicator(
                            progress = {
                                when {
                                    i < currentStoryIndex -> 1f
                                    i == currentStoryIndex -> progress.value
                                    else -> 0f
                                }
                            },
                            modifier = Modifier
                                .weight(1f)
                                .height(2.dp)
                                .clip(RoundedCornerShape(50)),
                            color = Color.White,
                            trackColor = Color.White.copy(alpha = 0.3f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // User Info
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Box(
                        modifier = Modifier.size(40.dp).clip(CircleShape).background(Color.Gray)
                    ) {
                        AsyncImage(
                            model = currentGroup.creator.avatarUrl ?: "https://api.dicebear.com/7.x/avataaars/svg?seed=${currentGroup.creator.username}",
                            contentDescription = "Avatar",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = currentGroup.creator.displayName,
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.weight(1f))
                    IconButton(onClick = { navigator.pop() }) {
                        Icon(painterResource(Res.drawable.ic_close), contentDescription = "Close", tint = Color.White)
                    }
                }
            }
        }
    }
}
