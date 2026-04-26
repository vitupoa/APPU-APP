package com.krieta.feature.chama.presentation.dashboard

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import com.krieta.feature.chama.data.remote.dto.ChamaMemberDto
import com.krieta.feature.chama.data.remote.dto.ChamaTransactionDto
import com.krieta.feature.chama.presentation.election.ChamaElectionScreen
import org.koin.core.parameter.parametersOf

private val ChamaGold = Color(0xFFF5A623)
private val ChamaGreen = Color(0xFF2ECC71)
private val ChamaRed = Color(0xFFE74C3C)

class ChamaDashboardScreen(private val chamaId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ChamaDashboardViewModel> { parametersOf(chamaId) }
        val state by viewModel.state.collectAsState()

        var showContributeDialog by remember { mutableStateOf(false) }
        var contributeAmount by remember { mutableStateOf("") }

        // Snackbar host
        val snackbarHostState = remember { SnackbarHostState() }
        LaunchedEffect(state.error, state.successMessage) {
            val msg = state.successMessage ?: state.error
            if (msg != null) {
                snackbarHostState.showSnackbar(msg)
                viewModel.clearMessages()
            }
        }

        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            state.chama?.name ?: "Chama",
                            fontWeight = FontWeight.Bold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), contentDescription = "Back")
                        }
                    },
                    actions = {
                        if (state.chama?.status == "SETUP") {
                            TextButton(onClick = { viewModel.activateChama() }) {
                                Text("Activate", color = ChamaGreen, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                )
            },
            floatingActionButton = {
                if (state.chama?.status == "ACTIVE") {
                    FloatingActionButton(
                        onClick = { showContributeDialog = true },
                        containerColor = ChamaGold
                    ) {
                        Icon(painterResource(Res.drawable.ic_add), contentDescription = "Contribute", tint = Color.White)
                    }
                }
            }
        ) { padding ->
            if (state.isLoading && state.chama == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = ChamaGold)
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                ) {
                    // Wallet Hero Card
                    WalletHeroCard(
                        balance = state.walletBalance,
                        status = state.chama?.status ?: "SETUP",
                        type = state.chama?.type ?: "",
                        memberCount = state.chama?._count?.members ?: 0,
                        cycleNumber = state.chama?.currentCycleNumber ?: 0
                    )

                    // Tabs
                    val tabs = if (state.chama?.type == "ROTATING") {
                        listOf("Overview", "Members", "Transactions", "Elections", "Cycles")
                    } else {
                        listOf("Overview", "Members", "Transactions", "Elections")
                    }
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
                                        fontSize = 13.sp,
                                        fontWeight = if (state.selectedTab == index) FontWeight.Bold else FontWeight.Normal
                                    )
                                },
                                selectedContentColor = ChamaGold,
                                unselectedContentColor = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }

                    // Tab content
                    when (state.selectedTab) {
                        0 -> OverviewTab(state)
                        1 -> MembersTab(state)
                        2 -> TransactionsTab(state)
                        3 -> ElectionsTab(state) { electionId ->
                            navigator.push(ChamaElectionScreen(chamaId, electionId))
                        }
                        4 -> CyclesTab(state)
                    }
                }
            }
        }

        // Contribute dialog
        if (showContributeDialog) {
            AlertDialog(
                onDismissRequest = { showContributeDialog = false },
                title = { Text("Contribute to Chama") },
                text = {
                    Column {
                        Text(
                            "Minimum: ${state.chama?.contributionAmountKr ?: "0"} Kr",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(Modifier.height(12.dp))
                        OutlinedTextField(
                            value = contributeAmount,
                            onValueChange = { contributeAmount = it },
                            label = { Text("Amount (Kr)") },
                            singleLine = true,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            contributeAmount.toDoubleOrNull()?.let {
                                viewModel.contribute(it)
                                showContributeDialog = false
                                contributeAmount = ""
                            }
                        },
                        enabled = contributeAmount.toDoubleOrNull() != null && !state.isContributing,
                        colors = ButtonDefaults.buttonColors(containerColor = ChamaGold)
                    ) {
                        if (state.isContributing) {
                            CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp, color = Color.White)
                        } else {
                            Text("Contribute")
                        }
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showContributeDialog = false }) { Text("Cancel") }
                }
            )
        }
    }
}

