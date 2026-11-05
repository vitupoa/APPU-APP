package com.runinga.feature.marketplace.presentation.screen
import com.runinga.com.core.util.parseColor
import com.runinga.com.core.util.formatString

import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.runinga.feature.marketplace.domain.model.*

/**
 * Displays social media accounts in a horizontal scrollable row
 * Used in influencer profiles for brands to see reach
 */
@Composable
fun SocialMediaAccountsRow(
    accounts: List<SocialMediaAccount>,
    onAccountClick: ((SocialMediaAccount) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    if (accounts.isEmpty()) return
    
    Column(modifier) {
        Text(
            "Social Media Presence",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
        Spacer(Modifier.height(12.dp))
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(accounts) { account ->
                SocialMediaAccountChip(
                    account = account,
                    onClick = { onAccountClick?.invoke(account) }
                )
            }
        }
    }
}

/**
 * Compact chip showing platform, follower count, and engagement
 */
@Composable
private fun SocialMediaAccountChip(
    account: SocialMediaAccount,
    onClick: () -> Unit
) {
    val platformInfo = PLATFORM_INFO[account.platform]!!
    
    Card(
        modifier = Modifier.width(160.dp),
        onClick = onClick
    ) {
        Column(Modifier.padding(12.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Platform Icon
                Box(
                    Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(Color(parseColor(platformInfo.color)).copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(platformInfo.icon, fontSize = 16.sp)
                }
                
                // Verified Badge
                if (account.isVerified) {
                    Icon(
                        painterResource(Res.drawable.ic_verified),
                        "Verified",
                        Modifier.size(16.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            Spacer(Modifier.height(8.dp))
            
            // Platform Name
            Text(
                platformInfo.name,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold
            )
            
            // Follower Count
            Text(
                formatNumber(account.followerCount + account.subscriberCount),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                platformInfo.followerLabel,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(Modifier.height(4.dp))
            
            // Engagement Rate
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    painterResource(Res.drawable.ic_trending_up),
                    null,
                    Modifier.size(14.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(Modifier.width(4.dp))
                Text(
                    "${formatString("%.1f", account.engagementRate)}% engagement",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

/**
 * Compact inline display of social accounts (for lists)
 */
@Composable
fun SocialMediaAccountsInline(
    accounts: List<SocialMediaAccount>,
    modifier: Modifier = Modifier
) {
    if (accounts.isEmpty()) return
    
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        accounts.take(4).forEach { account ->
            val platformInfo = PLATFORM_INFO[account.platform]!!
            
            Surface(
                color = Color(parseColor(platformInfo.color)).copy(alpha = 0.15f),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Text(platformInfo.icon, fontSize = 14.sp)
                    Text(
                        formatNumber(account.followerCount + account.subscriberCount),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
        
        if (accounts.size > 4) {
            Text(
                "+${accounts.size - 4}",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

/**
 * Detailed social media stats card
 */
@Composable
fun SocialMediaStatsCard(
    accounts: List<SocialMediaAccount>,
    modifier: Modifier = Modifier
) {
    val totalFollowers = accounts.sumOf { it.followerCount + it.subscriberCount }
    val avgEngagement = if (accounts.isNotEmpty()) {
        accounts.map { it.engagementRate }.average()
    } else 0.0
    val totalViews = accounts.sumOf { it.totalViews }
    
    Card(modifier) {
        Column(Modifier.padding(16.dp)) {
            Text(
                "Total Reach Across Platforms",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(Modifier.height(16.dp))
            
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatColumn(
                    label = "Total Followers",
                    value = formatNumber(totalFollowers),
                    icon = painterResource(Res.drawable.ic_people)
                )
                
                StatColumn(
                    label = "Avg Engagement",
                    value = "${formatString("%.1f", avgEngagement)}%",
                    icon = painterResource(Res.drawable.ic_trending_up)
                )
                
                StatColumn(
                    label = "Total Views",
                    value = formatLargeNumber(totalViews),
                    icon = painterResource(Res.drawable.ic_visibility)
                )
            }
            
            Spacer(Modifier.height(16.dp))
            
            // Platform Breakdown
            accounts.forEach { account ->
                val platformInfo = PLATFORM_INFO[account.platform]!!
                
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(platformInfo.icon, fontSize = 16.sp)
                        Spacer(Modifier.width(8.dp))
                        Text(
                            platformInfo.name,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                    
                    Text(
                        formatNumber(account.followerCount + account.subscriberCount),
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Composable
private fun StatColumn(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.painter.Painter
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(
            painter = icon,
            null,
            Modifier.size(24.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(Modifier.height(4.dp))
        Text(
            value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        Text(
            label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun formatNumber(num: Int): String {
    return when {
        num >= 1_000_000 -> "${num / 1_000_000}M"
        num >= 1_000 -> "${num / 1_000}K"
        else -> num.toString()
    }
}

private fun formatLargeNumber(num: Long): String {
    return when {
        num >= 1_000_000_000 -> "${num / 1_000_000_000}B"
        num >= 1_000_000 -> "${num / 1_000_000}M"
        num >= 1_000 -> "${num / 1_000}K"
        else -> num.toString()
    }
}


