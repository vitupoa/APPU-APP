package com.runinga.com.core.navigation

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
import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
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
import com.runinga.com.core.theme.RuningaColors
import com.runinga.feature.profile.presentation.screen.ProfileScreen
import com.runinga.feature.shop.presentation.screen.ShopScreen
import cafe.adriel.voyager.koin.koinScreenModel
import com.runinga.feature.profile.presentation.viewmodel.SearchViewModel
import com.runinga.feature.profile.presentation.viewmodel.SearchResult
import com.runinga.feature.profile.presentation.viewmodel.SearchResultType
import com.runinga.feature.profile.domain.model.SocialUser
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import com.runinga.feature.explore.presentation.screen.HashtagFeedScreen

// ─── HOME TAB ─────────────────────────────────────────────────────
object HomeTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = painterResource(Res.drawable.ic_home)
            return remember { TabOptions(index = 0u, title = "Home", icon = icon) }
        }

    @Composable
    override fun Content() {
        Navigator(
            screen = com.runinga.feature.feed.presentation.screen.HomeScreen(),
            key = "HomeTabNavigator"
        ) {
            CurrentScreen()
        }
    }
}

// ─── DRIPS TAB ────────────────────────────────────────────────────
object DripsTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = painterResource(Res.drawable.ic_favorite)
            return remember { TabOptions(index = 1u, title = "Drips", icon = icon) }
        }

    @Composable
    override fun Content() {
        Navigator(
            screen = com.runinga.feature.feed.presentation.screen.DripsScreen(),
            key = "DripsTabNavigator"
        ) {
            CurrentScreen()
        }
    }
}

// ─── EXPLORE TAB ──────────────────────────────────────────────────
object ExploreTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = painterResource(Res.drawable.ic_search)
            return remember { TabOptions(index = 2u, title = "Explore", icon = icon) }
        }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        Navigator(
            screen = ExploreScreen(),
            key = "ExploreTabNavigator"
        ) {
            CurrentScreen()
        }
    }
}

// ─── MARKETPLACE TAB ──────────────────────────────────────────────
object MarketplaceTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = painterResource(Res.drawable.ic_campaign)
            return remember { TabOptions(index = 2u, title = "Marketplace", icon = icon) }
        }

    @Composable
    override fun Content() {
        Navigator(
            screen = com.runinga.feature.marketplace.presentation.screen.MarketplaceHomeScreen(),
            key = "MarketplaceTabNavigator"
        ) {
            CurrentScreen()
        }
    }
}

