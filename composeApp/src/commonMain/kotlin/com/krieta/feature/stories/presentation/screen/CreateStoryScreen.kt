package com.krieta.feature.stories.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.com.core.upload.BackgroundUploader
import com.krieta.com.core.upload.UploadType
import com.krieta.feature.stories.domain.model.StoryPrivacy
import com.krieta.com.core.ui.components.HashtagMentionVisualTransformation
import com.krieta.com.core.ui.components.VideoPlayer
import io.github.vinceglb.filekit.compose.rememberFilePickerLauncher
import io.github.vinceglb.filekit.core.PickerMode
import io.github.vinceglb.filekit.core.PickerType

class CreateStoryScreen : Screen {

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow

        var mediaPath by remember { mutableStateOf<String?>(null) }
        var isVideo by remember { mutableStateOf(false) }
        var caption by remember { mutableStateOf("") }
        var selectedPrivacy by remember { mutableStateOf(StoryPrivacy.PUBLIC) }

        val launcher = rememberFilePickerLauncher(
            type = PickerType.ImageAndVideo,
            mode = PickerMode.Single,
            title = "Pick Media for Story"
        ) { file ->
            if (file != null) {
                mediaPath = file.path
                // Rough check based on extension
                isVideo = file.name.endsWith(".mp4", ignoreCase = true) || file.name.endsWith(".mov", ignoreCase = true)
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Create Story", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface
                    )
                )
            },
            bottomBar = {
                BottomAppBar(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant,
                    contentPadding = PaddingValues(horizontal = 16.dp)
                ) {
                    TextField(
                        value = caption,
                        onValueChange = { caption = it },
                        placeholder = { Text("Add a caption... (use # and @)") },
                        modifier = Modifier.weight(1f).padding(end = 8.dp),
                        visualTransformation = HashtagMentionVisualTransformation(
                            baseColor = MaterialTheme.colorScheme.onSurfaceVariant
                        ),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color.Transparent,
                            unfocusedContainerColor = Color.Transparent,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent
                        )
                    )

                    FloatingActionButton(
                        onClick = {
                            mediaPath?.let { path ->
                                BackgroundUploader.enqueueUpload(
                                    type = UploadType.STORY,
                                    filePath = path,
                                    caption = caption,
                                    additionalData = mapOf(
                                        "MEDIA_TYPE" to if (isVideo) "video" else "image",
                                        "PRIVACY" to selectedPrivacy.name,
                                        "EXPIRES_IN_HOURS" to "24"
                                    )
                                )
                                navigator.pop() // Return immediately
                            }
                        },
                        containerColor = MaterialTheme.colorScheme.primary,
                        contentColor = MaterialTheme.colorScheme.onPrimary,
                        elevation = FloatingActionButtonDefaults.elevation(0.dp)
                    ) {
                        Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Post Story")
                    }
                }
            }
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .background(Color.Black)
            ) {
                if (mediaPath != null) {
                    if (isVideo) {
                        VideoPlayer(
                            url = mediaPath!!,
                            isPlaying = true,
                            modifier = Modifier.fillMaxSize()
                        )
                    } else {
                        AsyncImage(
                            model = mediaPath,
                            contentDescription = "Story Preview",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxSize()
                        )
                    }
                } else {
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        IconButton(
                            onClick = { launcher.launch() },
                            modifier = Modifier
                                .size(80.dp)
                                .clip(RoundedCornerShape(20.dp))
                                .background(MaterialTheme.colorScheme.surfaceVariant)
                        ) {
                            Icon(
                                Icons.Default.Image, 
                                contentDescription = "Pick Media",
                                modifier = Modifier.size(40.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Tap to pick a photo or video",
                            color = Color.White,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }
    }
}
