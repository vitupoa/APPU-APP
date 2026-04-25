package com.krieta.feature.chama.presentation.defaulters

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors

class DefaultersListScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("List of Shame") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.Default.ArrowBack, "Back")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = KrietaColors.BackgroundElevated
                    )
                )
            }
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = KrietaColors.Error.copy(alpha = 0.1f)
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = KrietaColors.Error
                            )
                            Column {
                                Text(
                                    "Public Defaulter Registry",
                                    fontWeight = FontWeight.Bold,
                                    color = KrietaColors.Error
                                )
                                Text(
                                    "Members who failed to meet their Chama obligations",
                                    fontSize = 12.sp,
                                    color = KrietaColors.OnSurfaceVariant
                                )
                            }
                        }
                    }
                }

                // TODO: Load actual defaulters from API
                items(emptyList<String>()) { defaulter ->
                    DefaulterCard(defaulter)
                }

                item {
                    if (true) { // Empty state
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 48.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text(
                                    "🎉",
                                    fontSize = 48.sp
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Text(
                                    "No defaulters found!",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    "All members are in good standing",
                                    fontSize = 14.sp,
                                    color = KrietaColors.OnSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DefaulterCard(defaulter: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = KrietaColors.BackgroundElevated
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar placeholder
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .then(Modifier)
            )

            Column(modifier = Modifier.weight(1f)) {
                Text("User Name", fontWeight = FontWeight.Bold)
                Text(
                    "Chama Name",
                    fontSize = 12.sp,
                    color = KrietaColors.OnSurfaceVariant
                )
                Text(
                    "Owes: 1000 Kr",
                    fontSize = 14.sp,
                    color = KrietaColors.Error,
                    fontWeight = FontWeight.Bold
                )
            }

            Icon(
                Icons.Default.Warning,
                contentDescription = null,
                tint = KrietaColors.Error
            )
        }
    }
}