@Composable
private fun WalletHeroCard(
    balance: String,
    status: String,
    type: String,
    memberCount: Int,
    cycleNumber: Int
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.horizontalGradient(
                        listOf(Color(0xFF1A1A2E), Color(0xFF16213E), Color(0xFF0F3460))
                    ),
                    shape = RoundedCornerShape(20.dp)
                )
                .padding(24.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Chama Wallet", color = Color.White.copy(alpha = 0.7f), fontSize = 14.sp)
                    StatusChip(status)
                }

                Spacer(Modifier.height(12.dp))
                Text(
                    "$balance Kr",
                    color = ChamaGold,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.ExtraBold
                )
                Spacer(Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text("Type", color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
                        Text(
                            type.lowercase().replaceFirstChar { it.uppercase() },
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Members", color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
                        Text("$memberCount", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("Cycle", color = Color.White.copy(alpha = 0.5f), fontSize = 11.sp)
                        Text("#$cycleNumber", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusChip(status: String) {
    val (color, text) = when (status) {
        "SETUP" -> Pair(Color(0xFF3498DB), "Setup")
        "ACTIVE" -> Pair(ChamaGreen, "Active")
        "PAUSED" -> Pair(ChamaGold, "Paused")
        "COMPLETED" -> Pair(Color.Gray, "Completed")
        "DISSOLVED" -> Pair(ChamaRed, "Dissolved")
        else -> Pair(Color.Gray, status)
    }
    Surface(
        color = color.copy(alpha = 0.2f),
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            color = color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun OverviewTab(state: ChamaDashboardState) {
    val chama = state.chama ?: return
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        if (chama.description != null) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                    )
                ) {
                    Column(Modifier.padding(16.dp)) {
                        Text("About", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        Spacer(Modifier.height(4.dp))
                        Text(chama.description, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }

        item {
            DetailRow("Contribution", "${chama.contributionAmountKr} Kr / ${chama.contributionFrequency.lowercase()}")
        }
        if (chama.membershipFeeKr != null) {
            item { DetailRow("Membership Fee", "${chama.membershipFeeKr} Kr") }
        }
        if (chama.penaltyAmountKr != null) {
            item { DetailRow("Late Penalty", "${chama.penaltyAmountKr} Kr") }
        }
        item { DetailRow("Grace Period", "${chama.gracePeriodDays} days") }
        item { DetailRow("Min. Approvals", "${chama.minApprovals} officials") }
        item {
            DetailRow(
                "Mid-Term Vote-Out",
                if (chama.allowMidTermVoteOut) "✅ Allowed" else "❌ Disabled"
            )
        }
        if (chama.type == "ROTATING") {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = ChamaGold.copy(alpha = 0.08f)),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Row(Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Icon(painterResource(Res.drawable.ic_lock), contentDescription = null, tint = ChamaGold, modifier = Modifier.size(20.dp))
                        Text(
                            "Wallet withdrawals are locked for all members until the rotation completes.",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
        Text(value, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
    }
}

@Composable
private fun MembersTab(state: ChamaDashboardState) {
    val members = state.chama?.members ?: emptyList()
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(members) { member ->
            MemberCard(member)
        }
    }
}

@Composable
private fun MemberCard(member: ChamaMemberDto) {
    val roleColor = when (member.role) {
        "ADMIN" -> ChamaRed
        "CHAIRPERSON" -> ChamaGold
        "TREASURER" -> ChamaGreen
        "SECRETARY" -> Color(0xFF3498DB)
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
        )
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(roleColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    member.user?.displayName?.firstOrNull()?.uppercase() ?: "?",
                    color = roleColor,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    member.user?.displayName ?: member.userId,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 15.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    "@${member.user?.username ?: ""}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                Surface(
                    color = roleColor.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        member.role.lowercase().replaceFirstChar { it.uppercase() },
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp),
                        color = roleColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                if (member.rotationNumber != null) {
                    Text("#${member.rotationNumber}", fontSize = 11.sp, color = ChamaGold)
                }
            }

            if (member.isDefaulter) {
                Icon(Icons.Default.Warning, contentDescription = "Defaulter", tint = ChamaRed, modifier = Modifier.size(18.dp))
            }
        }
    }
}

@Composable
private fun TransactionsTab(state: ChamaDashboardState) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (state.transactions.isEmpty()) {
            item {
                Box(Modifier.fillMaxWidth().padding(40.dp), contentAlignment = Alignment.Center) {
                    Text("No transactions yet", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
        items(state.transactions) { tx ->
            TransactionCard(tx)
        }
    }
}

@Composable
private fun TransactionCard(tx: ChamaTransactionDto) {
    val (icon, color) = when (tx.type) {
        "CONTRIBUTION" -> Icons.Default.ArrowDownward to ChamaGreen
        "PAYOUT" -> Icons.Default.ArrowUpward to ChamaGold
        "MEMBERSHIP_FEE" -> Icons.Default.CardMembership to Color(0xFF3498DB)
        "PENALTY" -> Icons.Default.Warning to ChamaRed
        "EXTERNAL" -> Icons.Default.Receipt to Color(0xFF9B59B6)
        else -> Icons.Default.SwapHoriz to Color.Gray
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
        )
    ) {
        Row(
            modifier = Modifier.padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.12f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(18.dp))
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    tx.type.lowercase().replace("_", " ").replaceFirstChar { it.uppercase() },
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
                if (tx.user != null) {
                    Text(tx.user.displayName, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Text(
                "${tx.amountKr} Kr",
                fontWeight = FontWeight.Bold,
                color = if (tx.type == "CONTRIBUTION" || tx.type == "MEMBERSHIP_FEE") ChamaGreen else ChamaGold,
                fontSize = 14.sp
            )
        }
    }
}

@Composable
private fun ElectionsTab(state: ChamaDashboardState, onNavigateToElection: (String) -> Unit) {
    if (state.activeElections.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize().padding(40.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    Icons.Default.HowToVote,
                    contentDescription = null,
                    tint = ChamaGold,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(Modifier.height(12.dp))
                Text("Elections", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(
                    "No active elections right now.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(vertical = 16.dp, horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(state.activeElections) { election ->
            ElectionCard(
                election = election,
                onViewDetails = { onNavigateToElection(election.id) }
            )
        }
    }
}

@Composable
private fun ElectionCard(
    election: com.krieta.feature.chama.data.remote.dto.ChamaElectionDto,
    onViewDetails: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Election for ${election.position}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Surface(
                    color = when (election.phase) {
                        "NOMINATION" -> ChamaGold.copy(alpha = 0.2f)
                        "VOTING" -> ChamaGreen.copy(alpha = 0.2f)
                        else -> MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                    },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        election.phase,
                        color = when (election.phase) {
                            "NOMINATION" -> ChamaGold
                            "VOTING" -> ChamaGreen
                            else -> MaterialTheme.colorScheme.primary
                        },
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            if (election.isMidTerm) {
                Text(
                    "Mid-term Replacement",
                    color = ChamaGold,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }

            Spacer(Modifier.height(16.dp))

            if (election.nominations.isNotEmpty()) {
                Text("Candidates", fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(bottom = 8.dp))
                election.nominations.forEach { nomination ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(nomination.nominee?.displayName ?: "Unknown", fontSize = 14.sp)
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("${nomination.secondsCount} Seconds", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            if (election.phase == "VOTING") {
                                Text("${nomination._count?.votes ?: 0} Votes", fontSize = 12.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            } else {
                Text("No nominations yet.", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }

            Spacer(Modifier.height(16.dp))

            Button(
                onClick = onViewDetails,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("View Details")
            }
        }
    }
}

@Composable
private fun CyclesTab(state: ChamaDashboardState) {
    if (state.cycles.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize().padding(40.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    Icons.Default.Autorenew,
                    contentDescription = null,
                    tint = ChamaGold,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(Modifier.height(12.dp))
                Text("Merry-Go-Round", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(
                    "No cycles started yet. Officials can open the first cycle.",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
        return
    }

    LazyColumn(
        contentPadding = PaddingValues(vertical = 16.dp, horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(state.cycles) { cycle ->
            CycleCard(cycle)
        }
    }
}

@Composable
private fun CycleCard(cycle: com.krieta.feature.chama.data.remote.dto.ChamaCycleDto) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Cycle #${cycle.cycleNumber}",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp
                )
                Surface(
                    color = when (cycle.status) {
                        "OPEN", "COLLECTING" -> ChamaGold.copy(alpha = 0.2f)
                        "DISBURSING" -> Color(0xFF3498DB).copy(alpha = 0.2f)
                        "COMPLETED" -> ChamaGreen.copy(alpha = 0.2f)
                        else -> MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                    },
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        cycle.status,
                        color = when (cycle.status) {
                            "OPEN", "COLLECTING" -> ChamaGold
                            "DISBURSING" -> Color(0xFF3498DB)
                            "COMPLETED" -> ChamaGreen
                            else -> MaterialTheme.colorScheme.primary
                        },
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Recipient", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(cycle.recipientId ?: "Pending", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Target", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("${cycle.targetAmountKr} Kr", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = ChamaGold)
                }
            }

            Spacer(Modifier.height(12.dp))

            val progress = try {
                val collected = cycle.collectedAmountKr.toDoubleOrNull() ?: 0.0
                val target = cycle.targetAmountKr.toDoubleOrNull() ?: 1.0
                (collected / target).toFloat().coerceIn(0f, 1f)
            } catch (e: Exception) {
                0f
            }

            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Collected", fontSize = 12.sp)
                    Text("${cycle.collectedAmountKr} Kr", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.height(4.dp))
                LinearProgressIndicator(
                    progress = { progress },
                    modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                    color = ChamaGreen,
                    trackColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f)
                )
            }

            Spacer(Modifier.height(16.dp))
            
            Text(
                "Ends on: ${cycle.endDate.take(10)}",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
