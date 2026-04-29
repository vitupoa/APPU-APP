package com.krieta.feature.auth.presentation.screen

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.feature.auth.presentation.viewmodel.RegisterState
import com.krieta.feature.auth.presentation.viewmodel.RegisterViewModel

class RegisterScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<RegisterViewModel>()
        
        val registerState by viewModel.registerState.collectAsState()
        
        val accountType by viewModel.accountType.collectAsState()
        val firstName by viewModel.firstName.collectAsState()
        val lastName by viewModel.lastName.collectAsState()
        val username by viewModel.username.collectAsState()
        val email by viewModel.email.collectAsState()
        val password by viewModel.password.collectAsState()

        LaunchedEffect(registerState) {
            if (registerState is RegisterState.Success) {
                navigator.replaceAll(com.krieta.com.core.navigation.MainScreen())
            }
        }
        
        var passwordVisible by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Sign Up") },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.background
                    )
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .imePadding()
                    .padding(horizontal = 24.dp)
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(16.dp))
                
                // WARNING BANNER
                Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(painter = painterResource(Res.drawable.ic_warning), contentDescription = "Warning", tint = MaterialTheme.colorScheme.onErrorContainer)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "Account Type, Name, and Username are permanently locked once your wallet is activated.",
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Text("Select Account Type", style = MaterialTheme.typography.titleMedium, modifier = Modifier.align(Alignment.Start))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    AccountTypeButton(
                        text = "Creator", 
                        selected = accountType == "CREATOR", 
                        onClick = { viewModel.accountType.value = "CREATOR" },
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    AccountTypeButton(
                        text = "Business", 
                        selected = accountType == "BUSINESS", 
                        onClick = { viewModel.accountType.value = "BUSINESS" },
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = firstName,
                    onValueChange = { viewModel.firstName.value = it },
                    label = { Text("Legal First Name") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(12.dp))
                
                OutlinedTextField(
                    value = lastName,
                    onValueChange = { viewModel.lastName.value = it },
                    label = { Text("Legal Last Name") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = username,
                    onValueChange = { viewModel.username.value = it },
                    label = { Text("Username") },
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { viewModel.email.value = it },
                    label = { Text("Email Address") },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Email)
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { viewModel.password.value = it },
                    label = { Text("Password") },
                    modifier = Modifier.fillMaxWidth(),
                    visualTransformation = if (passwordVisible) androidx.compose.ui.text.input.VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        val icon = if (passwordVisible) "Hide" else "Show"
                        TextButton(onClick = { passwordVisible = !passwordVisible }) {
                            Text(icon, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
                        }
                    }
                )

                Spacer(modifier = Modifier.height(32.dp))

                Button(
                    onClick = { viewModel.register() },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    enabled = registerState !is RegisterState.Loading
                ) {
                    if (registerState is RegisterState.Loading) {
                        CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary, modifier = Modifier.size(24.dp))
                    } else {
                        Text("Create Account", fontSize = 16.sp)
                    }
                }
                
                if (registerState is RegisterState.Error) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text((registerState as RegisterState.Error).message, color = MaterialTheme.colorScheme.error)
                }

                Spacer(modifier = Modifier.height(24.dp))

                TextButton(onClick = { navigator.replaceAll(LoginScreen()) }) {
                    Text("Already have an account? Sign In")
                }

                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }

    @Composable
    private fun AccountTypeButton(text: String, selected: Boolean, onClick: () -> Unit, modifier: Modifier = Modifier) {
        val colors = if (selected) {
            ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
        } else {
            ButtonDefaults.outlinedButtonColors()
        }
        
        if (selected) {
            Button(onClick = onClick, shape = RoundedCornerShape(8.dp), modifier = modifier, colors = colors) {
                Text(text, fontSize = 12.sp)
            }
        } else {
            OutlinedButton(onClick = onClick, shape = RoundedCornerShape(8.dp), modifier = modifier, colors = colors) {
                Text(text, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurface)
            }
        }
    }
}