// ─── EXPLORE SCREEN (with trending content) ───────────────────────
class ExploreScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val searchViewModel = koinScreenModel<SearchViewModel>()
        val exploreViewModel = koinScreenModel<com.runinga.feature.explore.presentation.viewmodel.ExploreViewModel>()
        
        val searchState by searchViewModel.state.collectAsState()
        val exploreState by exploreViewModel.state.collectAsState()
        
        val query = searchState.query
        val results = searchState.results
        val isSearching = searchState.isLoading

        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(RuningaColors.Background)
        ) {
            // Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            listOf(RuningaColors.BackgroundElevated, RuningaColors.Background)
                        )
                    )
                    .padding(horizontal = 16.dp, vertical = 16.dp)
            ) {
                Text(
                    "Explore",
                    style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.ExtraBold),
                    color = RuningaColors.OnBackground
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
                placeholder = { Text("Search users, groups, products, contests…") },
                leadingIcon = {
                    Icon(painterResource(Res.drawable.ic_search), contentDescription = null, tint = RuningaColors.OnSurfaceVariant)
                },
                trailingIcon = {
                    AnimatedVisibility(query.isNotEmpty(), enter = fadeIn(), exit = fadeOut()) {
                        IconButton(onClick = { searchViewModel.onQueryChange("") }) {
                            Icon(painterResource(Res.drawable.ic_close), contentDescription = "Clear", tint = RuningaColors.OnSurfaceVariant)
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(16.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = RuningaColors.Primary,
                    unfocusedBorderColor = RuningaColors.Outline,
                    focusedTextColor = RuningaColors.OnBackground,
                    unfocusedTextColor = RuningaColors.OnBackground,
                    cursorColor = RuningaColors.Primary
                )
            )

            // Content: search results OR trending content + cards
            if (query.isBlank()) {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 16.dp)
                ) {
                    // Trending Hashtags
                    item {
                        if (exploreState.trendingHashtags.isNotEmpty()) {
                            SectionHeader("🔥 Trending Hashtags")
                            androidx.compose.foundation.lazy.LazyRow(
                                contentPadding = PaddingValues(horizontal = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(exploreState.trendingHashtags) { hashtag ->
                                    HashtagChip(hashtag, onClick = { tag ->
                                        // Navigate to hashtag feed screen
                                        navigator.push(HashtagFeedScreen(tag))
                                    })
                                }
                            }
                            Spacer(Modifier.height(16.dp))
                        }
                    }

                    // Category Pills
                    item {
                        SectionHeader("📱 Categories")
                        androidx.compose.foundation.lazy.LazyRow(
                            contentPadding = PaddingValues(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(com.runinga.feature.explore.domain.model.ContentCategory.values()) { category ->
                                CategoryPill(
                                    category = category,
                                    isSelected = category == exploreState.selectedCategory,
                                    onClick = { exploreViewModel.selectCategory(category) }
                                )
                            }
                        }
                        Spacer(Modifier.height(16.dp))
                    }

                    // Trending Shorts
                    item {
                        if (exploreState.trendingShorts.isNotEmpty()) {
                            SectionHeader("🎬 Trending Shorts")
                            androidx.compose.foundation.lazy.LazyRow(
                                contentPadding = PaddingValues(horizontal = 16.dp),
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                items(exploreState.trendingShorts) { short ->
                                    ShortThumbnail(short, onClick = {
                                        // Navigate to shorts feed
                                        navigator.push(com.runinga.feature.shorts.presentation.screen.ShortsScreen())
                                    })
                                }
                            }
                            Spacer(Modifier.height(16.dp))
                        }
                    }

                    // Trending Contests
                    item {
                        if (exploreState.trendingContests.isNotEmpty()) {
                            SectionHeader("🏆 Trending Contests")
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                    if (exploreState.trendingContests.isNotEmpty()) {
                        items(exploreState.trendingContests) { contest ->
                            ContestCard(
                                contest = contest,
                                onClick = {
                                    // Navigate to contest submissions feed to watch entries
                                    navigator.push(com.runinga.feature.contests.presentation.screen.ContestSubmissionFeedScreen())
                                },
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                            )
                        }
                        item { Spacer(Modifier.height(16.dp)) }
                    }

                    // Trending Creators
                    item {
                        if (exploreState.trendingCreators.isNotEmpty()) {
                            SectionHeader("⭐ Trending Creators")
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                    if (exploreState.trendingCreators.isNotEmpty()) {
                        items(exploreState.trendingCreators) { creator ->
                            CreatorCard(
                                creator = creator,
                                onClick = {
                                    // Navigate to creator's profile
                                    navigator.push(ProfileScreen(creator.id))
                                },
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                            )
                        }
                        item { Spacer(Modifier.height(16.dp)) }
                    }

                    // Original Explore Cards
                    item {
                        SectionHeader("📍 Quick Access")
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            ExploreCard(
                                emoji = "🏆",
                                title = "Contests",
                                subtitle = "Compete, win prizes & grow",
                                gradient = listOf(RuningaColors.Warning.copy(alpha = 0.8f), RuningaColors.Warning),
                                modifier = Modifier.weight(1f),
                                onClick = { navigator.push(com.runinga.feature.contests.presentation.screen.ContestFeedScreen()) }
                            )
                            ExploreCard(
                                emoji = "🛒",
                                title = "Marketplace",
                                subtitle = "Brand partnerships & deals",
                                gradient = listOf(androidx.compose.ui.graphics.Color(0xFF9C27B0).copy(alpha = 0.8f), androidx.compose.ui.graphics.Color(0xFF7B1FA2)),
                                modifier = Modifier.weight(1f),
                                onClick = { navigator.push(com.runinga.feature.marketplace.presentation.screen.MarketplaceHomeScreen()) }
                            )
                        }
                        Spacer(Modifier.height(16.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            ExploreCard(
                                emoji = "�️",
                                title = "Shop",
                                subtitle = "Browse creator products",
                                gradient = listOf(RuningaColors.Accent.copy(alpha = 0.8f), RuningaColors.AccentDark),
                                modifier = Modifier.weight(1f),
                                onClick = { navigator.push(ShopScreen()) }
                            )
                        }
                        Spacer(Modifier.height(16.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            ExploreCard(
                                emoji = "🏦",
                                title = "Chamas",
                                subtitle = "Join savings groups & rotate payouts",
                                gradient = listOf(androidx.compose.ui.graphics.Color(0xFFF5A623).copy(alpha = 0.8f), androidx.compose.ui.graphics.Color(0xFFD4891A)),
                                modifier = Modifier.weight(1f),
                                onClick = { navigator.push(com.runinga.feature.chama.presentation.ChamaListScreen()) }
                            )
                            Spacer(Modifier.weight(1f))
                        }
                    }
                }
            } else if (isSearching) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = RuningaColors.Primary)
                }
            } else if (results.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🔍", fontSize = 48.sp)
                        Spacer(Modifier.height(12.dp))
                        Text("No results for \"$query\"", color = RuningaColors.OnSurfaceVariant)
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
                                SearchResultType.GROUP, SearchResultType.CHAMA -> navigator.push(com.runinga.feature.chat.presentation.room.ChatRoomScreen(result.id, result.title))
                                SearchResultType.PRODUCT -> navigator.push(com.runinga.feature.shop.presentation.screen.ProductDetailScreen(result.id))
                                SearchResultType.CONTEST -> navigator.push(com.runinga.feature.contests.presentation.screen.ContestDetailScreen(result.id))
                                SearchResultType.SHORT -> navigator.push(com.runinga.feature.shorts.presentation.screen.ShortsScreen())
                                SearchResultType.HASHTAG -> navigator.push(HashtagFeedScreen(result.id))
                                SearchResultType.DRIP -> navigator.push(com.runinga.feature.feed.presentation.screen.HomeScreen())
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
                .padding(20.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(emoji, fontSize = 32.sp)
                Spacer(Modifier.height(8.dp))
                Text(
                    title,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 20.sp,
                    color = androidx.compose.ui.graphics.Color.White
                )
                Text(
                    subtitle,
                    fontSize = 12.sp,
                    color = androidx.compose.ui.graphics.Color.White.copy(alpha = 0.8f),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }
    }
}

// ─── TRENDING COMPONENTS ─────────────────────────────────────────
@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
        fontWeight = FontWeight.Bold,
        fontSize = 18.sp,
        color = RuningaColors.OnBackground
    )
}

@Composable
private fun HashtagChip(hashtag: com.runinga.feature.explore.domain.model.TrendingHashtag, onClick: (String) -> Unit) {
    Surface(
        shape = RoundedCornerShape(20.dp),
        color = RuningaColors.PrimaryContainer,
        modifier = Modifier.clickable { onClick(hashtag.tag) }
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                hashtag.tag,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = RuningaColors.OnPrimaryContainer
            )
            Text(
                "${formatCount(hashtag.viewCount)} views",
                fontSize = 11.sp,
                color = RuningaColors.OnPrimaryContainer.copy(alpha = 0.7f)
            )
        }
    }
}

@Composable
private fun CategoryPill(
    category: com.runinga.feature.explore.domain.model.ContentCategory,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    FilterChip(
        selected = isSelected,
        onClick = onClick,
        label = {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(category.emoji)
                Text(category.displayName)
            }
        },
        colors = FilterChipDefaults.filterChipColors(
            selectedContainerColor = RuningaColors.Primary,
            selectedLabelColor = androidx.compose.ui.graphics.Color.White
        )
    )
}



