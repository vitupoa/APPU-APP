package com.krieta.feature.live.presentation.screen

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.krieta.feature.live.domain.model.LiveStream

class LiveFeedScreen : Screen {
    @OptIn(ExperimentalFoundationApi::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        
        // Mock data for discovery feed
        val streams = remember {
            listOf(
                LiveStream(
                    id = "live-1", hostId = "host1", title = "Welcome to my Live!",
                    description = "Chilling and chatting.", thumbnailUrl = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
                    type = com.krieta.feature.live.domain.model.LiveStreamType.NORMAL,
                    status = com.krieta.feature.live.domain.model.LiveStreamStatus.LIVE,
                    streamKey = "key1", streamUrl = "url1", playbackUrl = "url1",
                    viewerCount = 1500, peakViewers = 2000, likesCount = 5000,
                    totalTipsKr = 100.0, giftGoalTitle = "New Setup", giftGoalTarget = 5000.0,
                    giftGoalCurrent = 1200.0, isCoHostEnabled = false,
                    host = com.krieta.feature.live.domain.model.LiveHost(
                        id = "host1", username = "alex_live", displayName = "Alex", avatarUrl = "https://i.pravatar.cc/150?u=1", isVerified = true
                    )
                ),
                LiveStream(
                    id = "live-2", hostId = "host2", title = "Contest Face-off!",
                    description = "Who wins?", thumbnailUrl = "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f4b7",
                    type = com.krieta.feature.live.domain.model.LiveStreamType.CONTEST_BATTLE,
                    status = com.krieta.feature.live.domain.model.LiveStreamStatus.LIVE,
                    streamKey = "key2", streamUrl = "url2", playbackUrl = "url2",
                    viewerCount = 3400, peakViewers = 3500, likesCount = 12000,
                    totalTipsKr = 500.0, giftGoalTitle = null, giftGoalTarget = null,
                    giftGoalCurrent = 0.0, isCoHostEnabled = true,
                    host = com.krieta.feature.live.domain.model.LiveHost(
                        id = "host2", username = "sarah_wins", displayName = "Sarah", avatarUrl = "https://i.pravatar.cc/150?u=2", isVerified = true
                    )
                )
            )
        }

        val pagerState = rememberPagerState(pageCount = { streams.size })

        VerticalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize().background(Color.Black)
        ) { page ->
            val stream = streams[page]
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable { navigator.push(ViewerLiveScreen(stream.id)) }
            ) {
                AsyncImage(
                    model = stream.thumbnailUrl,
                    contentDescription = "Thumbnail",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // Overlay
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black.copy(alpha = 0.3f))
                )

                // Top Left: LIVE Badge & Viewer Count
                Row(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .padding(top = 120.dp, start = 16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .background(Color.Red, RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("LIVE", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Box(
                        modifier = Modifier
                            .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                            .padding(horizontal = 6.dp, vertical = 2.dp)
                    ) {
                        Text("👁 ${stream.viewerCount}", color = Color.White, fontSize = 12.sp)
                    }
                }

                // Bottom Left: Host Info
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(bottom = 100.dp, start = 16.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        AsyncImage(
                            model = stream.host?.avatarUrl,
                            contentDescription = "Avatar",
                            modifier = Modifier.size(40.dp).clip(CircleShape)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = stream.host?.displayName ?: "Unknown",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = stream.title,
                        color = Color.White,
                        fontSize = 14.sp,
                        maxLines = 2
                    )
                }

                // Center: Tap to watch indicator
                Box(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                        .padding(16.dp)
                ) {
                    Text("Tap to enter Live Room", color = Color.White)
                }
            }
        }
    }
}
