package com.krieta.feature.chama.presentation
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.chama.data.remote.dto.ChamaDto
import com.krieta.feature.chama.data.remote.dto.ChamaDefaulterDto
import com.krieta.feature.chama.presentation.dashboard.ChamaDashboardScreen
import com.krieta.feature.chama.presentation.wizard.CreateChamaScreen

private val ChamaGold = Color(0xFFF5A623)
private val ChamaGreen = Color(0xFF2ECC71)

class ChamaListScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ChamaListViewModel>()
        val state by viewModel.state.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Chamas", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), contentDescription = "Back")
                        }
                    },
                    actions = {
                        IconButton(onClick = { navigator.push(CreateChamaScreen()) }) {
                            Icon(painterResource(Res.drawable.ic_add), contentDescription = "Create Chama", tint = ChamaGold)
                        }
                    }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                // Tabs
                val tabs = listOf("My Chamas", "Discover", "List of Shame")
                SecondaryTabRow(
                    selectedTabIndex = state.selectedTab,
                    containerColor = Color.Transparent
                ) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = state.selectedTab == index,
                            onClick = { viewModel.setTab(index) },
                            text = {
                                Text(
                                    title,
                                    fontWeight = if (state.selectedTab == index) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            selectedContentColor = ChamaGold,
                            unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                if (state.isLoading) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = ChamaGold)
                    }
                } else {
                    when (state.selectedTab) {
                        0 -> MyChamasTab(
                            chamas = state.myChamas,
                            onChamaClick = { navigator.push(ChamaDashboardScreen(it.id)) }
                        )
                        1 -> DiscoverTab(
                            chamas = state.discoverChamas,
                            joiningId = state.joiningId,
                            onJoin = { viewModel.joinChama(it.id) },
                            onChamaClick = { navigator.push(ChamaDashboardScreen(it.id)) }
                        )
                        2 -> DefaultersTab(defaulters = state.defaulters)
                    }
                }
            }
        }
    }
}

@Composable
private fun DefaultersTab(defaulters: List<ChamaDefaulterDto>) {
    if (defaulters.isEmpty()) {
        EmptyState(
            icon = painterResource(Res.drawable.ic_check),
            title = "Clean Slate",
            subtitle = "No members are currently listed as defaulters across any Chama."
        )
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFE74C3C).copy(alpha = 0.1f)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Icon(painterResource(Res.drawable.ic_warning), contentDescription = null, tint = Color(0xFFE74C3C))
                    Text(
                        "List of Shame: These members have defaulted on their Chama obligations and are banned from joining new Chamas until cleared.",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }

        items(defaulters) { defaulter ->
            DefaulterCard(defaulter)
        }
    }
}

@Composable
private fun DefaulterCard(defaulter: ChamaDefaulterDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFE74C3C).copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        defaulter.user?.displayName?.firstOrNull()?.uppercase() ?: "U",
                        color = Color(0xFFE74C3C),
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(defaulter.user?.displayName ?: "Unknown User", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text(
                        "@${defaulter.user?.username ?: "unknown"}",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        "${defaulter.amountOwedKr} Kr",
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFE74C3C),
                        fontSize = 15.sp
                    )
                    Text("Owed", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            Spacer(Modifier.height(12.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f))
            Spacer(Modifier.height(12.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("Chama", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(defaulter.chamaName, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Fine", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("${defaulter.fineAmountKr} Kr", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
private fun MyChamasTab(chamas: List<ChamaDto>, onChamaClick: (ChamaDto) -> Unit) {
    if (chamas.isEmpty()) {
        EmptyState(
            icon = painterResource(Res.drawable.ic_groups),
            title = "No Chamas Yet",
            subtitle = "Create a Chama or join one from the Discover tab."
        )
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(chamas) { chama ->
            MyChamaCard(chama = chama, onClick = { onChamaClick(chama) })
        }
    }
}

@Composable
private fun DiscoverTab(
    chamas: List<ChamaDto>,
    joiningId: String?,
    onJoin: (ChamaDto) -> Unit,
    onChamaClick: (ChamaDto) -> Unit
) {
    if (chamas.isEmpty()) {
        EmptyState(
            icon = painterResource(Res.drawable.ic_explore),
            title = "No Chamas to Discover",
            subtitle = "Check back later for open Chamas."
        )
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(chamas) { chama ->
            DiscoverChamaCard(
                chama = chama,
                isJoining = joiningId == chama.id,
                onJoin = { onJoin(chama) },
                onClick = { onChamaClick(chama) }
            )
        }
    }
}

@Composable
private fun MyChamaCard(chama: ChamaDto, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.horizontalGradient(
                        listOf(Color(0xFF1A1A2E), Color(0xFF16213E))
                    ),
                    shape = RoundedCornerShape(16.dp)
                )
                .padding(16.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Avatar
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(ChamaGold.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        chama.name.firstOrNull()?.uppercase() ?: "C",
                        color = ChamaGold,
                        fontWeight = FontWeight.Bold,
                        fontSize = 20.sp
                    )
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        chama.name,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        "${chama.type.lowercase().replaceFirstChar { it.uppercase() }} • ${chama._count?.members ?: 0} members",
                        color = Color.White.copy(alpha = 0.6f),
                        fontSize = 13.sp
                    )
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        "${chama.chamaWallet?.krBalance ?: "0"} Kr",
                        color = ChamaGold,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    StatusChip(chama.status)
                }
            }
        }
    }
}

@Composable
private fun DiscoverChamaCard(
    chama: ChamaDto,
    isJoining: Boolean,
    onJoin: () -> Unit,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .clip(CircleShape)
                        .background(ChamaGold.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        chama.name.firstOrNull()?.uppercase() ?: "C",
                        color = ChamaGold,
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp
                    )
                }

                Column(modifier = Modifier.weight(1f)) {
                    Text(chama.name, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Text(
                        chama.type.lowercase().replaceFirstChar { it.uppercase() },
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Text(
                    "${chama._count?.members ?: 0}${if (chama.maxMembers != null) "/${chama.maxMembers}" else ""} members",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            if (chama.description != null) {
                Text(
                    chama.description,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "${chama.contributionAmountKr} Kr / ${chama.contributionFrequency.lowercase().replace("_", "-")}",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = ChamaGold
                )

                Button(
                    onClick = onJoin,
                    enabled = !isJoining,
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ChamaGreen),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 6.dp)
                ) {
                    if (isJoining) {
                        CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.White)
                    } else {
                        Text("Join", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusChip(status: String) {
    val color = when (status) {
        "SETUP" -> Color(0xFF3498DB)
        "ACTIVE" -> ChamaGreen
        "PAUSED" -> ChamaGold
        else -> Color.Gray
    }
    Text(
        status.lowercase().replaceFirstChar { it.uppercase() },
        fontSize = 11.sp,
        color = color,
        fontWeight = FontWeight.Bold
    )
}

@Composable
private fun EmptyState(icon: androidx.compose.ui.graphics.painter.Painter, title: String, subtitle: String) {
    Box(Modifier.fillMaxSize().padding(40.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(painter = icon, contentDescription = null, tint = ChamaGold, modifier = Modifier.size(56.dp))
            Spacer(Modifier.height(16.dp))
            Text(title, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Text(subtitle, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 4.dp))
        }
    }
}