@Composable
private fun ShortThumbnail(
    short: com.runinga.feature.explore.domain.model.TrendingShort,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.width(120.dp).height(180.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            coil3.compose.AsyncImage(
                model = short.thumbnailUrl,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop
            )
            
            // View count
            Surface(
                modifier = Modifier.align(Alignment.BottomStart).padding(8.dp),
                color = androidx.compose.ui.graphics.Color.Black.copy(alpha = 0.6f),
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
                        tint = androidx.compose.ui.graphics.Color.White,
                        modifier = Modifier.size(12.dp)
                    )
                    Text(
                        formatCount(short.viewCount),
                        color = androidx.compose.ui.graphics.Color.White,
                        fontSize = 10.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun ContestCard(
    contest: com.runinga.feature.explore.domain.model.TrendingContest,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            contest.thumbnailUrl?.let { url ->
                coil3.compose.AsyncImage(
                    model = url,
                    contentDescription = null,
                    modifier = Modifier.size(80.dp).clip(RoundedCornerShape(12.dp)),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                )
            } ?: Box(
                modifier = Modifier.size(80.dp).clip(RoundedCornerShape(12.dp))
                    .background(RuningaColors.PrimaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text("🏆", fontSize = 32.sp)
            }
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    contest.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(Modifier.height(4.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        "💰 ${com.runinga.com.core.util.KrCurrencyFormatter.formatKr(contest.prizeKr)}",
                        fontSize = 12.sp,
                        color = RuningaColors.Primary,
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        "👥 ${contest.participantsCount}",
                        fontSize = 12.sp,
                        color = RuningaColors.OnSurfaceVariant
                    )
                }
                Spacer(Modifier.height(4.dp))
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = RuningaColors.SecondaryContainer
                ) {
                    Text(
                        contest.category,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                        fontSize = 11.sp,
                        color = RuningaColors.OnSecondaryContainer
                    )
                }
            }
        }
    }
}

