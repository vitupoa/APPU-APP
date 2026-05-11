package com.krieta.feature.live.presentation.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import com.krieta.com.core.theme.KrietaColors
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*

class StartLiveScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        var showLiveTypeSheet by remember { mutableStateOf(false) }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Start Live Stream") },
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
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    "Choose Live Type",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = KrietaColors.OnSurface
                )
                Spacer(modifier = Modifier.height(32.dp))

                LiveTypeCard(
                    title = "Go Live",
                    description = "Start a normal live stream",
                    emoji = "📹",
                    color = Color(0xFFE53935)
                ) {
                    navigator.push(HostLiveScreen(liveType = LiveType.NORMAL))
                }

                Spacer(modifier = Modifier.height(16.dp))

                LiveTypeCard(
                    title = "Sell",
                    description = "Sell products in live stream",
                    emoji = "🛍️",
                    color = Color(0xFF43A047)
                ) {
                    showLiveTypeSheet = true
                }

                Spacer(modifier = Modifier.height(16.dp))

                LiveTypeCard(
                    title = "Battle/PK",
                    description = "Compete with another creator",
                    emoji = "⚔️",
                    color = Color(0xFFFF6F00)
                ) {
                    navigator.push(HostLiveScreen(liveType = LiveType.BATTLE))
                }

                Spacer(modifier = Modifier.height(16.dp))

                LiveTypeCard(
                    title = "Multi-Guest",
                    description = "Go live with up to 5 guests",
                    emoji = "👥",
                    color = Color(0xFF7B1FA2)
                ) {
                    navigator.push(HostLiveScreen(liveType = LiveType.MULTI_GUEST))
                }
            }
        }

        if (showLiveTypeSheet) {
            SelectProductSheet(
                onDismiss = { showLiveTypeSheet = false },
                onProductSelected = { productId ->
                    navigator.push(HostLiveScreen(liveType = LiveType.COMMERCE, productId = productId))
                    showLiveTypeSheet = false
                }
            )
        }
    }

    @Composable
    private fun LiveTypeCard(
        title: String,
        description: String,
        emoji: String,
        color: Color,
        onClick: () -> Unit
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onClick() },
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = KrietaColors.BackgroundElevated
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .background(color.copy(alpha = 0.15f), RoundedCornerShape(12.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(emoji, fontSize = 32.sp)
                }
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(
                        title,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = KrietaColors.OnSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        description,
                        fontSize = 14.sp,
                        color = KrietaColors.OnSurfaceVariant
                    )
                }
            }
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    private fun SelectProductSheet(
        onDismiss: () -> Unit,
        onProductSelected: (String) -> Unit
    ) {
        val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
        var selectedProductId by remember { mutableStateOf<String?>(null) }

        // Mock products - replace with actual data
        val mockProducts = listOf(
            MockProduct("1", "iPhone 15 Pro", 150000.0, "https://example.com/iphone.jpg"),
            MockProduct("2", "Nike Air Max", 12000.0, "https://example.com/nike.jpg"),
            MockProduct("3", "MacBook Pro", 250000.0, "https://example.com/macbook.jpg")
        )

        ModalBottomSheet(
            onDismissRequest = onDismiss,
            sheetState = sheetState,
            containerColor = KrietaColors.BackgroundElevated,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
            ) {
                Text(
                    "Select Product to Sell",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = KrietaColors.OnSurface
                )
                Spacer(modifier = Modifier.height(16.dp))

                mockProducts.forEach { product ->
                    ProductCard(
                        product = product,
                        isSelected = selectedProductId == product.id,
                        onClick = { selectedProductId = product.id }
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        selectedProductId?.let { onProductSelected(it) }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = selectedProductId != null,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = KrietaColors.Primary
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Start Live with Product", modifier = Modifier.padding(8.dp))
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }

    @Composable
    private fun ProductCard(
        product: MockProduct,
        isSelected: Boolean,
        onClick: () -> Unit
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onClick() },
            shape = RoundedCornerShape(12.dp),
            colors = CardDefaults.cardColors(
                containerColor = if (isSelected) KrietaColors.PrimaryContainer else KrietaColors.Background
            ),
            border = if (isSelected) androidx.compose.foundation.BorderStroke(2.dp, KrietaColors.Primary) else null
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(50.dp)
                        .background(Color.Gray.copy(alpha = 0.3f), RoundedCornerShape(8.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("📦", fontSize = 24.sp)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        product.name,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Medium,
                        color = KrietaColors.OnSurface
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        "${product.price} Kr",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = KrietaColors.Primary
                    )
                }
                if (isSelected) {
                    Icon(
                        painterResource(Res.drawable.ic_check),
                        contentDescription = "Selected",
                        tint = KrietaColors.Primary
                    )
                }
            }
        }
    }

    private data class MockProduct(
        val id: String,
        val name: String,
        val price: Double,
        val imageUrl: String
    )
}
