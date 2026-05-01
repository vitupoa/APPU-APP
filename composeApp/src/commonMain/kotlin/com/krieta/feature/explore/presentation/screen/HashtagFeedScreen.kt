package com.krieta.feature.explore.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
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
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import org.koin.compose.koinInject

@Serializable
data class HashtagContentResponse(
    val items: List<HashtagContentItem>,
    val nextCursor: String?
)

@Serializable
data class HashtagContentItem(
    val type: String,
    val id: String,
    val videoUrl: String? = null,
    val caption: String? = null,
    val mediaUrls: List<String>? = null,
    val viewsCount: Long? = null,
    val likesCount: Long? = null,
    val commentsCount: Long? = null,
    val creator: HashtagCreator
)

@Serializable
data class HashtagCreator(
    val id: String,
    val username: String,
    val avatarUrl: String?
)

class HashtagFeedScreen(private val hashtag: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val httpClient = koinInject<HttpClient>()
        val scope = rememberCoroutineScope()
        
        var selectedTab by remember { mutableStateOf(0) }
        var shorts by remember { mutableStateOf<List<HashtagContentItem>>(emptyList()) }
        var posts by remember { mutableStateOf<List<HashtagContentItem>>(emptyList()) }
        var isLoading by remember { mutableStateOf(false) }
        
        LaunchedEffect(selectedTab) {
            isLoading = true
            try {
                val contentType = if (selectedTab == 0) "SHORT" else "POST"
                val normalizedTag = hashtag.removePrefix("#")
                val response = httpClient.get("https://api.krieta.com/api/v1/explore/hashtag/$normalizedTag") {
                    parameter("contentType", contentType)
                    parameter("limit", 20)
                }.body<HashtagContentResponse>()
                
                if (selectedTab == 0) {
                    shorts = response.items
                } else {
                    posts = response.items
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                isLoading = false
            }
        }
        
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { 
                        Text(
                            hashtag,
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
                // Ads Manager Card
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .clickable { navigator.push(com.krieta.feature.ads.presentation.screen.KrietaAdsManagerScreen()) },
                    colors = CardDefaults.cardColors(
                        containerColor = KrietaColors.Primary.copy(alpha = 0.1f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Campaign,
                            contentDescription = null,
                            modifier = Modifier.size(40.dp),
                            tint = KrietaColors.Primary
                        )
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "Krieta Ads Manager",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                "Create ads, sponsor content, boost posts",
                                fontSize = 12.sp,
                                color = KrietaColors.OnSurfaceVariant
                            )
                        }
                        Icon(
                            Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = KrietaColors.OnSurfaceVariant
                        )
                    }
                }
                
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = KrietaColors.BackgroundElevated
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Shorts") }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Drips") }
                    )
                }
                
                if (isLoading) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = KrietaColors.Primary)
                    }
                } else {
                    val items = if (selectedTab == 0) shorts else posts
                    
                    if (items.isEmpty()) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "No content with $hashtag yet",
                                color = KrietaColors.OnSurfaceVariant,
                                fontSize = 16.sp
                            )
                        }
                    } else {
                        LazyVerticalGrid(
                            columns = GridCells.Fixed(3),
                            contentPadding = PaddingValues(4.dp),
                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            items(items) { item ->
                                HashtagContentThumbnail(
                                    item = item,
                                    onClick = {
                                        if (item.type == "SHORT") {
                                            navigator.push(com.krieta.feature.shorts.presentation.screen.ShortsScreen())
                                        }
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
private fun HashtagContentThumbnail(
    item: HashtagContentItem,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .aspectRatio(9f / 16f)
            .clip(RoundedCornerShape(8.dp))
            .background(KrietaColors.SurfaceVariant)
            .clickable(onClick = onClick)
    ) {
        val thumbnailUrl = item.videoUrl ?: item.mediaUrls?.firstOrNull()
        
        thumbnailUrl?.let {
            coil3.compose.AsyncImage(
                model = it,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop
            )
        }
        
        // View count overlay
        item.viewsCount?.let { views ->
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(6.dp),
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
                        formatCount(views),
                        color = Color.White,
                        fontSize = 10.sp
                    )
                }
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
