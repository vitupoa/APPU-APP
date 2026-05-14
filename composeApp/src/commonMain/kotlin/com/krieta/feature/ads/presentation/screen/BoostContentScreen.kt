package com.krieta.feature.ads.presentation.screen

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow

class BoostContentScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        
        var selectedContentType by remember { mutableStateOf("SHORT") }
        var selectedContent by remember { mutableStateOf<BoostableContent?>(null) }
        var boostBudget by remember { mutableStateOf("") }
        var boostDuration by remember { mutableStateOf("7") }
        var showContentPicker by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Boost Content") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                        }
                    }
                )
            }
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Icon(
                                Icons.AutoMirrored.Filled.TrendingUp,
                                contentDescription = null,
                                modifier = Modifier.size(48.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(Modifier.height(12.dp))
                            Text(
                                "Boost Your Content",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                "Increase reach and engagement on your shorts and posts",
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    }
                }

                item {
                    Text("Content Type", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = selectedContentType == "SHORT",
                            onClick = { 
                                selectedContentType = "SHORT"
                                selectedContent = null
                            },
                            label = { Text("Shorts") },
                            leadingIcon = { Icon(Icons.Default.VideoLibrary, null) }
                        )
                        FilterChip(
                            selected = selectedContentType == "POST",
                            onClick = { 
                                selectedContentType = "POST"
                                selectedContent = null
                            },
                            label = { Text("Drips") },
                            leadingIcon = { Icon(Icons.Default.Image, null) }
                        )
                        FilterChip(
                            selected = selectedContentType == "LIVE",
                            onClick = { 
                                selectedContentType = "LIVE"
                                selectedContent = null
                            },
                            label = { Text("Live") },
                            leadingIcon = { Icon(Icons.Default.Videocam, null) }
                        )
                    }
                }

                item {
                    Text("Select Content", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    
                    if (selectedContent != null) {
                        SelectedContentCard(
                            content = selectedContent!!,
                            onRemove = { selectedContent = null }
                        )
                    } else {
                        OutlinedCard(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { showContentPicker = true },
                            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Add, "Select content")
                                Spacer(Modifier.width(12.dp))
                                Text("Select ${selectedContentType.lowercase()} to boost")
                            }
                        }
                    }
                }

                item {
                    Text("Budget", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    OutlinedTextField(
                        value = boostBudget,
                        onValueChange = { boostBudget = it },
                        label = { Text("Budget (KES)") },
                        modifier = Modifier.fillMaxWidth(),
                        prefix = { Text("KES ") },
                        supportingText = { Text("Minimum: KES 500") },
                        leadingIcon = { Icon(Icons.Default.AttachMoney, null) }
                    )
                }

                item {
                    Text("Duration", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("3", "7", "14", "30").forEach { days ->
                            FilterChip(
                                selected = boostDuration == days,
                                onClick = { boostDuration = days },
                                label = { Text("$days days") }
                            )
                        }
                    }
                }

                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("Estimated Results", fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(8.dp))
                            
                            val budget = boostBudget.toIntOrNull() ?: 0
                            val duration = boostDuration.toIntOrNull() ?: 7
                            val dailyBudget = if (duration > 0) budget / duration else 0
                            val estimatedReach = (dailyBudget * 4).coerceIn(0, 50000)
                            val estimatedImpressions = (estimatedReach * 3).coerceIn(0, 150000)
                            
                            Text("• Daily Budget: KES ${dailyBudget}")
                            Text("• Estimated Reach: ${formatNumber(estimatedReach)} people")
                            Text("• Estimated Impressions: ${formatNumber(estimatedImpressions)}")
                            Text("• Engagement Boost: 3x - 5x")
                        }
                    }
                }

                item {
                    Button(
                        onClick = { /* Boost content */ },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = selectedContent != null && boostBudget.toIntOrNull()?.let { it >= 500 } == true
                    ) {
                        Icon(Icons.AutoMirrored.Filled.TrendingUp, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Boost Content - KES $boostBudget")
                    }
                }
            }
        }

        if (showContentPicker) {
            ContentPickerDialog(
                contentType = selectedContentType,
                onDismiss = { showContentPicker = false },
                onContentSelected = { content ->
                    selectedContent = content
                    showContentPicker = false
                }
            )
        }
    }
}

@Composable
private fun SelectedContentCard(
    content: BoostableContent,
    onRemove: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.surfaceVariant)
            ) {
                coil3.compose.AsyncImage(
                    model = content.thumbnailUrl,
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
            }
            
            Column(modifier = Modifier.weight(1f)) {
                Text(content.title, fontWeight = FontWeight.Bold)
                Text(
                    "${formatNumber(content.views)} views • ${formatNumber(content.likes)} likes",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            IconButton(onClick = onRemove) {
                Icon(Icons.Default.Close, "Remove")
            }
        }
    }
}

@Composable
private fun ContentPickerDialog(
    contentType: String,
    onDismiss: () -> Unit,
    onContentSelected: (BoostableContent) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select ${contentType.lowercase()}") },
        text = {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(5) { index ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                onContentSelected(
                                    BoostableContent(
                                        id = "content_$index",
                                        type = contentType,
                                        title = "Sample $contentType $index",
                                        thumbnailUrl = "",
                                        views = 1000 + index * 500,
                                        likes = 100 + index * 50
                                    )
                                )
                            }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(60.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant)
                            )
                            Column {
                                Text("Sample $contentType $index", fontWeight = FontWeight.Bold)
                                Text(
                                    "${formatNumber(1000 + index * 500)} views",
                                    style = MaterialTheme.typography.bodySmall
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

private fun formatNumber(num: Int): String {
    return when {
        num >= 1_000_000 -> "${num / 1_000_000}M"
        num >= 1_000 -> "${num / 1_000}K"
        else -> num.toString()
    }
}

data class BoostableContent(
    val id: String,
    val type: String,
    val title: String,
    val thumbnailUrl: String,
    val views: Int,
    val likes: Int
)
