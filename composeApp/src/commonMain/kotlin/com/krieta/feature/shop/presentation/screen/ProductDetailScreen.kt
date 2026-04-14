package com.krieta.feature.shop.presentation.screen

import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState


import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.shop.presentation.viewmodel.ProductDetailViewModel
import io.ktor.http.encodeURLParameter
import org.koin.core.parameter.parametersOf

class ProductDetailScreen(private val productId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val uriHandler = LocalUriHandler.current
        val viewModel = koinScreenModel<ProductDetailViewModel>(parameters = { parametersOf(productId) })
        val state by viewModel.state.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Product") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back")
                        }
                    }
                )
            }
        ) { padding ->
            when {
                state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
                state.error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(state.error!!, color = MaterialTheme.colorScheme.error)
                }
                state.product != null -> {
                    val product = state.product!!

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(padding)
                            .verticalScroll(rememberScrollState())
                    ) {
                        // Image carousel
                        if (product.imageUrls.isNotEmpty()) {
                            val pagerState = rememberPagerState(pageCount = { product.imageUrls.size })
                            Box(modifier = Modifier.fillMaxWidth().height(300.dp)) {
                                HorizontalPager(
                                    state = pagerState,
                                    modifier = Modifier.fillMaxSize()
                                ) { page ->
                                    AsyncImage(
                                        model = product.imageUrls[page],
                                        contentDescription = "${product.title} image ${page + 1}",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                }

                                // Page indicator
                                if (product.imageUrls.size > 1) {
                                    Surface(
                                        modifier = Modifier
                                            .align(Alignment.BottomCenter)
                                            .padding(bottom = 12.dp),
                                        shape = RoundedCornerShape(12.dp),
                                        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)
                                    ) {
                                        Text(
                                            "${pagerState.currentPage + 1} / ${product.imageUrls.size}",
                                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                            style = MaterialTheme.typography.labelSmall
                                        )
                                    }
                                }
                            }
                        }

                        // Product info
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(product.title, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                            Spacer(Modifier.height(8.dp))
                            Text(
                                KrCurrencyFormatter.formatKr(product.priceKr),
                                fontWeight = FontWeight.Bold,
                                fontSize = 24.sp,
                                color = MaterialTheme.colorScheme.primary
                            )

                            if (!product.description.isNullOrBlank()) {
                                Spacer(Modifier.height(16.dp))
                                Text("Description", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(6.dp))
                                Text(product.description, style = MaterialTheme.typography.bodyMedium)
                            }

                            product.category?.let {
                                Spacer(Modifier.height(12.dp))
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = MaterialTheme.colorScheme.secondaryContainer
                                ) {
                                    Text(
                                        it,
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelMedium
                                    )
                                }
                            }

                            // Seller info
                            Spacer(Modifier.height(20.dp))
                            HorizontalDivider()
                            Spacer(Modifier.height(12.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                AsyncImage(
                                    model = product.seller.avatarUrl,
                                    contentDescription = product.seller.displayName,
                                    modifier = Modifier.size(40.dp).clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                                Spacer(Modifier.width(10.dp))
                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(product.seller.displayName, fontWeight = FontWeight.SemiBold)
                                        if (product.seller.isVerified) {
                                            Spacer(Modifier.width(4.dp))
                                            Icon(
                                                Icons.Default.Verified,
                                                contentDescription = "Verified",
                                                tint = MaterialTheme.colorScheme.primary,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }
                                    Text(
                                        "@${product.seller.username}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            // Buy via WhatsApp button
                            Spacer(Modifier.height(24.dp))
                            Button(
                                onClick = {
                                    val message = buildString {
                                        append("Hello, I am interested in this product\n")
                                        if (product.imageUrls.isNotEmpty()) {
                                            append(product.imageUrls.first())
                                            append("\n")
                                        }
                                        append("${product.title} - ${KrCurrencyFormatter.formatKr(product.priceKr)}")
                                    }
                                    val encoded = message.encodeURLParameter()
                                    val whatsappUrl = "https://wa.me/${product.whatsappNumber}?text=$encoded"
                                    uriHandler.openUri(whatsappUrl)
                                },
                                modifier = Modifier.fillMaxWidth().height(52.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.primary
                                )
                            ) {
                                Icon(Icons.AutoMirrored.Filled.Chat, contentDescription = null, modifier = Modifier.size(20.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Buy via WhatsApp", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

