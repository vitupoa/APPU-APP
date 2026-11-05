package com.runinga.feature.feed.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import androidx.compose.foundation.layout.*

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow

import cafe.adriel.voyager.koin.koinScreenModel
import com.runinga.feature.feed.presentation.viewmodel.CreatePostViewModel
import io.github.vinceglb.filekit.compose.rememberFilePickerLauncher
import io.github.vinceglb.filekit.core.PickerType
import io.github.vinceglb.filekit.core.PickerMode
import kotlinx.coroutines.launch

class CreatePostScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<CreatePostViewModel>()
        val state by viewModel.state.collectAsState()
        val currencyProvider = org.koin.compose.koinInject<com.runinga.com.core.location.UserCurrencyProvider>()
        val exchangeRate by currencyProvider.exchangeRate.collectAsState()

        LaunchedEffect(Unit) {
            currencyProvider.start()
        }

        LaunchedEffect(state.success) {
            if (state.success) navigator.pop()
        }

        val scope = rememberCoroutineScope()
        
        val launcher = rememberFilePickerLauncher(
            type = PickerType.Image,
            mode = PickerMode.Multiple()
        ) { files ->
            files?.forEach { file ->
                viewModel.addImage(file)
            }
        }

        Scaffold(
            topBar = {
                CenterAlignedTopAppBar(
                    title = { Text("New Drip", fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), contentDescription = "Back")
                        }
                    },
                    actions = {
                        TextButton(onClick = { viewModel.post() }, enabled = !state.isPosting) {
                            Text("Post", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                OutlinedTextField(
                    value = state.caption,
                    onValueChange = { viewModel.updateCaption(it) },
                    placeholder = { Text("What's on your mind?") },
                    modifier = Modifier.fillMaxWidth().height(150.dp),
                    visualTransformation = com.runinga.com.core.ui.components.HashtagVisualTransformation(MaterialTheme.colorScheme.primary)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(onClick = { launcher.launch() }, modifier = Modifier.fillMaxWidth()) {
                    Text("Add Images")
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Display selected images preview count or error
                if (state.imageFiles.isNotEmpty()) {
                    Text("${state.imageFiles.size} images selected", fontWeight = FontWeight.Bold)
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Lock content section
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Lock this content", fontWeight = FontWeight.Bold)
                                Text(
                                    "Viewers must pay or subscribe to unlock",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Switch(
                                checked = state.isLocked,
                                onCheckedChange = { viewModel.toggleLock(it) }
                            )
                        }

                        if (state.isLocked) {
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            OutlinedTextField(
                                value = state.unlockPriceLocal,
                                onValueChange = { 
                                    viewModel.updateUnlockPrice(it, exchangeRate?.baseRate)
                                },
                                label = { Text("Unlock Price (${currencyProvider.currencyCode})") },
                                placeholder = { Text("Enter amount") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                                    keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal
                                )
                            )

                            // Show Rc conversion
                            if (state.unlockPriceRc != null) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    "≈ ${com.runinga.com.core.util.KrCurrencyFormatter.formatKr(state.unlockPriceKr!!)}",
                                    fontSize = 14.sp,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                if (state.isPosting) {
                    CircularProgressIndicator(modifier = Modifier.padding(top = 16.dp))
                }

                state.error?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 16.dp))
                }
            }
        }
    }
}
