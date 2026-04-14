package com.krieta.com.core.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.CurrentScreen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.Navigator
import cafe.adriel.voyager.navigator.currentOrThrow
import cafe.adriel.voyager.navigator.tab.Tab
import cafe.adriel.voyager.navigator.tab.TabOptions
import com.krieta.com.core.theme.KrietaColors
import com.krieta.feature.profile.presentation.screen.ProfileScreen
import com.krieta.feature.shop.presentation.screen.ShopScreen
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// ─── HOME TAB ─────────────────────────────────────────────────────
object HomeTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = rememberVectorPainter(Icons.Default.Home)
            return remember { TabOptions(index = 0u, title = "Home", icon = icon) }
        }

    @Composable
    override fun Content() {
        Navigator(com.krieta.feature.feed.presentation.screen.FeedScreen()) {
            CurrentScreen()
        }
    }
}

// ─── EXPLORE TAB ──────────────────────────────────────────────────
object ExploreTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = rememberVectorPainter(Icons.Default.Search)
            return remember { TabOptions(index = 1u, title = "Explore", icon = icon) }
        }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        Navigator(ExploreScreen()) {
            CurrentScreen()
        }
    }
}

// ─── EXPLORE SCREEN (with real-time search) ───────────────────────
class ExploreScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var query by remember { mutableStateOf("") }
        var results by remember { mutableStateOf<List<SearchResult>>(emptyList()) }
        var isSearching by remember { mutableStateOf(false) }
        val scope = rememberCoroutineScope()

        // Debounced search
        LaunchedEffect(query) {
            if (query.isBlank()) {
                results = emptyList()
                isSearching = false
                return@LaunchedEffect
            }
            isSearching = true
            delay(350) // debounce
            results = performMockSearch(query)
            isSearching = false
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(KrietaColors.Background)
        ) {
            // Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(KrietaColors.BackgroundElevated, KrietaColors.Background)
                        )
                    )
                    .padding(horizontal = 16.dp, vertical = 16.dp)
            ) {
                Text(
                    "Explore",
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold),
                    color = KrietaColors.OnBackground
                )
            }

            // Search Bar
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp)
                    .padding(bottom = 12.dp),
                placeholder = { Text("Search users, products, contests…") },
                leadingIcon = {
                    Icon(Icons.Default.Search, contentDescription = null, tint = KrietaColors.OnSurfaceVariant)
                },
                trailingIcon = {
                    AnimatedVisibility(query.isNotEmpty(), enter = fadeIn(), exit = fadeOut()) {
                        IconButton(onClick = { query = "" }) {
                            Icon(Icons.Default.Close, contentDescription = "Clear", tint = KrietaColors.OnSurfaceVariant)
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = KrietaColors.Primary,
                    unfocusedBorderColor = KrietaColors.Outline,
                    focusedTextColor = KrietaColors.OnBackground,
                    unfocusedTextColor = KrietaColors.OnBackground,
                    cursorColor = KrietaColors.Primary
                )
            )

            // Content: search results OR cards
            if (query.isBlank()) {
                // Default Explore Cards
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    ExploreCard(
                        emoji = "💧",
                        title = "Drips",
                        subtitle = "See what's trending — photos, videos & more",
                        gradient = listOf(KrietaColors.Primary.copy(alpha = 0.8f), KrietaColors.PrimaryDark),
                        onClick = { navigator.push(DripsScreen()) }
                    )
                    ExploreCard(
                        emoji = "🛍️",
                        title = "Shop",
                        subtitle = "Browse products from Krieta creators",
                        gradient = listOf(KrietaColors.Accent.copy(alpha = 0.8f), KrietaColors.AccentDark),
                        onClick = { navigator.push(ShopScreen()) }
                    )
                }
            } else if (isSearching) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = KrietaColors.Primary)
                }
            } else if (results.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🔍", fontSize = 48.sp)
                        Spacer(Modifier.height(12.dp))
                        Text("No results for \"$query\"", color = KrietaColors.OnSurfaceVariant)
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(results, key = { it.id }) { result ->
                        SearchResultRow(result = result, onClick = {
                            when (result.type) {
                                SearchResultType.USER -> navigator.push(ProfileScreen(result.id))
                                SearchResultType.PRODUCT -> navigator.push(ShopScreen())
                                SearchResultType.CONTEST -> navigator.push(com.krieta.feature.contests.presentation.screen.ContestFeedScreen())
                                SearchResultType.SHORT -> navigator.push(com.krieta.feature.shorts.presentation.screen.ShortsScreen())
                            }
                        })
                    }
                }
            }
        }
    }
}

