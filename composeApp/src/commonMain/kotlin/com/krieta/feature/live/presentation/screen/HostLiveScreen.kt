package com.krieta.feature.live.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow

class HostLiveScreen : Screen {
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        
        // Mock state for Host
        var isLive by remember { mutableStateOf(false) }
        val viewerCount by remember { mutableStateOf(120) }
        val likesCount by remember { mutableStateOf(4500) }
        val giftGoal by remember { mutableStateOf(1500.0) }
        val currentGiftGoal by remember { mutableStateOf(200.0) }

        val mockMessages = listOf(
            "john: Love this!",
            "sarah_xo: So pretty 😍",
            "mike123: What's the contest about?",
            "alex: Sent a Rose 🌹"
        )

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.DarkGray)
                .windowInsetsPadding(WindowInsets(0))
        ) {
            // Camera Placeholder Text
            Text(
                "Live Camera Feed",
                color = Color.White.copy(alpha = 0.5f),
                modifier = Modifier.align(Alignment.Center)
            )

            // Top Overlay: Status and Viewers
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp, start = 16.dp, end = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Live Badge & Viewers
                Row(
                    modifier = Modifier
                        .background(Color.Black.copy(alpha = 0.4f), RoundedCornerShape(20.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (isLive) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(Color.Red, CircleShape)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("LIVE", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                    }
                    Icon(painterResource(Res.drawable.ic_person), contentDescription = "Viewers", tint = Color.White, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(viewerCount.toString(), color = Color.White, fontSize = 12.sp)
                }

                // End Stream Button
                IconButton(onClick = { navigator.pop() }) {
                    Icon(
                        painter = painterResource(Res.drawable.ic_close),
                        contentDescription = "End Live",
                        tint = Color.White,
                        modifier = Modifier
                            .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                            .padding(4.dp)
                    )
                }
            }

            // Gift Goal
            if (isLive) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .padding(top = 60.dp)
                        .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Gift Goal: New Setup",
                            color = Color(0xFFFFD700),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "$currentGiftGoal / $giftGoal Kr",
                            color = Color.White,
                            fontSize = 10.sp
                        )
                    }
                }
            }

            // Bottom Overlay: Chat & Host Tools
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
                    items(mockMessages.reversed()) { msg ->
                        Text(
                            text = msg,
                            color = Color.White,
                            fontSize = 13.sp,
                            modifier = Modifier
                                .padding(vertical = 4.dp)
                                .background(Color.Black.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Host Tools Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Settings/Beauty Filter
                    HostToolButton(painterResource(Res.drawable.ic_face), "Beauty")
                    
                    // Pin Product
                    HostToolButton(painterResource(Res.drawable.ic_shopping_cart), "Shop")
                    
                    // PK Battle / Duet
                    HostToolButton(painterResource(Res.drawable.ic_people), "Battle")

                    // Moderation
                    HostToolButton(painterResource(Res.drawable.ic_warning), "Mod")

                    if (!isLive) {
                        Button(
                            onClick = { isLive = true },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.Red),
                            shape = RoundedCornerShape(24.dp)
                        ) {
                            Text("GO LIVE", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        // Likes Display for Host
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Icon(painterResource(Res.drawable.ic_favorite), "Likes", tint = Color.Red)
                            Text(likesCount.toString(), color = Color.White, fontSize = 10.sp)
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun HostToolButton(icon: androidx.compose.ui.graphics.painter.Painter, label: String) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            IconButton(
                onClick = { /* Open Tool */ },
                modifier = Modifier
                    .background(Color.White.copy(alpha = 0.2f), CircleShape)
                    .size(40.dp)
            ) {
                Icon(painter = icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(label, color = Color.White, fontSize = 10.sp)
        }
    }
}
