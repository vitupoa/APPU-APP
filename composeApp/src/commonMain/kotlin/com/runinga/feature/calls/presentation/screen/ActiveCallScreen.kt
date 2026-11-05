package com.runinga.feature.calls.presentation.screen

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape
import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow

class ActiveCallScreen(val callId: String, val isVideo: Boolean = true) : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow

        var isMicMuted by remember { mutableStateOf(false) }
        var isCameraOff by remember { mutableStateOf(!isVideo) }

        // Mock participants (Max 8 for mesh topology)
        val participants = remember {
            List(6) { index -> "Participant ${index + 1}" }
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFF121212))
        ) {
            // Call Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 48.dp, start = 16.dp, end = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Group Call",
                    color = Color.White,
                    fontSize = 18.sp,
                    fontWeight = androidx.compose.ui.text.font.FontWeight.Bold
                )
                Text(
                    text = "12:45", // Timer
                    color = Color.White.copy(alpha = 0.7f),
                    fontSize = 14.sp
                )
            }

            // Participant Grid (Max 8)
            LazyVerticalGrid(
                columns = GridCells.Fixed(if (participants.size > 4) 3 else 2),
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = 90.dp, bottom = 100.dp, start = 8.dp, end = 8.dp),
                contentPadding = PaddingValues(4.dp)
            ) {
                items(participants.size) { index ->
                    Box(
                        modifier = Modifier
                            .aspectRatio(3f / 4f)
                            .padding(4.dp)
                            .background(Color.DarkGray, RoundedCornerShape(12.dp))
                    ) {
                        // Video Placeholder
                        Text(
                            text = participants[index],
                            color = Color.White,
                            modifier = Modifier.align(Alignment.Center)
                        )

                        // Name label
                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomStart)
                                .padding(8.dp)
                                .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = participants[index],
                                color = Color.White,
                                fontSize = 10.sp
                            )
                        }
                    }
                }
            }

            // Call Controls (Bottom Bar)
            Row(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .background(Color.Black.copy(alpha = 0.6f))
                    .padding(vertical = 24.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Mic Toggle
                IconButton(
                    onClick = { isMicMuted = !isMicMuted },
                    modifier = Modifier
                        .background(if (isMicMuted) Color.White else Color.DarkGray, CircleShape)
                        .size(56.dp)
                ) {
                    Icon(painter = if (isMicMuted) painterResource(Res.drawable.ic_mic_off) else painterResource(Res.drawable.ic_mic),
                        contentDescription = "Toggle Mic",
                        tint = if (isMicMuted) Color.Black else Color.White
                    )
                }

                // Video Toggle
                IconButton(
                    onClick = { isCameraOff = !isCameraOff },
                    modifier = Modifier
                        .background(if (isCameraOff) Color.White else Color.DarkGray, CircleShape)
                        .size(56.dp)
                ) {
                    Icon(painter = if (isCameraOff) painterResource(Res.drawable.ic_videocam_off) else painterResource(Res.drawable.ic_videocam),
                        contentDescription = "Toggle Video",
                        tint = if (isCameraOff) Color.Black else Color.White
                    )
                }

                // End Call
                IconButton(
                    onClick = { navigator.pop() },
                    modifier = Modifier
                        .background(Color.Red, CircleShape)
                        .size(64.dp)
                ) {
                    Icon(
                        painter = painterResource(Res.drawable.ic_call_end),
                        contentDescription = "End Call",
                        tint = Color.White,
                        modifier = Modifier.size(32.dp)
                    )
                }
            }
        }
    }
}
