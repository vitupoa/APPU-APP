package com.krieta.feature.wallet.presentation.withdraw
import com.krieta.com.core.util.SafeConversion
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.getScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*

class WithdrawScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = getScreenModel<WithdrawViewModel>()
        val state by viewModel.state.collectAsState()
        
        LaunchedEffect(state.successMessage) {
            state.successMessage?.let {
                viewModel.clearMessages()
                navigator.pop()
            }
        }
        
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Withdraw Funds") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
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
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = KrietaColors.Primary.copy(alpha = 0.1f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "Available Balance",
                            fontSize = 14.sp,
                            color = KrietaColors.OnSurfaceVariant
                        )
                        Text(
                            "${state.availableBalance} Kr",
                            fontSize = 32.sp,
                            fontWeight = FontWeight.Bold,
                            color = KrietaColors.Primary
                        )
                    }
                }
                
                Text("Select Provider", fontWeight = FontWeight.Bold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ProviderChip(
                        label = "M-Pesa",
                        selected = state.provider == "mpesa",
                        onClick = { viewModel.setProvider("mpesa") },
                        modifier = Modifier.weight(1f)
                    )
                    ProviderChip(
                        label = "PayPal",
                        selected = state.provider == "paypal",
                        onClick = { viewModel.setProvider("paypal") },
                        modifier = Modifier.weight(1f)
                    )
                    ProviderChip(
                        label = "Paystack",
                        selected = state.provider == "paystack",
                        onClick = { viewModel.setProvider("paystack") },
                        modifier = Modifier.weight(1f)
                    )
                }
                
                OutlinedTextField(
                    value = state.amount,
                    onValueChange = { viewModel.setAmount(it) },
                    label = { Text("Amount (Kr)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                when (state.provider) {
                    "mpesa" -> {
                        OutlinedTextField(
                            value = state.phoneNumber,
                            onValueChange = { viewModel.setPhoneNumber(it) },
                            label = { Text("M-Pesa Phone Number") },
                            placeholder = { Text("254712345678") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    "paypal" -> {
                        OutlinedTextField(
                            value = state.email,
                            onValueChange = { viewModel.setEmail(it) },
                            label = { Text("PayPal Email") },
                            placeholder = { Text("user@example.com") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                    }
                    "paystack" -> {
                        var countryExpanded by remember { mutableStateOf(false) }
                        ExposedDropdownMenuBox(
                            expanded = countryExpanded,
                            onExpandedChange = { countryExpanded = it }
                        ) {
                            OutlinedTextField(
                                value = state.countries.find { it.code == state.country }?.name ?: "",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Select Country") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(countryExpanded) },
                                modifier = Modifier.fillMaxWidth().menuAnchor()
                            )
                            ExposedDropdownMenu(
                                expanded = countryExpanded,
                                onDismissRequest = { countryExpanded = false }
                            ) {
                                state.countries.forEach { country ->
                                    DropdownMenuItem(
                                        text = { 
                                            Column {
                                                Text(country.name)
                                                Text(
                                                    country.currency,
                                                    fontSize = 12.sp,
                                                    color = KrietaColors.OnSurfaceVariant
                                                )
                                            }
                                        },
                                        onClick = {
                                            viewModel.setCountry(country.code)
                                            countryExpanded = false
                                        }
                                    )
                                }
                            }
                        }
                        
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        var expanded by remember { mutableStateOf(false) }
                        ExposedDropdownMenuBox(
                            expanded = expanded,
                            onExpandedChange = { expanded = it }
                        ) {
                            OutlinedTextField(
                                value = state.banks.find { it.code == state.bankCode }?.name ?: "",
                                onValueChange = {},
                                readOnly = true,
                                label = { Text("Select Bank") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                                modifier = Modifier.fillMaxWidth().menuAnchor(),
                                enabled = state.banks.isNotEmpty()
                            )
                            ExposedDropdownMenu(
                                expanded = expanded,
                                onDismissRequest = { expanded = false }
                            ) {
                                state.banks.forEach { bank ->
                                    DropdownMenuItem(
                                        text = { Text(bank.name) },
                                        onClick = {
                                            viewModel.setBankCode(bank.code)
                                            expanded = false
                                        }
                                    )
                                }
                            }
                        }
                        
                        OutlinedTextField(
                            value = state.accountNumber,
                            onValueChange = { viewModel.setAccountNumber(it) },
                            label = { Text("Account Number") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true
                        )
                        
                        if (state.accountNumber.isNotEmpty() && state.bankCode.isNotEmpty()) {
                            Button(
                                onClick = { viewModel.verifyAccount() },
                                enabled = !state.isVerifying,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                if (state.isVerifying) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(20.dp),
                                        color = MaterialTheme.colorScheme.onPrimary
                                    )
                                } else {
                                    Text("Verify Account")
                                }
                            }
                        }
                        
                        state.verifiedAccountName?.let { name ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = KrietaColors.Success.copy(alpha = 0.1f)
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        painterResource(Res.drawable.ic_check),
                                        contentDescription = null,
                                        tint = KrietaColors.Success
                                    )
                                    Column {
                                        Text(
                                            "Account Verified",
                                            fontSize = 12.sp,
                                            color = KrietaColors.Success
                                        )
                                        Text(
                                            name,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                        
                        if (state.country == "KE" && state.accountNumber.isNotEmpty()) {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(
                                    containerColor = KrietaColors.Warning.copy(alpha = 0.1f)
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(16.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Icon(
                                        painterResource(Res.drawable.ic_info),
                                        contentDescription = null,
                                        tint = KrietaColors.Warning
                                    )
                                    Text(
                                        "Account verification not available for Kenya. Please ensure account details are correct.",
                                        fontSize = 12.sp,
                                        color = KrietaColors.OnSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }
                
                state.error?.let { error ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = KrietaColors.Error.copy(alpha = 0.1f)
                        )
                    ) {
                        Text(
                            error,
                            modifier = Modifier.padding(16.dp),
                            color = KrietaColors.Error
                        )
                    }
                }
                
                Button(
                    onClick = { viewModel.withdraw() },
                    enabled = !state.isSubmitting && canWithdraw(state),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (state.isSubmitting) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Withdraw")
                    }
                }
            }
        }
    }
    
    private fun canWithdraw(state: WithdrawState): Boolean {
        val amount = SafeConversion.toDoubleOrDefaultWithValidation(state.amount, "withdrawAmount", 0.0, defaultValue = 0.0)
        if (amount <= 0 || amount > state.availableBalance) return false
        
        return when (state.provider) {
            "mpesa" -> state.phoneNumber.isNotEmpty()
            "paypal" -> state.email.isNotEmpty()
            "paystack" -> state.accountNumber.isNotEmpty() && 
                         state.bankCode.isNotEmpty() && 
                         state.verifiedAccountName != null
            else -> false
        }
    }
}

@Composable
private fun ProviderChip(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    FilterChip(
        selected = selected,
        onClick = onClick,
        label = { Text(label) },
        modifier = modifier
    )
}
