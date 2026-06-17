package com.krieta.feature.shop.presentation.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import cafe.adriel.voyager.core.screen.Screen
import cafe.adriel.voyager.koin.koinScreenModel
import cafe.adriel.voyager.navigator.LocalNavigator
import cafe.adriel.voyager.navigator.currentOrThrow
import coil3.compose.AsyncImage
import com.krieta.feature.shop.presentation.viewmodel.CreateListingViewModel
import com.krieta.feature.shop.presentation.viewmodel.ProductCategory
import com.krieta.feature.shop.presentation.viewmodel.CreateListingState
import com.krieta.feature.shop.presentation.viewmodel.CategorySubcategories
import io.github.vinceglb.filekit.compose.rememberFilePickerLauncher
import io.github.vinceglb.filekit.core.PickerType
import io.github.vinceglb.filekit.core.PickerMode
import kotlinx.coroutines.launch
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*

class CreateListingScreen : Screen {
    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    override fun Content() {
        val navigator = LocalNavigator.currentOrThrow
        val viewModel = koinScreenModel<CreateListingViewModel>()
        val state by viewModel.state.collectAsState()
        val currencyProvider = org.koin.compose.koinInject<com.krieta.com.core.location.UserCurrencyProvider>()

        LaunchedEffect(state.saveSuccess) {
            if (state.saveSuccess) navigator.pop()
        }

        val scope = rememberCoroutineScope()

        val launcher = rememberFilePickerLauncher(
            type = PickerType.Image,
            mode = PickerMode.Multiple()
        ) { files ->
            files?.forEach { file ->
                scope.launch {
                    val filePath = com.krieta.com.core.util.FileStreamer.getFilePathOrUri(file)
                    viewModel.uploadImage(filePath)
                }
            }
        }

        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("List a Product") },
                    navigationIcon = {
                        IconButton(onClick = { navigator.pop() }) {
                            Icon(painterResource(Res.drawable.ic_arrow_back), "Back")
                        }
                    }
                )
            }
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Images section
                Text("Product Images", fontWeight = FontWeight.SemiBold)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    state.imageUrls.forEachIndexed { index, url ->
                        Box(modifier = Modifier.size(72.dp)) {
                            AsyncImage(
                                model = url,
                                contentDescription = "Image ${index + 1}",
                                modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(8.dp)),
                                contentScale = ContentScale.Crop
                            )
                            IconButton(
                                onClick = { viewModel.removeImageUrl(index) },
                                modifier = Modifier.align(Alignment.TopEnd).size(20.dp)
                            ) {
                                Icon(painterResource(Res.drawable.ic_close), "Remove", modifier = Modifier.size(14.dp))
                            }
                        }
                    }
                    if (state.imageUrls.size < 10) {
                        OutlinedIconButton(
                            onClick = { launcher.launch() },
                            modifier = Modifier.size(72.dp)
                        ) {
                            if (state.isSaving && state.imageUrls.isEmpty()) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp))
                            } else {
                                Icon(painterResource(Res.drawable.ic_add), "Add Image")
                            }
                        }
                    }
                }

                OutlinedTextField(
                    value = state.title,
                    onValueChange = { viewModel.onTitleChange(it) },
                    label = { Text("Product Title") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedTextField(
                    value = state.description,
                    onValueChange = { viewModel.onDescriptionChange(it) },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 4,
                    shape = RoundedCornerShape(12.dp)
                )

                // Pricing Section
                Text("Pricing", fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleSmall)
                
                // Retail Price (only show if wholesale is not set)
                if (state.wholesalePrice.isBlank()) {
                    OutlinedTextField(
                        value = state.priceKr,
                        onValueChange = { viewModel.onPriceChange(it) },
                        label = { Text("Retail Price (${currencyProvider.localCurrencySymbol})") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        shape = RoundedCornerShape(12.dp),
                        supportingText = if (state.priceKr.isNotBlank()) {
                            { Text("≈ ${currencyProvider.formatWithKr(state.priceKr.toDoubleOrNull()?.let { currencyProvider.convertLocalToKr(it) } ?: 0.0)}") }
                        } else null
                    )
                    
                    // Bargaining Option (only for retail)
                    if (state.priceKr.isNotBlank()) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Checkbox(
                                checked = state.bargainEnabled,
                                onCheckedChange = { viewModel.onBargainEnabledChange(it) }
                            )
                            Text("Enable Bargaining", modifier = Modifier.weight(1f))
                        }
                        
                        if (state.bargainEnabled) {
                            OutlinedTextField(
                                value = state.bargainMinPrice,
                                onValueChange = { viewModel.onBargainMinPriceChange(it) },
                                label = { Text("Minimum Bargain Price (${currencyProvider.localCurrencySymbol}) - Hidden from buyers") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                shape = RoundedCornerShape(12.dp),
                                supportingText = { Text("Buyers won't see this. They'll be told if their offer is too low.", style = MaterialTheme.typography.bodySmall) }
                            )
                        }
                    }
                }
                
                // Wholesale Pricing (only show if retail is not set)
                if (state.priceKr.isBlank()) {
                    Text("Wholesale Pricing", fontWeight = FontWeight.Medium, style = MaterialTheme.typography.bodyLarge)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        OutlinedTextField(
                            value = state.wholesalePrice,
                            onValueChange = { viewModel.onWholesalePriceChange(it) },
                            label = { Text("Wholesale Price (${currencyProvider.localCurrencySymbol})") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            shape = RoundedCornerShape(12.dp),
                            supportingText = if (state.wholesalePrice.isNotBlank()) {
                                { Text("≈ ${currencyProvider.formatWithKr(state.wholesalePrice.toDoubleOrNull()?.let { currencyProvider.convertLocalToKr(it) } ?: 0.0)}") }
                            } else null
                        )
                        OutlinedTextField(
                            value = state.wholesaleMinQty,
                            onValueChange = { viewModel.onWholesaleMinQtyChange(it) },
                            label = { Text("Min Qty") },
                            modifier = Modifier.weight(0.6f),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(12.dp)
                        )
                    }
                }
                
                // Show option to switch pricing type
                if (state.priceKr.isBlank() && state.wholesalePrice.isBlank()) {
                    Text("Choose pricing type:", style = MaterialTheme.typography.bodyMedium)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedButton(
                            onClick = { /* User can just start typing in retail price */ },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Retail Price")
                        }
                        OutlinedButton(
                            onClick = { /* User can just start typing in wholesale price */ },
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Wholesale Only")
                        }
                    }
                }

                // Category Dropdown
                var categoryExpanded by remember { mutableStateOf(false) }
                ExposedDropdownMenuBox(
                    expanded = categoryExpanded,
                    onExpandedChange = { categoryExpanded = it },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    OutlinedTextField(
                        value = state.selectedCategory?.displayName ?: "",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Category") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable),
                        shape = RoundedCornerShape(12.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = categoryExpanded,
                        onDismissRequest = { categoryExpanded = false }
                    ) {
                        ProductCategory.entries.forEach { category ->
                            DropdownMenuItem(
                                text = { Text(category.displayName) },
                                onClick = {
                                    viewModel.onCategoryChange(category)
                                    categoryExpanded = false
                                }
                            )
                        }
                        state.customCategories.forEach { customCat ->
                            DropdownMenuItem(
                                text = { Text(customCat) },
                                onClick = {
                                    viewModel.onCategoryChange(ProductCategory.OTHER)
                                    categoryExpanded = false
                                }
                            )
                        }
                    }
                }

                // Subcategory Dropdown (dynamic based on selected category)
                val subcategories = state.selectedCategory?.let { CategorySubcategories.map[it] }
                if (!subcategories.isNullOrEmpty()) {
                    DropdownField(
                        label = "Subcategory",
                        value = state.selectedSubcategory,
                        options = subcategories,
                        onSelect = { viewModel.onSubcategoryChange(it) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Custom category input if OTHER
                if (state.selectedCategory == ProductCategory.OTHER) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = state.customCategory,
                            onValueChange = { viewModel.onCustomCategoryChange(it) },
                            label = { Text("Custom Category") },
                            modifier = Modifier.weight(1f),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )
                        Button(
                            onClick = { viewModel.addCustomCategory() },
                            modifier = Modifier.height(56.dp),
                            enabled = state.customCategory.isNotBlank()
                        ) {
                            Text("Add")
                        }
                    }
                }

                // Condition dropdown (for categories that need it)
                if (state.selectedCategory != null && state.selectedCategory != ProductCategory.SERVICES && state.selectedCategory != ProductCategory.DIGITAL_PRODUCTS) {
                    DropdownField(
                        label = "Condition",
                        value = state.conditionField,
                        options = listOf("New", "Used", "Refurbished", "For Parts"),
                        onSelect = { viewModel.onConditionChange(it.uppercase().replace(" ", "_")) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Location field
                OutlinedTextField(
                    value = state.location,
                    onValueChange = { viewModel.onLocationChange(it) },
                    label = { Text("Location") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("e.g., Nairobi, Kenya") },
                    shape = RoundedCornerShape(12.dp)
                )

                // ── Dynamic Category-Specific Fields ──
                when (state.selectedCategory) {
                    ProductCategory.VEHICLES -> VehicleDetailsForm(viewModel, state)
                    ProductCategory.SPARE_PARTS -> SparePartDetailsForm(viewModel, state)
                    ProductCategory.REAL_ESTATE -> RealEstateDetailsForm(viewModel, state)
                    ProductCategory.FASHION -> FashionDetailsForm(viewModel, state)
                    ProductCategory.SHOES -> ShoeDetailsForm(viewModel, state)
                    ProductCategory.ELECTRONICS -> ElectronicsDetailsForm(viewModel, state)
                    ProductCategory.FURNITURE -> FurnitureDetailsForm(viewModel, state)
                    ProductCategory.FOOD_FMCG -> FmcgDetailsForm(viewModel, state)
                    ProductCategory.GROCERIES -> GroceryDetailsForm(viewModel, state)
                    ProductCategory.BOOKS -> BookDetailsForm(viewModel, state)
                    ProductCategory.DIGITAL_PRODUCTS -> DigitalProductDetailsForm(viewModel, state)
                    ProductCategory.SERVICES -> ServiceDetailsForm(viewModel, state)
                    else -> {}
                }

                OutlinedTextField(
                    value = state.whatsappNumber,
                    onValueChange = { viewModel.onWhatsappChange(it) },
                    label = { Text("WhatsApp Number (with country code) *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    placeholder = { Text("+254...") },
                    shape = RoundedCornerShape(12.dp),
                    isError = state.error?.contains("whatsapp", ignoreCase = true) == true,
                    supportingText = if (state.error?.contains("whatsapp", ignoreCase = true) == true) {
                        { Text("WhatsApp number is required", color = MaterialTheme.colorScheme.error) }
                    } else {
                        { Text("Required for buyer contact", style = MaterialTheme.typography.bodySmall) }
                    }
                )

                state.error?.let {
                    Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }

                Spacer(Modifier.height(8.dp))

                Button(
                    onClick = { viewModel.save() },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    enabled = !state.isSaving
                ) {
                    if (state.isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("List Product", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ─── VEHICLE FORM ───────────────────────────────────────
@Composable
fun VehicleDetailsForm(viewModel: CreateListingViewModel, state: CreateListingState) {
    SectionTitle("Vehicle Details")
    DropdownField("Vehicle Type", state.vehicleDetails.vehicleType.replaceFirstChar { it.uppercase() },
        listOf("Car", "Motorcycle", "Truck", "Bus", "Trailer"),
        { viewModel.updateVehicle { copy(vehicleType = it.lowercase()) } }, Modifier.fillMaxWidth())
    OutlinedTextField(value = state.vehicleDetails.make, onValueChange = { viewModel.onVehicleMakeChange(it) },
        label = { Text("Make (e.g., Toyota, Honda)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(12.dp))
    OutlinedTextField(value = state.vehicleDetails.model, onValueChange = { viewModel.onVehicleModelChange(it) },
        label = { Text("Model") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(12.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(value = state.vehicleDetails.year, onValueChange = { viewModel.onVehicleYearChange(it) },
            label = { Text("Year") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = RoundedCornerShape(12.dp))
        OutlinedTextField(value = state.vehicleDetails.mileage, onValueChange = { viewModel.onVehicleMileageChange(it) },
            label = { Text("Mileage (km)") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = RoundedCornerShape(12.dp))
    }
    DropdownField("Fuel Type", state.vehicleDetails.fuelType,
        listOf("Petrol", "Diesel", "Electric", "Hybrid", "LPG"),
        { viewModel.onVehicleFuelTypeChange(it) }, Modifier.fillMaxWidth())
    DropdownField("Transmission", state.vehicleDetails.transmission,
        listOf("Manual", "Automatic", "CVT", "DCT"),
        { viewModel.onVehicleTransmissionChange(it) }, Modifier.fillMaxWidth())
    DropdownField("Body Type", state.vehicleDetails.bodyType,
        listOf("Sedan", "SUV", "Hatchback", "Pickup", "Van", "Coupe", "Wagon", "Minivan", "Bus", "Truck", "Convertible"),
        { viewModel.onVehicleBodyTypeChange(it) }, Modifier.fillMaxWidth())
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(value = state.vehicleDetails.engineSize, onValueChange = { viewModel.onVehicleEngineSizeChange(it) },
            label = { Text("Engine Size") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., 2.0L") }, shape = RoundedCornerShape(12.dp))
        OutlinedTextField(value = state.vehicleDetails.color, onValueChange = { viewModel.onVehicleColorChange(it) },
            label = { Text("Color") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
    }
    OutlinedTextField(value = state.vehicleDetails.numberOfOwners,
        onValueChange = { viewModel.updateVehicle { copy(numberOfOwners = it) } },
        label = { Text("Number of Owners") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = RoundedCornerShape(12.dp))
    DropdownField("Import Status", state.vehicleDetails.importStatus,
        listOf("Local", "Imported"), { viewModel.updateVehicle { copy(importStatus = it.lowercase()) } }, Modifier.fillMaxWidth())
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Row { Checkbox(state.vehicleDetails.logbookReady, { viewModel.updateVehicle { copy(logbookReady = it) } }); Text("Logbook Ready", modifier = Modifier.padding(top = 14.dp)) }
        Row { Checkbox(state.vehicleDetails.accidentHistory, { viewModel.updateVehicle { copy(accidentHistory = it) } }); Text("Accident History", modifier = Modifier.padding(top = 14.dp)) }
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Row { Checkbox(state.vehicleDetails.tradeInEnabled, { viewModel.updateVehicle { copy(tradeInEnabled = it) } }); Text("Trade-in OK", modifier = Modifier.padding(top = 14.dp)) }
        Row { Checkbox(state.vehicleDetails.swapEnabled, { viewModel.updateVehicle { copy(swapEnabled = it) } }); Text("Swap OK", modifier = Modifier.padding(top = 14.dp)) }
    }
}

// ─── ELECTRONICS FORM ───────────────────────────────────
@Composable
fun ElectronicsDetailsForm(viewModel: CreateListingViewModel, state: CreateListingState) {
    SectionTitle("Electronics Details")
    OutlinedTextField(value = state.electronicsDetails.brand, onValueChange = { viewModel.onElectronicsBrandChange(it) },
        label = { Text("Brand") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(12.dp))
    OutlinedTextField(value = state.electronicsDetails.model, onValueChange = { viewModel.onElectronicsModelChange(it) },
        label = { Text("Model") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(12.dp))
    OutlinedTextField(value = state.electronicsDetails.processor, onValueChange = { viewModel.onElectronicsProcessorChange(it) },
        label = { Text("Processor (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        placeholder = { Text("e.g., Intel i7") }, shape = RoundedCornerShape(12.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(value = state.electronicsDetails.ram, onValueChange = { viewModel.onElectronicsRamChange(it) },
            label = { Text("RAM") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., 8GB") }, shape = RoundedCornerShape(12.dp))
        OutlinedTextField(value = state.electronicsDetails.storage, onValueChange = { viewModel.onElectronicsStorageChange(it) },
            label = { Text("Storage") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., 256GB") }, shape = RoundedCornerShape(12.dp))
    }
    OutlinedTextField(value = state.electronicsDetails.screenSize, onValueChange = { viewModel.onElectronicsScreenSizeChange(it) },
        label = { Text("Screen Size (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        placeholder = { Text("e.g., 15.6 inches") }, shape = RoundedCornerShape(12.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(value = state.electronicsDetails.batteryLife,
            onValueChange = { viewModel.updateElectronics { copy(batteryLife = it) } },
            label = { Text("Battery Life") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
        OutlinedTextField(value = state.electronicsDetails.os,
            onValueChange = { viewModel.updateElectronics { copy(os = it) } },
            label = { Text("OS") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
    }
    OutlinedTextField(value = state.electronicsDetails.warrantyMonths,
        onValueChange = { viewModel.updateElectronics { copy(warrantyMonths = it) } },
        label = { Text("Warranty (months)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = RoundedCornerShape(12.dp))
}

// ─── FASHION FORM ───────────────────────────────────────
@Composable
fun FashionDetailsForm(viewModel: CreateListingViewModel, state: CreateListingState) {
    SectionTitle("Fashion Details")
    OutlinedTextField(value = state.fashionDetails.brand, onValueChange = { viewModel.onFashionBrandChange(it) },
        label = { Text("Brand") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = RoundedCornerShape(12.dp))
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        DropdownField("Gender", state.fashionDetails.gender,
            listOf("Men", "Women", "Boys", "Girls", "Baby", "Unisex"),
            { viewModel.onFashionGenderChange(it) }, Modifier.weight(1f))
        DropdownField("Age Group", state.fashionDetails.ageGroup,
            listOf("Adult", "Teen", "Children", "Baby"),
            { viewModel.updateFashion { copy(ageGroup = it) } }, Modifier.weight(1f))
    }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(value = state.fashionDetails.size, onValueChange = { viewModel.onFashionSizeChange(it) },
            label = { Text("Size") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., M, L, XL, 2-3Y") }, shape = RoundedCornerShape(12.dp))
        OutlinedTextField(value = state.fashionDetails.color, onValueChange = { viewModel.onFashionColorChange(it) },
            label = { Text("Color") }, modifier = Modifier.weight(1f), singleLine = true, shape = RoundedCornerShape(12.dp))
    }
    OutlinedTextField(value = state.fashionDetails.material, onValueChange = { viewModel.onFashionMaterialChange(it) },
        label = { Text("Material (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        placeholder = { Text("e.g., Cotton, Polyester, Silk") }, shape = RoundedCornerShape(12.dp))
    DropdownField("Fit Type", state.fashionDetails.fitType, listOf("Slim", "Regular", "Loose", "Oversized"),
        { viewModel.updateFashion { copy(fitType = it.lowercase()) } }, Modifier.fillMaxWidth())
    OutlinedTextField(value = state.fashionDetails.pattern,
        onValueChange = { viewModel.updateFashion { copy(pattern = it) } },
        label = { Text("Pattern (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        placeholder = { Text("e.g., Striped, Floral, Plain") }, shape = RoundedCornerShape(12.dp))
    DropdownField("Season", state.fashionDetails.season, listOf("Spring", "Summer", "Fall", "Winter", "All Season"),
        { viewModel.updateFashion { copy(season = it.lowercase()) } }, Modifier.fillMaxWidth())
    OutlinedTextField(value = state.fashionDetails.careInstructions,
        onValueChange = { viewModel.updateFashion { copy(careInstructions = it) } },
        label = { Text("Care Instructions (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        placeholder = { Text("e.g., Machine wash cold, Dry clean only") }, shape = RoundedCornerShape(12.dp))
}
