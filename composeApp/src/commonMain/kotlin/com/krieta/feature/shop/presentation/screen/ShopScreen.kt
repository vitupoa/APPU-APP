package com.krieta.feature.shop.presentation.screen

import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState


import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.com.core.util.KrCurrencyFormatter
import com.krieta.feature.shop.domain.model.Product
import com.krieta.feature.shop.presentation.viewmodel.ShopListViewModel

class ShopScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<ShopListViewModel>()
        val state by viewModel.state.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Shop") },
                    actions = {
                        IconButton(onClick = { navigator.push(CreateListingScreen()) }) {
                            Icon(Icons.Default.Add, "List Product")
                        }
                    }
                )
            }
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding)) {
                // Search bar
                OutlinedTextField(
                    value = state.searchQuery,
                    onValueChange = { viewModel.search(it) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    placeholder = { Text("Search products...") },
                    leadingIcon = { Icon(Icons.Default.Search, "Search") },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )

                // Category chips
                CategoryChips(
                    selected = state.selectedCategory,
                    onSelect = { viewModel.selectCategory(it) }
                )

                when {
                    state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                    state.items.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No products found", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    else -> LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(state.items, key = { it.id }) { product ->
                            ProductCard(product, onClick = { navigator.push(ProductDetailScreen(product.id)) })
                        }

                        if (state.nextCursor != null) {
                            item {
                                TextButton(
                                    onClick = { viewModel.loadMore() },
                                    modifier = Modifier.fillMaxWidth()
                                ) { Text("Load more") }
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun CategoryChips(selected: String?, onSelect: (String?) -> Unit) {
        val categories = listOf("Electronics", "Fashion", "Art", "Music", "Services", "Other")
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            FilterChip(
                selected = selected == null,
                onClick = { onSelect(null) },
                label = { Text("All") }
            )
            categories.forEach { cat ->
                FilterChip(
                    selected = selected == cat,
                    onClick = { onSelect(if (selected == cat) null else cat) },
                    label = { Text(cat) }
                )
            }
        }
    }

    @Composable
    private fun ProductCard(product: Product, onClick: () -> Unit) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onClick() },
            shape = RoundedCornerShape(12.dp)
        ) {
            Column {
                // Product image
                if (product.imageUrls.isNotEmpty()) {
                    AsyncImage(
                        model = product.imageUrls.first(),
                        contentDescription = product.title,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .clip(RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp)),
                        contentScale = ContentScale.Crop
                    )
                }

                Column(modifier = Modifier.padding(10.dp)) {
                    Text(
                        product.title,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        KrCurrencyFormatter.formatKr(product.priceKr),
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                        fontSize = 15.sp
                    )
                    Spacer(Modifier.height(2.dp))
                    Text(
                        "@${product.seller.username}",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

