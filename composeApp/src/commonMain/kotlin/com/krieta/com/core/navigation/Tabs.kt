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
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import cafe.adriel.voyager.koin.koinScreenModel
import com.krieta.feature.profile.presentation.viewmodel.SearchViewModel
import com.krieta.feature.profile.presentation.viewmodel.SearchResult
import com.krieta.feature.profile.presentation.viewmodel.SearchResultType
import com.krieta.feature.profile.domain.model.SocialUser
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
        val searchViewModel = koinScreenModel<SearchViewModel>()
        val searchState by searchViewModel.state.collectAsState()
        
        val query = searchState.query
        val results = searchState.results
        val isSearching = searchState.isLoading

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
                onValueChange = { searchViewModel.onQueryChange(it) },
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
                        IconButton(onClick = { searchViewModel.onQueryChange("") }) {
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
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    ExploreCard(
                        emoji = "💧",
                        title = "Drips",
                        subtitle = "See what's trending — photos, videos & more",
                        gradient = listOf(KrietaColors.Primary.copy(alpha = 0.8f), KrietaColors.PrimaryDark),
                        modifier = Modifier.weight(1f),
                        onClick = { navigator.push(DripsScreen()) }
                    )
                    ExploreCard(
                        emoji = "🛍️",
                        title = "Shop",
                        subtitle = "Browse products from Krieta creators",
                        gradient = listOf(KrietaColors.Accent.copy(alpha = 0.8f), KrietaColors.AccentDark),
                        modifier = Modifier.weight(1f),
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
                            val rootNavigator = navigator.parent ?: navigator
                            when (result.type) {
                                SearchResultType.USER -> rootNavigator.push(ProfileScreen(result.id))
                                SearchResultType.PRODUCT -> rootNavigator.push(ShopScreen())
                                SearchResultType.CONTEST -> rootNavigator.push(com.krieta.feature.contests.presentation.screen.ContestFeedScreen())
                                SearchResultType.SHORT -> rootNavigator.push(com.krieta.feature.shorts.presentation.screen.ShortsScreen())
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
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = modifier.height(130.dp),
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

// ─── SEARCH RESULT UTILS ──────────────────────────────────────────
private val SearchResultType.emoji: String get() = when(this) {
    SearchResultType.USER -> "👤"
    SearchResultType.PRODUCT -> "🛍️"
    SearchResultType.CONTEST -> "🏆"
    SearchResultType.SHORT -> "🎬"
}

private val SearchResultType.color: androidx.compose.ui.graphics.Color get() = when(this) {
    SearchResultType.USER -> KrietaColors.Primary
    SearchResultType.PRODUCT -> KrietaColors.Accent
    SearchResultType.CONTEST -> KrietaColors.Warning
    SearchResultType.SHORT -> KrietaColors.Info
}

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
                    fontWeight = FontWeight.Bold,
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
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
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

