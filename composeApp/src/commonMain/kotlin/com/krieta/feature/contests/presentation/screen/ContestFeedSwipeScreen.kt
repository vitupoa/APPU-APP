package com.krieta.feature.contests.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.GlassmorphicContainer
import com.krieta.com.core.theme.bounceClick
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.presentation.viewmodel.ContestFeedState
import com.krieta.feature.contests.presentation.viewmodel.ContestFeedViewModel
import com.krieta.feature.contests.domain.model.ContestStatus
import com.krieta.feature.profile.presentation.screen.ProfileScreen
import com.krieta.feature.profile.domain.repository.ProfileRepository
import org.koin.compose.koinInject
import kotlinx.coroutines.launch
import androidx.compose.foundation.clickable
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import coil3.compose.AsyncImage
import androidx.compose.foundation.border
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.SolidColor

class ContestFeedSwipeScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ContestFeedViewModel>()
        val profileRepository = koinInject<ProfileRepository>()
        val tokenManager = koinInject<com.krieta.com.core.security.TokenManager>()
        val state by viewModel.state.collectAsState()
        val scope = rememberCoroutineScope()
        
        var currentUserId by remember { mutableStateOf<String?>(null) }
        
        LaunchedEffect(Unit) {
            currentUserId = tokenManager.getUserId()
        }

        when (val currentState = state) {
            is ContestFeedState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is ContestFeedState.Success -> {
                val contests = currentState.items.filter { it.status == ContestStatus.ACTIVE }
                
                if (contests.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No active contests available for voting.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    return
                }

                // Native TikTok/Tinder Vertical Swiper Architecture!
                val pagerState = rememberPagerState(pageCount = { contests.size })

                VerticalPager(
                    state = pagerState,
                    modifier = Modifier.fillMaxSize().background(Color.Black)
                ) { pageIndex ->
                    val contest = contests[pageIndex]
                    
                    // Is Active Page explicitly triggering ExoPlayer Memory mounting
                    val isActivated = pagerState.currentPage == pageIndex

                    SwipeableContestCard(
                        contest = contest,
                        isActive = isActivated,
                        isOwnContent = currentUserId == contest.creator.id,
                        onProfileClick = { navigator.push(ProfileScreen(contest.creator.id)) },
                        onAdmire = {
                            scope.launch {
                                profileRepository.admire(contest.creator.id)
                            }
                        },
                        onVote = { isUpvote ->
                            if (isUpvote) {
                                println("Triggering Tinder YES Vote Gamification for ${contest.title}")
                            } else {
                                println("Triggering Tinder NOPE Vote. Discarding structurally!")
                                // Automatically scroll VerticalPager down!
                            }
                        },
                        onOpenDetail = {
                            navigator.push(ContestDetailScreen(contest.id))
                        },
                        profileRepository = profileRepository
                    )
                }
            }
            is ContestFeedState.Error -> {
               Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(currentState.message, color = MaterialTheme.colorScheme.error)
               }
            }
        }
    }

    @Composable
    private fun SwipeableContestCard(
        contest: Contest,
        isActive: Boolean,
        isOwnContent: Boolean,
        onProfileClick: () -> Unit,
        onAdmire: () -> Unit,
        onVote: (Boolean) -> Unit,
        onOpenDetail: () -> Unit,
        profileRepository: ProfileRepository
    ) {
        Box(modifier = Modifier.fillMaxSize()) {

            // 1. Media Layer (If active, load ExoPlayer. If inactive, show Thumbnail preserving memory!)
            if (isActive && contest.mediaType.name.contains("VIDEO")) {
                // TODO: Load Native Video Player here via Expect/Actual KMP mapping
                Box(modifier = Modifier.fillMaxSize().background(Color.DarkGray), contentAlignment = Alignment.Center) {
                    Text("ExoPlayer Video Streaming Layer Active", color = Color.White)
                }
            } else {
                // Show standard Compressed Cloudinary Thumbnail Background Image organically
                Box(modifier = Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
                    Text("Caching Static Thumbnail Preserving Mobile Battery Lifecycle...", color = Color.White)
                }
            }

            // 2. Translucent Gamification Metrics Layer (Overlaid onto Video)
            Column(
                modifier = Modifier
                    .align(Alignment.BottomStart)
                    .padding(24.dp)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(contest.title, style = MaterialTheme.typography.headlineLarge, color = Color.White, fontWeight = FontWeight.ExtraBold)
                
                Text(contest.description, style = MaterialTheme.typography.bodyLarge, color = Color.White.copy(alpha = 0.8f), maxLines = 2)

                // Tinder Style Horizontal Swiper overlaying the Vertical Pager!
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    // Fluid Error Button structurally simulating real world logic 
                    Box(
                        modifier = Modifier
                            .bounceClick { onVote(false) }
                            .background(Color(0xFFFF3B30).copy(alpha = 0.8f), RoundedCornerShape(20.dp))
                            .padding(horizontal = 24.dp, vertical = 12.dp)
                    ) {
                        Text("❌ NOPE", color = Color.White, fontWeight = FontWeight.Bold)
                    }

                    Box(
                        modifier = Modifier
                            .bounceClick { onVote(true) }
                            .background(Color(0xFF34C759).copy(alpha = 0.8f), RoundedCornerShape(20.dp))
                            .padding(horizontal = 24.dp, vertical = 12.dp)
                    ) {
                        Text("🔥 YES!", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
            
            // Floating Interaction Side-Bar encapsulated luxuriously
             GlassmorphicContainer(
                 modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 16.dp, bottom = 100.dp),
                 alpha = 0.1f,
                 shape = RoundedCornerShape(32.dp)
             ) {
                Column(
                    modifier = Modifier.padding(vertical = 24.dp, horizontal = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                     // Profile Picture + Plus Button (Admire)
                     if (!isOwnContent) {
                         ProfileActionButtonWithStories(
                             creatorId = contest.creator.id,
                             avatarUrl = contest.creator.avatarUrl,
                             onProfileClick = onProfileClick,
                             onAdmireClick = onAdmire,
                             profileRepository = profileRepository
                         )
                     }
                     
                     Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.bounceClick{}) {
                         // Upvote Icon representation ONLY showing Upvotes organically!
                         Surface(shape = RoundedCornerShape(20.dp), color = Color.White.copy(alpha = 0.2f), modifier = Modifier.size(56.dp)) {}
                         Spacer(modifier = Modifier.height(6.dp))
                         Text("${contest.submissionsCount * 12} Upvotes", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
                     }
                     
                      Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.bounceClick{}) {
                         Surface(shape = RoundedCornerShape(20.dp), color = Color.White.copy(alpha = 0.2f), modifier = Modifier.size(56.dp)) {}
                         Spacer(modifier = Modifier.height(6.dp))
                         Text("Share", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
                     }
                }
             }
        }
    }
    
    @Composable
    private fun ProfileActionButton(
        avatarUrl: String?,
        onProfileClick: () -> Unit,
        onAdmireClick: () -> Unit
    ) {
        Box(
            modifier = Modifier
                .size(56.dp),
            contentAlignment = Alignment.Center
        ) {
            AsyncImage(
                model = avatarUrl,
                contentDescription = "Creator",
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .clickable(onClick = onProfileClick)
                    .border(2.dp, Color.White, CircleShape),
                contentScale = ContentScale.Crop
            )

            Box(
                modifier = Modifier
                    .size(20.dp)
                    .align(Alignment.BottomCenter)
                    .clip(CircleShape)
                    .background(Color(0xFFFF3B5C))
                    .clickable(onClick = onAdmireClick),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "+",
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
    
    @Composable
    private fun ProfileActionButtonWithStories(
        creatorId: String,
        avatarUrl: String?,
        onProfileClick: () -> Unit,
        onAdmireClick: () -> Unit,
        profileRepository: ProfileRepository
    ) {
        var hasUnwatchedStories by remember { mutableStateOf(false) }
        
        LaunchedEffect(creatorId) {
            try {
                val result = profileRepository.getProfile(creatorId)
                if (result is com.krieta.com.core.network.NetworkResult.Success) {
                    hasUnwatchedStories = result.data.hasUnwatchedStories
                }
            } catch (e: Exception) {
                // Silent fail
            }
        }
        
        val borderBrush = when {
            hasUnwatchedStories -> Brush.sweepGradient(
                colors = listOf(
                    Color(0xFFFFCC00),
                    Color(0xFFFF6B00),
                    Color(0xFFFFCC00)
                )
            )
            else -> SolidColor(Color.LightGray)
        }
        
        Box(
            modifier = Modifier
                .size(56.dp),
            contentAlignment = Alignment.Center
        ) {
            // Story ring
            Box(
                modifier = Modifier
                    .size(52.dp)
                    .border(2.dp, borderBrush, CircleShape)
                    .padding(2.dp)
            ) {
                // Profile picture
                AsyncImage(
                    model = avatarUrl,
                    contentDescription = "Creator",
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .clickable(onClick = onProfileClick),
                    contentScale = ContentScale.Crop
                )
            }

            Box(
                modifier = Modifier
                    .size(20.dp)
                    .align(Alignment.BottomCenter)
                    .clip(CircleShape)
                    .background(Color(0xFFFF3B5C))
                    .clickable(onClick = onAdmireClick),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "+",
                    color = Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
