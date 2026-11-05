package com.runinga.feature.marketplace.presentation.screen
import com.runinga.com.core.util.SafeConversion
import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.runinga.feature.marketplace.presentation.viewmodel.*
import org.koin.compose.koinInject

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SponsorContestScreen(
    contestId: String,
    contestTitle: String,
    viewModel: SponsorContestViewModel = koinInject(),
    onSuccess: () -> Unit
) {
    var amount by remember { mutableStateOf("") }
    var productUrl by remember { mutableStateOf("") }
    var enablePurchaseToEnter by remember { mutableStateOf(false) }
    
    val sponsorState by viewModel.sponsorState.collectAsState()
    
    LaunchedEffect(sponsorState) {
        if (sponsorState is SponsorState.Success) {
            onSuccess()
        }
    }
    
    Scaffold(
        topBar = { TopAppBar(title = { Text("Sponsor Contest") }) }
    ) { padding ->
        LazyColumn(
            Modifier.fillMaxSize().padding(padding).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Card(Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(16.dp)) {
                        Text("Contest", style = MaterialTheme.typography.labelMedium)
                        Text(contestTitle, style = MaterialTheme.typography.titleLarge)
                    }
                }
            }
            
            item {
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Sponsorship Amount ($)") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(painterResource(Res.drawable.ic_attach_money), null) }
                )
            }
            
            item {
                OutlinedTextField(
                    value = productUrl,
                    onValueChange = { productUrl = it },
                    label = { Text("Product URL (Optional)") },
                    modifier = Modifier.fillMaxWidth(),
                    leadingIcon = { Icon(painterResource(Res.drawable.ic_link), null) }
                )
            }
            
            item {
                Card(Modifier.fillMaxWidth()) {
                    Row(
                        Modifier.fillMaxWidth().padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text("Purchase-to-Enter", style = MaterialTheme.typography.titleMedium)
                            Text(
                                "Users who buy your product get bonus contest entry",
                                style = MaterialTheme.typography.bodySmall
                            )
                        }
                        Switch(
                            checked = enablePurchaseToEnter,
                            onCheckedChange = { enablePurchaseToEnter = it }
                        )
                    }
                }
            }
            
            item {
                Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )) {
                    Column(Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(painterResource(Res.drawable.ic_info), null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.width(8.dp))
                            Text("Legal Compliance", style = MaterialTheme.typography.titleSmall)
                        }
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "Purchase-to-enter is legal because:\n" +
                            "• Free entry is always available\n" +
                            "• Winners determined by skill/votes\n" +
                            "• Purchase gives product value, not better odds",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            }
            
            item {
                Button(
                    onClick = {
                        viewModel.sponsorContest(
                            contestId,
                            SafeConversion.toDoubleOrDefaultWithValidation(amount, "sponsorAmount", 0.0, defaultValue = 0.0) ?: 0.0,
                            productUrl.ifBlank { null },
                            enablePurchaseToEnter
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = sponsorState !is SponsorState.Loading && amount.isNotBlank()
                ) {
                    if (sponsorState is SponsorState.Loading) {
                        CircularProgressIndicator(Modifier.size(24.dp))
                    } else {
                        Text("Sponsor Contest")
                    }
                }
            }
            
            if (sponsorState is SponsorState.Error) {
                item {
                    Text(
                        (sponsorState as SponsorState.Error).message,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GamificationScreen(
    viewModel: GamificationViewModel = koinInject()
) {
    val stats by viewModel.stats.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadStats()
    }
    
    Scaffold(
        topBar = { TopAppBar(title = { Text("Your Progress") }) }
    ) { padding ->
        stats?.let { data ->
            LazyColumn(
                Modifier.fillMaxSize().padding(padding).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("Level ${data.level}", style = MaterialTheme.typography.headlineMedium)
                            Spacer(Modifier.height(8.dp))
                            Text("${data.totalPoints} Points", style = MaterialTheme.typography.titleLarge)
                        }
                    }
                }
                
                item {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        StatCard("Contests Won", data.contestsWon.toString(), Modifier.weight(1f))
                        StatCard(
                            "Status",
                            if (data.isInfluencer) "Influencer" else "User",
                            Modifier.weight(1f)
                        )
                    }
                }
                
                if (data.contestsWon >= 2 && !data.isInfluencer) {
                    item {
                        Card(
                            Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.tertiaryContainer
                            )
                        ) {
                            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(painterResource(Res.drawable.ic_emoji_events), null, Modifier.size(48.dp))
                                Spacer(Modifier.width(16.dp))
                                Column {
                                    Text("Almost There!", style = MaterialTheme.typography.titleMedium)
                                    Text(
                                        "Win 1 more contest to become an influencer!",
                                        style = MaterialTheme.typography.bodySmall
                                    )
                                }
                            }
                        }
                    }
                }
                
                item {
                    Text("Recent Activity", style = MaterialTheme.typography.titleMedium)
                }
                
                items(data.recentActions) { action ->
                    Card(Modifier.fillMaxWidth()) {
                        Row(
                            Modifier.fillMaxWidth().padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(action.action)
                            Text("+${action.points} pts", color = MaterialTheme.colorScheme.primary)
                        }
                    }
                }
            }
        } ?: Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    }
}

@Composable
fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier) {
        Column(
            Modifier.fillMaxWidth().padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, style = MaterialTheme.typography.headlineSmall)
            Text(label, style = MaterialTheme.typography.bodySmall)
        }
    }
}

