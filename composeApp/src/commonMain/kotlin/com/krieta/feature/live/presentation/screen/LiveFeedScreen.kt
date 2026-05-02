package com.krieta.feature.live.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


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
import com.krieta.feature.ads.presentation.components.LiveStreamOverlayAd
import com.krieta.feature.live.domain.model.LiveStream
import com.krieta.feature.live.domain.repository.LiveRepository
import org.koin.compose.koinInject
import kotlinx.coroutines.launch

class LiveFeedScreen : Screen {
    @OptIn(ExperimentalFoundationApi::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val liveRepository = koinInject<LiveRepository>()
        val scope = rememberCoroutineScope()
        
        var streams by remember { mutableStateOf<List<LiveStream>>(emptyList()) }
        var isLoading by remember { mutableStateOf(true) }
        var error by remember { mutableStateOf<String?>(null) }
        
        LaunchedEffect(Unit) {
            scope.launch {
                liveRepository.getActiveStreams().fold(
                    onSuccess = { 
                        streams = it
                        isLoading = false
                    },
                    onFailure = { 
                        error = it.message
                        isLoading = false
                    }
                )
            }
        }

        Box(modifier = Modifier.fillMaxSize().background(Color.Black).windowInsetsPadding(WindowInsets(0))) {
            when {
                isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = Color.White
                    )
                }
                error != null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Error loading streams", color = Color.White)
                        Text(error ?: "", color = Color.White.copy(alpha = 0.7f), fontSize = 12.sp)
                    }
                }
                streams.isEmpty() -> {
                    Text(
                        "No live streams right now",
                        color = Color.White,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                else -> {
                    val pagerState = rememberPagerState(pageCount = { streams.size })

                    VerticalPager(
                        state = pagerState,
                        modifier = Modifier.fillMaxSize()
                    ) { page ->
                        val stream = streams[page]
                        val showAd = page > 0 && page % 5 == 0 // Show ad every 5 streams
                        
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

                            Box(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .background(Color.Black.copy(alpha = 0.3f))
                            )

                            Row(
                                modifier = Modifier
                                    .align(Alignment.TopStart)
                                    .padding(top = 16.dp, start = 16.dp),
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

                            Box(
                                modifier = Modifier
                                    .align(Alignment.Center)
                                    .background(Color.Black.copy(alpha = 0.5f), CircleShape)
                                    .padding(16.dp)
                            ) {
                                Text("Tap to enter Live Room", color = Color.White)
                            }
                            
                            // Ad overlay every 5 streams
                            if (showAd) {
                                Box(
                                    modifier = Modifier
                                        .align(Alignment.BottomCenter)
                                        .padding(bottom = 200.dp)
                                ) {
                                    LiveStreamOverlayAd(onAdClick = { /* Track ad click */ })
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