@Composable
private fun CreatorCard(
    creator: com.runinga.feature.explore.domain.model.TrendingCreator,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box {
                coil3.compose.AsyncImage(
                    model = creator.avatarUrl,
                    contentDescription = null,
                    modifier = Modifier.size(56.dp).clip(CircleShape),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                )
                if (creator.isVerified) {
                    Icon(
                        painterResource(Res.drawable.ic_verified),
                        contentDescription = "Verified",
                        tint = RuningaColors.Primary,
                        modifier = Modifier.size(20.dp).align(Alignment.BottomEnd)
                            .background(RuningaColors.Background, CircleShape)
                            .padding(2.dp)
                    )
                }
            }
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    creator.displayName,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp
                )
                Text(
                    "@${creator.username}",
                    fontSize = 13.sp,
                    color = RuningaColors.OnSurfaceVariant
                )
                creator.bio?.let {
                    Text(
                        it,
                        fontSize = 12.sp,
                        color = RuningaColors.OnSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
            
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    formatCount(creator.followerCount.toLong()),
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Text(
                    "followers",
                    fontSize = 11.sp,
                    color = RuningaColors.OnSurfaceVariant
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

// ─── SEARCH RESULT UTILS ──────────────────────────────────────────
private val SearchResultType.emoji: String get() = when(this) {
    SearchResultType.USER -> "👤"
    SearchResultType.GROUP -> "👥"
    SearchResultType.PRODUCT -> "🛍️"
    SearchResultType.CONTEST -> "🏆"
    SearchResultType.SHORT -> "🎬"
    SearchResultType.HASHTAG -> "#️⃣"
    SearchResultType.CHAMA -> "🏦"
    SearchResultType.DRIP -> "📸"
}

private val SearchResultType.color: androidx.compose.ui.graphics.Color get() = when(this) {
    SearchResultType.USER -> RuningaColors.Primary
    SearchResultType.GROUP -> androidx.compose.ui.graphics.Color(0xFF43A047)
    SearchResultType.PRODUCT -> RuningaColors.Accent
    SearchResultType.CONTEST -> RuningaColors.Warning
    SearchResultType.SHORT -> RuningaColors.Info
    SearchResultType.HASHTAG -> androidx.compose.ui.graphics.Color(0xFF2196F3)
    SearchResultType.CHAMA -> androidx.compose.ui.graphics.Color(0xFFF5A623)
    SearchResultType.DRIP -> androidx.compose.ui.graphics.Color(0xFFE91E63)
}

@Composable
private fun SearchResultRow(result: SearchResult, onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        color = RuningaColors.SurfaceVariant,
        shape = RoundedCornerShape(14.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Show image if available, otherwise show emoji icon
            if (result.imageUrl != null) {
                coil3.compose.AsyncImage(
                    model = result.imageUrl,
                    contentDescription = null,
                    modifier = Modifier
                        .size(44.dp)
                        .clip(if (result.type == SearchResultType.USER) CircleShape else RoundedCornerShape(8.dp)),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(result.type.color.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(result.type.emoji, fontSize = 20.sp)
                }
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    result.title,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = RuningaColors.OnSurface,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    result.subtitle,
                    fontSize = 12.sp,
                    color = RuningaColors.OnSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Icon(
                painterResource(Res.drawable.ic_chevron_right),
                contentDescription = null,
                tint = RuningaColors.OnSurfaceVariant,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

// ─── NOTE: Old DripsScreen placeholder and ContestsTab removed ───
// DripsTab now lives above. Contests accessed via Explore card.

// ─── PROFILE TAB ──────────────────────────────────────────────────
object ProfileTab : Tab {
    override val options: TabOptions
        @Composable get() {
            val icon = painterResource(Res.drawable.ic_person)
            return remember { TabOptions(index = 4u, title = "Profile", icon = icon) }
        }

    @Composable
    override fun Content() {
        Navigator(
            screen = ProfileScreen(userId = null),
            key = "ProfileTabNavigator"
        ) {
            CurrentScreen()
        }
    }
}

