package com.runinga.feature.sponsored.presentation.screen
import com.runinga.com.core.util.SafeConversion
import com.runinga.com.core.util.currentTimeMillis
import com.runinga.com.core.util.formatString
import androidx.compose.foundation.shape.CircleShape
import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.runinga.feature.sponsored.domain.model.CreateSponsoredCampaignRequest
import com.runinga.feature.sponsored.domain.model.SponsoredTargeting
import com.runinga.feature.sponsored.data.remote.SponsoredApi
import kotlinx.coroutines.launch
import org.koin.compose.koinInject

class CreateCampaignScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val api = koinInject<SponsoredApi>()
        val currencyProvider = koinInject<com.runinga.com.core.location.UserCurrencyProvider>()
        val scope = rememberCoroutineScope()
        
        val exchangeRate by currencyProvider.exchangeRate.collectAsState()
        val currencyCode = currencyProvider.currencyCode
        
        LaunchedEffect(Unit) {
            currencyProvider.start()
        }
        
        var campaignName by remember { mutableStateOf("") }
        var contentType by remember { mutableStateOf("short") }
        var contentId by remember { mutableStateOf("") }
        var budgetFiat by remember { mutableStateOf("") }
        var pricingModel by remember { mutableStateOf("CPM") }
        var bidAmountFiat by remember { mutableStateOf("") }
        var ageMin by remember { mutableStateOf("") }
        var ageMax by remember { mutableStateOf("") }
        var isCreating by remember { mutableStateOf(false) }
        var errorMessage by remember { mutableStateOf<String?>(null) }
        
        // Calculate KR values in real-time
        val budgetRc = remember(budgetFiat, exchangeRate) {
            budgetFiat.toDoubleOrNull()?.let { 
                com.runinga.com.core.util.KrCurrencyFormatter.fiatToKr(it, exchangeRate?.baseRate ?: 0.0) 
            } ?: 0.0
        }
        val bidAmountRc = remember(bidAmountFiat, exchangeRate) {
            bidAmountFiat.toDoubleOrNull()?.let { 
                com.runinga.com.core.util.KrCurrencyFormatter.fiatToKr(it, exchangeRate?.baseRate ?: 0.0) 
            } ?: 0.0
        }
        
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Create Campaign", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = campaignName,
                    onValueChange = { campaignName = it },
                    label = { Text("Campaign Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Text("Content Type", fontWeight = FontWeight.SemiBold)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = contentType == "short",
                        onClick = { contentType = "short" },
                        label = { Text("Short") }
                    )
                    FilterChip(
                        selected = contentType == "post",
                        onClick = { contentType = "post" },
                        label = { Text("Post") }
                    )
                }
                
                OutlinedTextField(
                    value = contentId,
                    onValueChange = { contentId = it },
                    label = { Text("Content ID") },
                    modifier = Modifier.fillMaxWidth(),
                    supportingText = { Text("ID of the short/post to promote") }
                )
                
                OutlinedTextField(
                    value = budgetFiat,
                    onValueChange = { budgetFiat = it },
                    label = { Text("Budget ($currencyCode)") },
                    modifier = Modifier.fillMaxWidth(),
                    supportingText = {
                        Text(
                            "≈ ${formatString("%.2f", budgetKr)} KR",
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                )
                
                Text("Pricing Model", fontWeight = FontWeight.SemiBold)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("CPM", "CPV", "CPE", "CPC").forEach { model ->
                        FilterChip(
                            selected = pricingModel == model,
                            onClick = { pricingModel = model },
                            label = { Text(model) }
                        )
                    }
                }
                
                OutlinedTextField(
                    value = bidAmountFiat,
                    onValueChange = { bidAmountFiat = it },
                    label = { Text("Bid Amount ($currencyCode)") },
                    modifier = Modifier.fillMaxWidth(),
                    supportingText = { 
                        Column {
                            Text(
                                "≈ ${formatString("%.4f", bidAmountKr)} KR",
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(when (pricingModel) {
                                "CPM" -> "Cost per 1000 impressions"
                                "CPV" -> "Cost per view (3+ seconds)"
                                "CPE" -> "Cost per engagement"
                                "CPC" -> "Cost per click"
                                else -> ""
                            })
                        }
                    }
                )
                
                Text("Targeting (Optional)", fontWeight = FontWeight.SemiBold)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = ageMin,
                        onValueChange = { ageMin = it },
                        label = { Text("Min Age") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = ageMax,
                        onValueChange = { ageMax = it },
                        label = { Text("Max Age") },
                        modifier = Modifier.weight(1f)
                    )
                }
                
                errorMessage?.let {
                    Text(it, color = MaterialTheme.colorScheme.error)
                }
                
                Button(
                    onClick = {
                        scope.launch {
                            isCreating = true
                            errorMessage = null
                            try {
                                val request = CreateSponsoredCampaignRequest(
                                    contentType = com.runinga.feature.sponsored.domain.model.SponsoredContentType.valueOf(contentType.uppercase()),
                                    contentId = contentId,
                                    campaignName = campaignName,
                                    budget = budgetKr,
                                    pricingModel = com.runinga.feature.sponsored.domain.model.PricingModel.valueOf(pricingModel),
                                    bidAmount = bidAmountKr,
                                    startDate = currentTimeMillis().toString(),
                                    endDate = (currentTimeMillis() + 30L * 24 * 60 * 60 * 1000).toString(),
                                    targeting = SponsoredTargeting(
                                        ageMin = ageMin.toIntOrNull(),
                                        ageMax = ageMax.toIntOrNull()
                                    )
                                )
                                api.createCampaign(request)
                                navigator.pop()
                            } catch (e: Exception) {
                                errorMessage = e.message ?: "Failed to create campaign"
                            } finally {
                                isCreating = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isCreating && campaignName.isNotBlank() && contentId.isNotBlank() && budgetFiat.isNotBlank() && bidAmountFiat.isNotBlank()
                ) {
                    if (isCreating) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp))
                    } else {
                        Text("Create Campaign")
                    }
                }
            }
        }
    }
}
