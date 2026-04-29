package com.krieta.feature.live.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.request.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import org.koin.compose.koinInject

@Serializable
data class LiveStreamItem(
    val id: String,
    val creatorId: String,
    val creatorUsername: String,
    val creatorAvatar: String?,
    val thumbnailUrl: String,
    val viewerCount: Int,
    val title: String,
    val category: String
)

enum class LiveSortOption(val displayName: String) {
    MOST_VIEWERS("Most Viewers"),
    NEW("New"),
    ADMIRING("Admiring")
}

class LiveDiscoveryScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val httpClient = koinInject<HttpClient>()
        val scope = rememberCoroutineScope()
        
        var liveStreams by remember { mutableStateOf<List<LiveStreamItem>>(emptyList()) }
        var isLoading by remember { mutableStateOf(false) }
        var selectedSort by remember { mutableStateOf(LiveSortOption.MOST_VIEWERS) }
        var selectedCategory by remember { mutableStateOf("All") }
        var showFullScreen by remember { mutableStateOf(false) }
        var currentStreamIndex by remember { mutableStateOf(0) }
        
        val categories = listOf("All", "Gaming", "Music", "Chat", "Sports", "Art", "Cooking", "Tech")
        
        // Fetch live streams
        fun fetchLiveStreams() {
            scope.launch {
                isLoading = true
                try {
                    val response = httpClient.get("https://api.krieta.com/api/v1/explore/live") {
                        parameter("limit", 50)
                    }.body<List<LiveStreamItem>>()
                    
                    // Apply filters and sorting
                    var filtered = response
                    
                    // Filter by category
                    if (selectedCategory != "All") {
                        filtered = filtered.filter { it.category == selectedCategory }
                    }
                    
                    // Sort
                    liveStreams = when (selectedSort) {
                        LiveSortOption.MOST_VIEWERS -> filtered.sortedByDescending { it.viewerCount }
                        LiveSortOption.NEW -> filtered // Would need createdAt field from backend
                        LiveSortOption.ADMIRING -> filtered // Would need admirersCount field from backend
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                } finally {
                    isLoading = false
                }
            }
        }
        
        // Auto-refresh viewer counts every 5 seconds
        LaunchedEffect(Unit) {
            fetchLiveStreams()
            while (true) {
                delay(5000)
                fetchLiveStreams()
            }
        }
        
        LaunchedEffect(selectedSort, selectedCategory) {
            fetchLiveStreams()
        }
        
        if (showFullScreen && liveStreams.isNotEmpty()) {
            FullScreenLiveViewer(
                streams = liveStreams,
                currentIndex = currentStreamIndex,
                onIndexChange = { currentStreamIndex = it },
                onClose = { showFullScreen = false }
            )
        } else {
            Scaffold(
                topBar = {
                    TopAppBar(
                        title = { 
                            Text(
                                "🔴 Live Now",
                                fontWeight = FontWeight.Bold
                            ) 
                        },
                        navigationIcon = {
                            IconButton(onClick = { navigator.pop() }) {
                                Icon(
                                    painterResource(Res.drawable.ic_arrow_back),
                                    contentDescription = "Back"
                                )
                            }
                        },
                        actions = {
                            // Sort dropdown
                            var showSortMenu by remember { mutableStateOf(false) }
                            Box {
                                IconButton(onClick = { showSortMenu = true }) {
                                    Icon(
                                        painterResource(Res.drawable.ic_filter_list),
                                        contentDescription = "Sort"
                                    )
                                }
                                DropdownMenu(
                                    expanded = showSortMenu,
                                    onDismissRequest = { showSortMenu = false }
                                ) {
                                    LiveSortOption.values().forEach { option ->
                                        DropdownMenuItem(
                                            text = { Text(option.displayName) },
                                            onClick = {
                                                selectedSort = option
                                                showSortMenu = false
                                            },
                                            leadingIcon = {
                                                if (selectedSort == option) {
                                                    Icon(
                                                        painterResource(Res.drawable.ic_check),
                                                        contentDescription = null,
                                                        tint = KrietaColors.Primary
                                                    )
                                                }
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    )
                }
            ) { padding ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .background(KrietaColors.Background)
                ) {
                    // Category filters
                    androidx.compose.foundation.lazy.LazyRow(
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(categories.size) { index ->
                            val category = categories[index]
                            FilterChip(
                                selected = selectedCategory == category,
                                onClick = { selectedCategory = category },
                                label = { Text(category) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = KrietaColors.Primary,
                                    selectedLabelColor = Color.White
                                )
                            )
                        }
                    }
                    
                    if (isLoading && liveStreams.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator(color = KrietaColors.Primary)
                        }
                    } else if (liveStreams.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("🔴", fontSize = 48.sp)
                                Spacer(Modifier.height(12.dp))
                                Text(
                                    "No live streams right now",
                                    color = KrietaColors.OnSurfaceVariant
                                )
                            }
                        }
                    } else {
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(2),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(liveStreams, key = { it.id }) { stream ->
                                LiveStreamThumbnail(
                                    stream = stream,
                                    onClick = {
                                        currentStreamIndex = liveStreams.indexOf(stream)
                                        showFullScreen = true
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun LiveStreamThumbnail(
    stream: LiveStreamItem,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(9f / 16f),
        shape = RoundedCornerShape(12.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            // Thumbnail
            coil3.compose.AsyncImage(
                model = stream.thumbnailUrl,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop
            )
            
            // Pulsing LIVE badge
            val infiniteTransition = rememberInfiniteTransition()
            val alpha by infiniteTransition.animateFloat(
                initialValue = 0.6f,
                targetValue = 1f,
                animationSpec = infiniteRepeatable(
                    animation = tween(1000, easing = FastOutSlowInEasing),
                    repeatMode = RepeatMode.Reverse
                )
            )
            
            Surface(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(8.dp),
                color = Color.Red.copy(alpha = alpha),
                shape = RoundedCornerShape(4.dp)
            ) {
                Text(
                    "🔴 LIVE",
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    color = Color.White,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            
            // Viewer count
            Surface(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp),
                color = Color.Black.copy(alpha = 0.6f),
                shape = RoundedCornerShape(4.dp)
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Icon(
                        painterResource(Res.drawable.ic_visibility),
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        formatCount(stream.viewerCount.toLong()),
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
            
            // Creator info at bottom
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, Color.Black.copy(alpha = 0.8f))
                        )
                    )
                    .padding(8.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    // Creator avatar
                    coil3.compose.AsyncImage(
                        model = stream.creatorAvatar,
                        contentDescription = null,
                        modifier = Modifier
                            .size(24.dp)
                            .clip(CircleShape),
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop
                    )
                    
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            stream.title,
                            color = Color.White,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            "@${stream.creatorUsername}",
                            color = Color.White.copy(alpha = 0.8f),
                            fontSize = 10.sp,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FullScreenLiveViewer(
    streams: List<LiveStreamItem>,
    currentIndex: Int,
    onIndexChange: (Int) -> Unit,
    onClose: () -> Unit
) {
    val navigator = LocalNavigator.currentOrThrow
    var dragOffset by remember { mutableStateOf(0f) }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(Unit) {
                detectVerticalDragGestures(
                    onDragEnd = {
                        if (dragOffset < -100 && currentIndex < streams.size - 1) {
                            onIndexChange(currentIndex + 1)
                        } else if (dragOffset > 100 && currentIndex > 0) {
                            onIndexChange(currentIndex - 1)
                        }
                        dragOffset = 0f
                    },
                    onVerticalDrag = { _, dragAmount ->
                        dragOffset += dragAmount
                    }
                )
            }
    ) {
        // Current stream
        val currentStream = streams[currentIndex]
        
        // Video player placeholder (would be actual video player)
        Box(modifier = Modifier.fillMaxSize()) {
            coil3.compose.AsyncImage(
                model = currentStream.thumbnailUrl,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop
            )
            
            // Top bar with close button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.TopStart)
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Black.copy(alpha = 0.6f), Color.Transparent)
                        )
                    )
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    coil3.compose.AsyncImage(
                        model = currentStream.creatorAvatar,
                        contentDescription = null,
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .clickable {
                                navigator.push(com.krieta.feature.profile.presentation.screen.ProfileScreen(currentStream.creatorId))
                            },
                        contentScale = androidx.compose.ui.layout.ContentScale.Crop
                    )
                    
                    Column {
                        Text(
                            "@${currentStream.creatorUsername}",
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Surface(
                                color = Color.Red,
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    "LIVE",
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text(
                                "${formatCount(currentStream.viewerCount.toLong())} watching",
                                color = Color.White,
                                fontSize = 11.sp
                            )
                        }
                    }
                }
                
                IconButton(onClick = onClose) {
                    Icon(
                        painterResource(Res.drawable.ic_close),
                        contentDescription = "Close",
                        tint = Color.White
                    )
                }
            }
            
            // Bottom info
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Transparent, Color.Black.copy(alpha = 0.6f))
                        )
                    )
                    .padding(16.dp)
            ) {
                Text(
                    currentStream.title,
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    currentStream.category,
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 12.sp
                )
            }
            
            // Swipe indicator
            if (currentIndex < streams.size - 1) {
                Text(
                    "⬆ Swipe up for next",
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 100.dp),
                    color = Color.White.copy(alpha = 0.6f),
                    fontSize = 12.sp
                )
            }
        }
    }
}

private fun formatCount(count: Long): String {
    return when {
        count >= 1_000_000 -> "${count / 1_000_000}M"
        count >= 1_000 -> "${count / 1_000}K"
        else -> count.toString()
    }
}