// ─── EXPLORE CARD ─────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ExploreCard(
    emoji: String,
    title: String,
    subtitle: String,
    gradient: List<androidx.compose.ui.graphics.Color>,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(130.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.horizontalGradient(gradient))
                .padding(20.dp)
        ) {
            Column(verticalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxSize()) {
                Text(emoji, fontSize = 32.sp)
                Column {
                    Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, color = androidx.compose.ui.graphics.Color.White)
                    Text(subtitle, fontSize = 12.sp, color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.8f))
                }
            }
        }
    }
}

// ─── SEARCH RESULT ROW ────────────────────────────────────────────
@Composable
private fun SearchResultRow(result: SearchResult, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        color = KrietaColors.SurfaceVariant,
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Type avatar / icon
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(result.type.color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(result.type.emoji, fontSize = 20.sp)
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    result.title,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.sp,
                    color = KrietaColors.OnSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    result.subtitle,
                    fontSize = 12.sp,
                    color = KrietaColors.OnSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Icon(
                Icons.Default.ChevronRight,
                contentDescription = null,
                tint = KrietaColors.OnSurfaceVariant,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

// ─── SEARCH TYPES ─────────────────────────────────────────────────
enum class SearchResultType(
    val emoji: String,
    val color: androidx.compose.ui.graphics.Color
) {
    USER("👤", KrietaColors.Primary),
    PRODUCT("🛍️", KrietaColors.Accent),
    CONTEST("🏆", KrietaColors.Warning),
    SHORT("🎬", KrietaColors.Info)
}

data class SearchResult(
    val id: String,
    val type: SearchResultType,
    val title: String,
    val subtitle: String
)

// ─── MOCK SEARCH (replace with API calls) ─────────────────────────
private fun performMockSearch(query: String): List<SearchResult> {
    val q = query.lowercase()
    val mockUsers = listOf(
        SearchResult("u1", SearchResultType.USER, "@krieta_creator", "Krieta Creator • 1.3K admirers"),
        SearchResult("u2", SearchResultType.USER, "@test_warrior", "Test Warrior • 432 admiring"),
        SearchResult("u3", SearchResultType.USER, "@the_explorer", "The Explorer • 800 followers"),
    )
    val mockProducts = listOf(
        SearchResult("p1", SearchResultType.PRODUCT, "Krieta T-Shirt", "Shop • 45 Kr"),
        SearchResult("p2", SearchResultType.PRODUCT, "Creator Pack", "Shop • 120 Kr"),
    )
    val mockContests = listOf(
        SearchResult("c1", SearchResultType.CONTEST, "Photography Challenge", "Contests • Ends in 3 days"),
        SearchResult("c2", SearchResultType.CONTEST, "Best Short Film", "Contests • 50 entries"),
    )
    val mockShorts = listOf(
        SearchResult("s1", SearchResultType.SHORT, "Epic Sunset Drip", "Drips • 4.2K views"),
        SearchResult("s2", SearchResultType.SHORT, "Street Photography", "Drips • 1.8K views"),
    )
    return (mockUsers + mockProducts + mockContests + mockShorts).filter {
        it.title.lowercase().contains(q) || it.subtitle.lowercase().contains(q)
    }
}

// ─── DRIPS SCREEN ─────────────────────────────────────────────────
class DripsScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Drips", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = KrietaColors.BackgroundElevated)
                )
            },
            containerColor = KrietaColors.Background
        ) { padding ->
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("💧", fontSize = 64.sp)
                    Spacer(Modifier.height(16.dp))
                    Text(
                        "Drips is coming soon!",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = KrietaColors.OnBackground
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "A feed for photos, videos & more from creators you follow.",
                        color = KrietaColors.OnSurfaceVariant,
                        fontSize = 14.sp
                    )
                }
            }
        }
    }
}

// ─── CONTESTS TAB ─────────────────────────────────────────────────
object ContestsTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = rememberVectorPainter(Icons.Default.EmojiEvents)
            return remember { TabOptions(index = 2u, title = "Contests", icon = icon) }
        }

    @Composable
    override fun Content() {
        Navigator(com.krieta.feature.contests.presentation.screen.ContestFeedScreen()) {
            CurrentScreen()
        }
    }
}

// ─── PROFILE TAB ──────────────────────────────────────────────────
object ProfileTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = rememberVectorPainter(Icons.Default.Person)
            return remember { TabOptions(index = 4u, title = "Profile", icon = icon) }
        }

    @Composable
    override fun Content() {
        // ✅ Nested Navigator — each tab has its own navigation stack
        // This is the correct Voyager pattern: ensures LocalNavigator is properly
        // available within ProfileScreen and all screens it pushes (Wallet, Milestones, etc.)
        Navigator(ProfileScreen()) {
            CurrentScreen()
        }
    }
}

