package com.krieta.feature.shop.presentation.screen
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.shape.CircleShape


import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
import androidx.compose.runtime.getValue
import androidx.compose.runtime.collectAsState

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll

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
import com.krieta.com.core.location.UserCurrencyProvider
import com.krieta.feature.shop.presentation.viewmodel.ProductDetailViewModel
import io.ktor.http.encodeURLParameter
import org.koin.compose.koinInject
import org.koin.core.parameter.parametersOf

class ProductDetailScreen(private val productId: String) : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val uriHandler = LocalUriHandler.current
        val viewModel = koinScreenModel<ProductDetailViewModel>(parameters = { parametersOf(productId) })
        val state by viewModel.state.collectAsState()
        val currencyProvider = koinInject<UserCurrencyProvider>()
        val exchangeRate by currencyProvider.exchangeRate.collectAsState()

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Product") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
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
                                        modifier = Modifier.fillMaxSize().clickable {
                                            navigator.push(ImageViewerScreen(product.imageUrls, page))
                                        },
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
                            
                            // Pricing badges
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = MaterialTheme.colorScheme.primaryContainer
                                ) {
                                    Text(
                                        "RETAIL",
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                                if (product.wholesalePrice != null) {
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = MaterialTheme.colorScheme.secondaryContainer
                                    ) {
                                        Text(
                                            "WHOLESALE",
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                                if (product.bargainEnabled) {
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = MaterialTheme.colorScheme.error
                                    ) {
                                        Text(
                                            "BARGAIN",
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                            style = MaterialTheme.typography.labelSmall,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onError
                                        )
                                    }
                                }
                            }
                            
                            Spacer(Modifier.height(8.dp))
                            Text(
                                currencyProvider.formatWithFiat(product.priceKr),
                                fontWeight = FontWeight.Bold,
                                fontSize = 24.sp,
                                color = MaterialTheme.colorScheme.primary
                            )

                            // Additional pricing info
                            if (product.wholesalePrice != null) {
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Wholesale: ${currencyProvider.formatWithFiat(product.wholesalePrice)} (Min: ${product.wholesaleMinQty} units)",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.secondary
                                )
                            }
                            if (product.bargainEnabled && product.bargainMinPrice != null) {
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    "Bargain available (Min: ${currencyProvider.formatWithFiat(product.bargainMinPrice)})",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.tertiary
                                )
                            }

                            // Product stats
                            Spacer(Modifier.height(12.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                if (product.viewCount > 0) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Visibility, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Spacer(Modifier.width(4.dp))
                                        Text("${product.viewCount}", style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                                if (product.salesCount > 0) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.ShoppingCart, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Spacer(Modifier.width(4.dp))
                                        Text("${product.salesCount} sold", style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                                if (product.avgRating > 0) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Star, null, Modifier.size(16.dp), tint = MaterialTheme.colorScheme.primary)
                                        Spacer(Modifier.width(4.dp))
                                        Text("${product.avgRating} (${product.reviewCount})", style = MaterialTheme.typography.bodySmall)
                                    }
                                }
                            }

                            // Basic details
                            Spacer(Modifier.height(16.dp))
                            HorizontalDivider()
                            Spacer(Modifier.height(12.dp))
                            
                            if (product.condition != null) {
                                DetailRow("Condition", product.condition)
                            }
                            if (product.brand != null) {
                                DetailRow("Brand", product.brand)
                            }
                            if (product.stock > 0) {
                                DetailRow("Stock", "${product.stock} available")
                            }
                            if (product.location != null) {
                                DetailRow("Location", product.location)
                            }

                            // Category-specific details
                            product.vehicleDetail?.let { vehicle ->
                                Spacer(Modifier.height(12.dp))
                                Text("Vehicle Details", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                DetailRow("Make & Model", "${vehicle.make} ${vehicle.model}")
                                DetailRow("Year", vehicle.year.toString())
                                vehicle.mileage?.let { DetailRow("Mileage", "$it km") }
                                vehicle.fuelType?.let { DetailRow("Fuel Type", it) }
                                vehicle.transmission?.let { DetailRow("Transmission", it) }
                                vehicle.bodyType?.let { DetailRow("Body Type", it) }
                                vehicle.engineSize?.let { DetailRow("Engine Size", it) }
                                vehicle.color?.let { DetailRow("Color", it) }
                                vehicle.numberOfOwners?.let { DetailRow("Owners", it.toString()) }
                                if (vehicle.logbookReady) DetailRow("Logbook", "Ready")
                            }

                            product.sparePartDetail?.let { part ->
                                Spacer(Modifier.height(12.dp))
                                Text("Spare Part Details", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                DetailRow("Part Type", part.partType)
                                part.partNumber?.let { DetailRow("Part Number", it) }
                                if (part.compatibleMakes.isNotEmpty()) {
                                    DetailRow("Compatible Makes", part.compatibleMakes.joinToString(", "))
                                }
                                if (part.compatibleModels.isNotEmpty()) {
                                    DetailRow("Compatible Models", part.compatibleModels.joinToString(", "))
                                }
                                if (part.isGenuine) DetailRow("Type", "Genuine")
                            }

                            product.realEstateDetail?.let { estate ->
                                Spacer(Modifier.height(12.dp))
                                Text("Property Details", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                DetailRow("Property Type", estate.propertyType)
                                DetailRow("Listing Type", estate.listingType)
                                estate.landSize?.let { DetailRow("Land Size", it) }
                                estate.bedrooms?.let { DetailRow("Bedrooms", it.toString()) }
                                estate.bathrooms?.let { DetailRow("Bathrooms", it.toString()) }
                                estate.floors?.let { DetailRow("Floors", it.toString()) }
                                estate.yearBuilt?.let { DetailRow("Year Built", it.toString()) }
                                if (estate.furnished) DetailRow("Furnished", "Yes")
                                if (estate.parking) DetailRow("Parking", "Available")
                                if (estate.amenities.isNotEmpty()) {
                                    DetailRow("Amenities", estate.amenities.joinToString(", "))
                                }
                            }

                            product.fashionDetail?.let { fashion ->
                                Spacer(Modifier.height(12.dp))
                                Text("Fashion Details", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                fashion.size?.let { DetailRow("Size", it) }
                                fashion.material?.let { DetailRow("Material", it) }
                                fashion.fitType?.let { DetailRow("Fit", it) }
                                fashion.gender?.let { DetailRow("Gender", it) }
                                if (fashion.colorVariants.isNotEmpty()) {
                                    DetailRow("Colors", fashion.colorVariants.joinToString(", "))
                                }
                            }

                            product.shoeDetail?.let { shoe ->
                                Spacer(Modifier.height(12.dp))
                                Text("Shoe Details", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                DetailRow("Size", shoe.shoeSize)
                                shoe.soleMaterial?.let { DetailRow("Sole Material", it) }
                                shoe.heelHeight?.let { DetailRow("Heel Height", it) }
                                shoe.closureType?.let { DetailRow("Closure", it) }
                                shoe.gender?.let { DetailRow("Gender", it) }
                                if (shoe.waterResistant) DetailRow("Water Resistant", "Yes")
                            }

                            product.electronicsDetail?.let { electronics ->
                                Spacer(Modifier.height(12.dp))
                                Text("Electronics Details", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                electronics.processor?.let { DetailRow("Processor", it) }
                                electronics.ram?.let { DetailRow("RAM", it) }
                                electronics.storage?.let { DetailRow("Storage", it) }
                                electronics.screenSize?.let { DetailRow("Screen Size", it) }
                                electronics.batteryLife?.let { DetailRow("Battery Life", it) }
                                electronics.os?.let { DetailRow("OS", it) }
                                electronics.warrantyMonths?.let { DetailRow("Warranty", "$it months") }
                                if (electronics.connectivity.isNotEmpty()) {
                                    DetailRow("Connectivity", electronics.connectivity.joinToString(", "))
                                }
                            }

                            product.foodDetail?.let { food ->
                                Spacer(Modifier.height(12.dp))
                                Text("Food Details", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                food.weightVolume?.let { DetailRow("Weight/Volume", it) }
                                food.expiryDate?.let { DetailRow("Expiry Date", it) }
                                if (food.isOrganic) DetailRow("Organic", "Yes")
                                if (food.ingredients.isNotEmpty()) {
                                    DetailRow("Ingredients", food.ingredients.joinToString(", "))
                                }
                                if (food.allergens.isNotEmpty()) {
                                    DetailRow("Allergens", food.allergens.joinToString(", "))
                                }
                                if (food.certifications.isNotEmpty()) {
                                    DetailRow("Certifications", food.certifications.joinToString(", "))
                                }
                            }

                            product.bookDetail?.let { book ->
                                Spacer(Modifier.height(12.dp))
                                Text("Book Details", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                DetailRow("Author", book.author)
                                book.isbn?.let { DetailRow("ISBN", it) }
                                book.publisher?.let { DetailRow("Publisher", it) }
                                book.edition?.let { DetailRow("Edition", it) }
                                book.language?.let { DetailRow("Language", it) }
                                book.pageCount?.let { DetailRow("Pages", it.toString()) }
                                book.genre?.let { DetailRow("Genre", it) }
                                if (book.downloadable) DetailRow("Format", "Downloadable")
                            }

                            product.digitalProductDetail?.let { digital ->
                                Spacer(Modifier.height(12.dp))
                                Text("Digital Product Details", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                DetailRow("File Format", digital.fileFormat)
                                DetailRow("License Type", digital.licenseType)
                                digital.fileSizeMb?.let { DetailRow("File Size", "${it} MB") }
                                digital.downloadLimit?.let { DetailRow("Download Limit", it.toString()) }
                                if (digital.drmProtected) DetailRow("DRM", "Protected")
                            }

                            product.serviceDetail?.let { service ->
                                Spacer(Modifier.height(12.dp))
                                Text("Service Details", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(8.dp))
                                DetailRow("Service Type", service.serviceType)
                                DetailRow("Delivery Mode", service.deliveryMode)
                                service.durationMinutes?.let { DetailRow("Duration", "$it minutes") }
                                service.availability?.let { DetailRow("Availability", it) }
                                service.revisionsAllowed?.let { DetailRow("Revisions", it.toString()) }
                                service.turnaroundDays?.let { DetailRow("Turnaround", "$it days") }
                            }

                            if (!product.description.isNullOrBlank()) {
                                Spacer(Modifier.height(16.dp))
                                HorizontalDivider()
                                Spacer(Modifier.height(12.dp))
                                Text("Description", fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                                Spacer(Modifier.height(6.dp))
                                Text(product.description, style = MaterialTheme.typography.bodyMedium)
                            }

                            if (product.tags.isNotEmpty()) {
                                Spacer(Modifier.height(12.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.fillMaxWidth()) {
                                    product.tags.take(5).forEach { tag ->
                                        Surface(
                                            shape = RoundedCornerShape(8.dp),
                                            color = MaterialTheme.colorScheme.secondaryContainer
                                        ) {
                                            Text(
                                                "#$tag",
                                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                                style = MaterialTheme.typography.labelSmall
                                            )
                                        }
                                    }
                                }
                            }

                            product.category?.let {
                                Spacer(Modifier.height(12.dp))
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = MaterialTheme.colorScheme.tertiaryContainer
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
                                            Icon(painterResource(Res.drawable.ic_verified),
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
                            
                            // Bargaining Section
                            if (product.bargainEnabled) {
                                if (!state.bargainSuccess) {
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(
                                            containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
                                        )
                                    ) {
                                        Column(modifier = Modifier.padding(16.dp)) {
                                            Text(
                                                "Make an Offer",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 16.sp
                                            )
                                            Spacer(Modifier.height(8.dp))
                                            OutlinedTextField(
                                                value = state.bargainPrice,
                                                onValueChange = { viewModel.onBargainPriceChange(it) },
                                                label = { Text("Your Offer (Kr)") },
                                                modifier = Modifier.fillMaxWidth(),
                                                singleLine = true,
                                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                                shape = RoundedCornerShape(12.dp),
                                                isError = state.bargainError != null
                                            )
                                            if (state.bargainError != null) {
                                                Spacer(Modifier.height(4.dp))
                                                Text(
                                                    state.bargainError,
                                                    color = MaterialTheme.colorScheme.error,
                                                    style = MaterialTheme.typography.bodySmall
                                                )
                                            }
                                            Spacer(Modifier.height(12.dp))
                                            Button(
                                                onClick = { viewModel.submitBargain() },
                                                modifier = Modifier.fillMaxWidth(),
                                                shape = RoundedCornerShape(12.dp)
                                            ) {
                                                Text("Submit Offer")
                                            }
                                        }
                                    }
                                    Spacer(Modifier.height(16.dp))
                                } else {
                                    // Bargain accepted - show contact button with agreed price
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        colors = CardDefaults.cardColors(
                                            containerColor = MaterialTheme.colorScheme.primaryContainer
                                        )
                                    ) {
                                        Column(modifier = Modifier.padding(16.dp)) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(
                                                    Icons.Default.CheckCircle,
                                                    contentDescription = null,
                                                    tint = MaterialTheme.colorScheme.primary
                                                )
                                                Spacer(Modifier.width(8.dp))
                                                Text(
                                                    "Offer Accepted!",
                                                    fontWeight = FontWeight.Bold,
                                                    color = MaterialTheme.colorScheme.primary
                                                )
                                            }
                                            Spacer(Modifier.height(8.dp))
                                            Text(
                                                "Your offer of ${currencyProvider.formatWithFiat(state.bargainPrice.toDoubleOrNull() ?: 0.0)} is acceptable. Contact the seller to complete the purchase.",
                                                style = MaterialTheme.typography.bodyMedium
                                            )
                                        }
                                    }
                                    Spacer(Modifier.height(16.dp))
                                }
                            }
                            
                            Button(
                                onClick = {
                                    val finalPrice = if (state.bargainSuccess && state.bargainPrice.isNotBlank()) {
                                        state.bargainPrice.toDoubleOrNull() ?: product.priceKr
                                    } else {
                                        product.priceKr
                                    }
                                    
                                    val message = buildString {
                                        append("Hi, I'm interested in:\n\n")
                                        append("*${product.title}*\n")
                                        if (state.bargainSuccess) {
                                            append("Agreed Price: ${currencyProvider.formatWithFiat(finalPrice)}\n\n")
                                        } else {
                                            append("Price: ${currencyProvider.formatWithFiat(finalPrice)}\n\n")
                                        }
                                        if (product.imageUrls.isNotEmpty()) {
                                            append("${product.imageUrls.first()}\n\n")
                                        }
                                        append("View product: https://krieta.app/shop/${product.id}")
                                    }
                                    val encoded = message.encodeURLParameter()
                                    val whatsappUrl = "https://wa.me/${product.whatsappNumber}?text=$encoded"
                                    uriHandler.openUri(whatsappUrl)
                                },
                                modifier = Modifier.fillMaxWidth().height(52.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.primary
                                ),
                                enabled = !product.bargainEnabled || state.bargainSuccess
                            ) {
                                Icon(painterResource(Res.drawable.ic_chat), contentDescription = null, modifier = Modifier.size(20.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("Contact Seller", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )
        Text(
            value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(1f)
        )
    }
}

