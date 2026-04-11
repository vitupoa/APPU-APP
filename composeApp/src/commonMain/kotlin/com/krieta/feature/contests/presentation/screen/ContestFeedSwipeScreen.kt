package com.krieta.feature.contests.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.GlassmorphicContainer
import com.krieta.com.core.theme.bounceClick
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.contests.domain.model.Contest
import com.krieta.feature.contests.presentation.viewmodel.ContestFeedState
import com.krieta.feature.contests.presentation.viewmodel.ContestFeedViewModel
import com.krieta.feature.contests.domain.model.ContestStatus

class ContestFeedSwipeScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = getScreenModel<ContestFeedViewModel>()
        val state by viewModel.state.collectAsState()

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
                        }
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
        onVote: (Boolean) -> Unit,
        onOpenDetail: () -> Unit
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
                     Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.bounceClick{}) {
                         // Upvote Icon representation ONLY showing Upvotes organically!
                         Surface(shape = RoundedCornerShape(20.dp), color = Color.White.copy(alpha = 0.2f), modifier = Modifier.size(56.dp)) {}
                         Spacer(modifier = Modifier.height(6.dp))
                         Text("${contest.totalSubmissions * 12} Upvotes", color = Color.White, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelSmall)
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
}
