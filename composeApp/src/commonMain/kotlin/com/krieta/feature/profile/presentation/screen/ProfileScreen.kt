package com.krieta.feature.profile.presentation.screen

import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState


import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Verified
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
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.profile.domain.model.*
import com.krieta.feature.profile.presentation.viewmodel.ProfileViewModel
import org.koin.core.parameter.parametersOf

class ProfileScreen(private val userId: String? = null) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = getScreenModel<ProfileViewModel>(parameters = { parametersOf(userId) })
        val state by viewModel.state.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(state.profile?.username?.let { "@$it" } ?: "Profile") },
                    navigationIcon = {
                        if (userId != null) {
                            IconButton(onClick = { navigator.pop() }) {
                                Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                            }
                        }
                    },
                    actions = {
                        if (viewModel.isOwnProfile) {
                            IconButton(onClick = { navigator.push(EditProfileScreen()) }) {
                                Icon(Icons.Default.Edit, "Edit Profile")
                            }
                            IconButton(onClick = { navigator.push(MilestonesScreen()) }) {
                                Icon(Icons.Default.EmojiEvents, "Milestones")
                            }
                        }
                    }
                )
            }
        ) { padding ->
            when {
                state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
                state.error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(state.error!!, color = MaterialTheme.colorScheme.error)
                }
                state.profile != null -> {
                    val profile = state.profile!!
                    LazyColumn(
                        modifier = Modifier.fillMaxSize().padding(padding),
                        contentPadding = PaddingValues(bottom = 80.dp)
                    ) {
                        // Cover photo + avatar
                        item { ProfileHeader(profile) }

                        // Name + bio
                        item { ProfileInfo(profile) }

                        // Relationship button (only on other profiles)
                        if (!viewModel.isOwnProfile) {
                            item {
                                RelationshipButton(
                                    status = profile.relationshipStatus,
                                    isLoading = state.isRelationshipLoading,
                                    onToggle = { viewModel.toggleAdmire() },
                                    modifier = Modifier.padding(horizontal = 16.dp).fillMaxWidth()
                                )
                            }
                        }

                        // Stats row
                        item {
                            StatsRow(
                                stats = profile.stats,
                                userId = profile.id,
                                onAdmirersClick = { navigator.push(SocialListScreen(profile.id, "Admirers")) },
                                onAdmiringClick = { navigator.push(SocialListScreen(profile.id, "Admiring")) },
                                onLoversClick = { navigator.push(SocialListScreen(profile.id, "Lovers")) }
                            )
                        }

                        // Bio links
                        if (profile.bioLinks.isNotEmpty()) {
                            item { BioLinksSection(profile.bioLinks) }
                        }

                        // Subscription tiers (on other profiles)
                        if (!viewModel.isOwnProfile && state.tiers.isNotEmpty()) {
                            item {
                                SubscriptionTiersSection(
                                    tiers = state.tiers,
                                    onSubscribe = { viewModel.subscribe(it.tier.name) }
                                )
                            }
                        }

                        // Own profile: manage tiers
                        if (viewModel.isOwnProfile) {
                            item {
                                OutlinedButton(
                                    onClick = { navigator.push(SubscriptionTierSetupScreen()) },
                                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Icon(Icons.Default.Settings, contentDescription = null, modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.width(8.dp))
                                    Text("Manage Subscription Tiers")
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun ProfileHeader(profile: UserProfile) {
        Box(modifier = Modifier.fillMaxWidth().height(200.dp)) {
            // Cover photo
            AsyncImage(
                model = profile.coverPhotoUrl,
                contentDescription = "Cover",
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
            // Avatar
            AsyncImage(
                model = profile.avatarUrl,
                contentDescription = profile.displayName,
                modifier = Modifier
                    .size(80.dp)
                    .clip(CircleShape)
                    .align(Alignment.BottomStart)
                    .offset(x = 16.dp, y = 40.dp),
                contentScale = ContentScale.Crop
            )
        }
        Spacer(Modifier.height(48.dp))
    }

    @Composable
    private fun ProfileInfo(profile: UserProfile) {
        Column(modifier = Modifier.padding(horizontal = 16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(profile.displayName, fontWeight = FontWeight.Bold, fontSize = 20.sp)
                if (profile.isVerified) {
                    Spacer(Modifier.width(6.dp))
                    Icon(
                        Icons.Default.Verified,
                        contentDescription = "Verified",
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp)
                    )
                }
                Spacer(Modifier.width(8.dp))
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = MaterialTheme.colorScheme.secondaryContainer
                ) {
                    Text(
                        profile.accountType.name,
                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
            Text("@${profile.username}", color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (!profile.bio.isNullOrBlank()) {
                Spacer(Modifier.height(8.dp))
                Text(profile.bio, style = MaterialTheme.typography.bodyMedium)
            }
            Spacer(Modifier.height(12.dp))
        }
    }

    @Composable
    private fun RelationshipButton(
        status: RelationshipStatus,
        isLoading: Boolean,
        onToggle: () -> Unit,
        modifier: Modifier = Modifier
    ) {
        val (text, containerColor) = when (status) {
            RelationshipStatus.NONE -> "Admire" to MaterialTheme.colorScheme.primary
            RelationshipStatus.ADMIRED_BY -> "Admire Back" to MaterialTheme.colorScheme.primary
            RelationshipStatus.ADMIRING -> "Unadmire" to MaterialTheme.colorScheme.surfaceVariant
            RelationshipStatus.LOVERS -> "Unlove 💕" to MaterialTheme.colorScheme.errorContainer
        }

        Button(
            onClick = onToggle,
            modifier = modifier.height(44.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = containerColor),
            enabled = !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
            } else {
                Text(text, fontWeight = FontWeight.Bold)
            }
        }
        Spacer(Modifier.height(12.dp))
    }

    @Composable
    private fun StatsRow(
        stats: ProfileStats,
        userId: String,
        onAdmirersClick: () -> Unit,
        onAdmiringClick: () -> Unit,
        onLoversClick: () -> Unit
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            StatItem("Admirers", "${stats.admirers}", onClick = onAdmirersClick)
            StatItem("Admiring", "${stats.admiring}", onClick = onAdmiringClick)
            StatItem("Lovers", "${stats.lovers}", onClick = onLoversClick)
            StatItem("Contests", "${stats.contestsWon}", onClick = {})
        }
        HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
    }

    @Composable
    private fun StatItem(label: String, value: String, onClick: () -> Unit) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.clickable { onClick() }
        ) {
            Text(value, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }

    @Composable
    private fun BioLinksSection(links: List<BioLink>) {
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
            links.forEach { link ->
                OutlinedCard(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        link.icon?.let { Text(it, modifier = Modifier.padding(end = 8.dp)) }
                        Column {
                            Text(link.label, fontWeight = FontWeight.Medium)
                            Text(link.url, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun SubscriptionTiersSection(tiers: List<SubscriptionTier>, onSubscribe: (SubscriptionTier) -> Unit) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Subscription Tiers", fontWeight = FontWeight.Bold, fontSize = 16.sp)
            Spacer(Modifier.height(8.dp))
            tiers.forEach { tier ->
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                tier.tier.name.replace("_", " "),
                                fontWeight = FontWeight.Bold
                            )
                            Text(tier.benefits, style = MaterialTheme.typography.bodySmall, maxLines = 2)
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                KrCurrencyFormatter.formatKr(tier.krAmount),
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text("/month", style = MaterialTheme.typography.labelSmall)
                            Spacer(Modifier.height(4.dp))
                            Button(
                                onClick = { onSubscribe(tier) },
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Text("Subscribe", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

