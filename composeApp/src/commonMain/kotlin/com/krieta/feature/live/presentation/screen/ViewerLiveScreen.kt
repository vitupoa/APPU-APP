package com.krieta.feature.live.presentation.screen

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.feature.live.presentation.viewmodel.ViewerLiveViewModel
import org.koin.compose.koinInject
import org.koin.core.parameter.parametersOf

class ViewerLiveScreen(private val streamId: String) : Screen {

    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinInject<ViewerLiveViewModel> { parametersOf(streamId) }
        val state by viewModel.state.collectAsState()

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black)
        ) {
            // Background: Full-screen vertical video (Placeholder for player)
            AsyncImage(
                model = state.stream?.thumbnailUrl ?: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
                contentDescription = "Live Stream Video",
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
                alpha = 0.6f
            )

            // Top Bar Overlay
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 48.dp, start = 16.dp, end = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Host Info with Admire Button
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                        .padding(end = 12.dp)
                ) {
                    Box(modifier = Modifier.size(40.dp)) {
                        AsyncImage(
                            model = state.stream?.host?.avatarUrl ?: "https://i.pravatar.cc/150",
                            contentDescription = "Host Avatar",
                            modifier = Modifier
                                .size(40.dp)
                                .clip(CircleShape)
                        )
                        // Yellow + Button for Admiring closely attached to avatar top right
                        Box(
                            modifier = Modifier
                                .size(14.dp)
                                .align(Alignment.TopEnd)
                                .offset(x = 4.dp, y = (-4).dp)
                                .background(Color(0xFFFFD700), CircleShape)
                                .clickable { /* Trigger Admire */ },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = painterResource(Res.drawable.ic_add),
                                contentDescription = "Admire",
                                tint = Color.Black,
                                modifier = Modifier.size(10.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    Column {
                        Text(
                            text = state.stream?.host?.displayName ?: "Host Name",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Text(
                            text = "${state.viewerCount} Viewers",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 12.sp
                        )
                    }
                }

                // Close Button
                IconButton(onClick = { navigator.pop() }) {
                    Icon(
                        imageVector = painterResource(Res.drawable.ic_close),
                        contentDescription = "Close",
                        tint = Color.White,
                        modifier = Modifier
                            .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                            .padding(4.dp)
                    )
                }
            }

            // Gift Goal Overlay
            if (state.stream?.giftGoalTarget != null) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 100.dp)
                        .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = state.stream?.giftGoalTitle ?: "Gift Goal",
                            color = Color(0xFFFFD700),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "${state.currentGiftGoal} / ${state.stream?.giftGoalTarget} Kr",
                            color = Color.White,
                            fontSize = 10.sp
                        )
                    }
                }
            }

            // Bottom Overlay: Chat & Controls
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 24.dp)
            ) {
                // Scrolling Chat
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth(0.75f)
                        .height(200.dp),
                    reverseLayout = true
                ) {
                    items(state.messages.reversed()) { message ->
                        Row(
                            modifier = Modifier
                                .padding(vertical = 4.dp)
                                .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${message.userId}: ",
                                color = Color.LightGray,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = message.text,
                                color = Color.White,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Input & Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Chat Input Placeholder
                    var chatText by remember { mutableStateOf("") }
                    OutlinedTextField(
                        value = chatText,
                        onValueChange = { chatText = it },
                        placeholder = { Text("Say something...", color = Color.White.copy(alpha = 0.7f)) },
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp),
                        shape = RoundedCornerShape(25.dp),
                        colors = TextFieldDefaults.colors(
                            unfocusedContainerColor = Color.Black.copy(alpha = 0.4f),
                            focusedContainerColor = Color.Black.copy(alpha = 0.6f),
                            unfocusedIndicatorColor = Color.Transparent,
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedTextColor = Color.White,
                            focusedTextColor = Color.White
                        ),
                        trailingIcon = {
                            IconButton(onClick = {
                                if (chatText.isNotBlank()) {
                                    viewModel.sendMessage(chatText)
                                    chatText = ""
                                }
                            }) {
                                Icon(painterResource(Res.drawable.ic_send), "Send", tint = Color.White)
                            }
                        }
                    )

                    Spacer(modifier = Modifier.width(16.dp))

                    // Gift Button
                    IconButton(
                        onClick = { viewModel.sendTip(10.0) },
                        modifier = Modifier
                            .background(Color(0xFFFF1493), CircleShape)
                            .size(48.dp)
                    ) {
                        Text("🎁", fontSize = 24.sp)
                    }

                    Spacer(modifier = Modifier.width(12.dp))

                    // Like Button
                    IconButton(
                        onClick = { viewModel.sendLike() },
                        modifier = Modifier
                            .background(Color.White.copy(alpha = 0.2f), CircleShape)
                            .size(48.dp)
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(painterResource(Res.drawable.ic_favorite), "Like", tint = Color.Red)
                            Text(
                                text = state.likesCount.toString(),
                                color = Color.White,
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            }
        }
    }
}
