package com.krieta.feature.sponsored.presentation.screen
import com.krieta.com.core.util.SafeConversion
import com.krieta.com.core.util.currentTimeMillis
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.shape.CircleShape
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
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
import com.krieta.feature.sponsored.domain.model.CreateSponsoredCampaignRequest
import com.krieta.feature.sponsored.domain.model.SponsoredTargeting
import com.krieta.feature.sponsored.data.remote.SponsoredApi
import kotlinx.coroutines.launch
import org.koin.compose.koinInject

class CreateCampaignScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val api = koinInject<SponsoredApi>()
        val scope = rememberCoroutineScope()
        
        var campaignName by remember { mutableStateOf("") }
        var contentType by remember { mutableStateOf("short") }
        var contentId by remember { mutableStateOf("") }
        var budget by remember { mutableStateOf("") }
        var pricingModel by remember { mutableStateOf("CPM") }
        var bidAmount by remember { mutableStateOf("") }
        var ageMin by remember { mutableStateOf("") }
        var ageMax by remember { mutableStateOf("") }
        var isCreating by remember { mutableStateOf(false) }
        var errorMessage by remember { mutableStateOf<String?>(null) }
        
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
                    value = budget,
                    onValueChange = { budget = it },
                    label = { Text("Budget (KR)") },
                    modifier = Modifier.fillMaxWidth()
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
                    value = bidAmount,
                    onValueChange = { bidAmount = it },
                    label = { Text("Bid Amount (KR)") },
                    modifier = Modifier.fillMaxWidth(),
                    supportingText = { 
                        Text(when (pricingModel) {
                            "CPM" -> "Cost per 1000 impressions"
                            "CPV" -> "Cost per view (3+ seconds)"
                            "CPE" -> "Cost per engagement"
                            "CPC" -> "Cost per click"
                            else -> ""
                        })
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
                                    contentType = com.krieta.feature.sponsored.domain.model.SponsoredContentType.valueOf(contentType.uppercase()),
                                    contentId = contentId,
                                    campaignName = campaignName,
                                    budget = SafeConversion.toDoubleOrDefaultWithValidation(budget, "campaignBudget", 0.0, defaultValue = 0.0),
                                    pricingModel = com.krieta.feature.sponsored.domain.model.PricingModel.valueOf(pricingModel),
                                    bidAmount = SafeConversion.toDoubleOrDefaultWithValidation(bidAmount, "bidAmount", 0.0, defaultValue = 0.0),
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
                    enabled = !isCreating && campaignName.isNotBlank() && contentId.isNotBlank() && budget.isNotBlank() && bidAmount.isNotBlank()
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
