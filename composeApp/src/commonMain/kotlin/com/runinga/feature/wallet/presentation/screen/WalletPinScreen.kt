package com.runinga.feature.wallet.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import runinga.composeapp.generated.resources.Res
import runinga.composeapp.generated.resources.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape

import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.runinga.com.core.theme.GlassmorphicContainer
import com.runinga.com.core.theme.bounceClick
import com.runinga.com.core.theme.RuningaColors

/**
 * High-Security 6-Digit PIN Screen automatically triggered upon interacting with Wallet mechanics natively!
 */
class WalletPinScreen(private val isSetup: Boolean = false) : Screen {

    @Composable
    override fun Content() {
        var pinInput by remember { mutableStateOf("") }
        val navigator = LocalNavigator.currentOrThrow

        Box(
            modifier = Modifier.fillMaxSize().background(RuningaColors.Background),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(32.dp)
            ) {
                Text(
                    text = if (isSetup) "Set your 6-Digit PIN" else "Enter Wallet PIN",
                    style = MaterialTheme.typography.headlineLarge,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Protect your Rc and Fiat balances.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.6f)
                )

                Spacer(modifier = Modifier.height(48.dp))

                // The 6-Dot Indicator natively routing UI Feedback smoothly
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    for (i in 0 until 6) {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .clip(CircleShape)
                                .background(if (i < pinInput.length) RuningaColors.Primary else Color.White.copy(alpha = 0.2f))
                        )
                    }
                }

                Spacer(modifier = Modifier.height(64.dp))

                // Numeric Keypad generated structurally mapping bounce clicks organically!
                val keypadRows = listOf(
                    listOf("1", "2", "3"),
                    listOf("4", "5", "6"),
                    listOf("7", "8", "9"),
                    listOf("", "0", "DEL")
                )

                GlassmorphicContainer(alpha = 0.1f, shape = RoundedCornerShape(32.dp)) {
                    Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        keypadRows.forEach { row ->
                            Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
                                row.forEach { key ->
                                    if (key.isEmpty()) {
                                        Spacer(modifier = Modifier.size(70.dp))
                                    } else {
                                        Box(
                                            contentAlignment = Alignment.Center,
                                            modifier = Modifier
                                                .size(70.dp)
                                                .bounceClick {
                                                    if (key == "DEL") {
                                                        if (pinInput.isNotEmpty()) pinInput = pinInput.dropLast(1)
                                                    } else {
                                                        if (pinInput.length < 6) {
                                                            pinInput += key
                                                            // Auto-Submit upon hitting 6 implicitly!
                                                            if(pinInput.length == 6) {
                                                                // In Production: Dispatch to ViewModel -> API verify
                                                                navigator.pop() 
                                                            }
                                                        }
                                                    }
                                                }
                                                .background(Color.White.copy(alpha = 0.05f), CircleShape)
                                        ) {
                                            if (key == "DEL") {
                                                Icon(painterResource(Res.drawable.ic_backspace), contentDescription = "Delete", tint = Color.White)
                                            } else {
                                                Text(key, color = Color.White, style = MaterialTheme.typography.headlineLarge)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
