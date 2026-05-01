package com.krieta.feature.chama.presentation.contribute
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import org.koin.core.parameter.parametersOf

data class ChamaContributeScreen(val chamaId: String, val chamaName: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ChamaContributeViewModel> { parametersOf(chamaId) }
        val state by viewModel.state.collectAsState()
        var amount by remember { mutableStateOf("") }

        val snackbarHostState = remember { SnackbarHostState() }
        
        LaunchedEffect(state.error, state.successMessage) {
            val msg = state.successMessage ?: state.error
            if (msg != null) {
                snackbarHostState.showSnackbar(msg)
                if (state.successMessage != null) {
                    kotlinx.coroutines.delay(1500)
                    navigator.pop()
                }
                viewModel.clearMessages()
            }
        }

        Scaffold(
            snackbarHost = { SnackbarHost(snackbarHostState) },
            topBar = {
                TopAppBar(
                    title = { Text("Contribute to $chamaName") },
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
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Current Balance",
                            fontSize = 14.sp,
                            color = KrietaColors.OnSurfaceVariant
                        )
                        Text(
                            "${state.chamaBalance} Kr",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = KrietaColors.Primary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount (Kr)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Enter amount") }
                )

                Spacer(modifier = Modifier.weight(1f))

                Button(
                    onClick = {
                        val amountValue = amount.toDoubleOrNull()
                        if (amountValue != null && amountValue > 0) {
                            viewModel.contribute(amountValue)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    enabled = !state.isLoading && amount.toDoubleOrNull() != null && amount.toDoubleOrNull()!! > 0,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = KrietaColors.Primary
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (state.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = KrietaColors.OnPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text("Contribute", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
