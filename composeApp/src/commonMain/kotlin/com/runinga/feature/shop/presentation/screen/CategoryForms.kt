package com.runinga.feature.shop.presentation.screen

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.runinga.feature.shop.presentation.viewmodel.CreateListingViewModel
import com.runinga.feature.shop.presentation.viewmodel.CreateListingState

private val fieldShape = RoundedCornerShape(12.dp)

@Composable
fun DropdownField(
    label: String,
    value: String,
    options: List<String>,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }
    @OptIn(ExperimentalMaterial3Api::class)
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = it }, modifier = modifier) {
        OutlinedTextField(
            value = value, onValueChange = {}, readOnly = true, label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier.fillMaxWidth().menuAnchor(ExposedDropdownMenuAnchorType.PrimaryNotEditable), shape = fieldShape
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { opt ->
                DropdownMenuItem(text = { Text(opt) }, onClick = { onSelect(opt); expanded = false })
            }
        }
    }
}

@Composable
fun SectionTitle(text: String) {
    Text(text, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.titleMedium)
}

// ─── SPARE PARTS ────────────────────────────────────────
@Composable
fun SparePartDetailsForm(vm: CreateListingViewModel, s: CreateListingState) {
    SectionTitle("Spare Part Details")
    DropdownField("Part Type", s.sparePartDetails.partType,
        listOf("Engine Parts", "Body Parts", "Suspension", "Electrical", "Brakes", "Filters", "Tyres & Wheels", "Interior", "Accessories"),
        { vm.updateSparePart { copy(partType = it) } }, Modifier.fillMaxWidth())
    OutlinedTextField(value = s.sparePartDetails.partNumber, onValueChange = { vm.updateSparePart { copy(partNumber = it) } },
        label = { Text("Part Number (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    OutlinedTextField(value = s.sparePartDetails.oemNumber, onValueChange = { vm.updateSparePart { copy(oemNumber = it) } },
        label = { Text("OEM Number (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.sparePartDetails.compatibleYearFrom, onValueChange = { vm.updateSparePart { copy(compatibleYearFrom = it) } },
            label = { Text("Year From") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
        OutlinedTextField(value = s.sparePartDetails.compatibleYearTo, onValueChange = { vm.updateSparePart { copy(compatibleYearTo = it) } },
            label = { Text("Year To") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        Row { Checkbox(s.sparePartDetails.isGenuine, { vm.updateSparePart { copy(isGenuine = it) } }); Text("Genuine", modifier = Modifier.padding(top = 14.dp)) }
    }
}

// ─── REAL ESTATE ────────────────────────────────────────
@Composable
fun RealEstateDetailsForm(vm: CreateListingViewModel, s: CreateListingState) {
    SectionTitle("Property Details")
    DropdownField("Property Type", s.realEstateDetails.propertyType,
        listOf("Apartment", "House", "Land", "Commercial", "Office", "Warehouse"),
        { vm.updateRealEstate { copy(propertyType = it.lowercase()) } }, Modifier.fillMaxWidth())
    DropdownField("Listing Type", s.realEstateDetails.listingType,
        listOf("For Sale", "For Rent"),
        { vm.updateRealEstate { copy(listingType = if (it == "For Sale") "sale" else "rent") } }, Modifier.fillMaxWidth())
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.realEstateDetails.bedrooms, onValueChange = { vm.updateRealEstate { copy(bedrooms = it) } },
            label = { Text("Bedrooms") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
        OutlinedTextField(value = s.realEstateDetails.bathrooms, onValueChange = { vm.updateRealEstate { copy(bathrooms = it) } },
            label = { Text("Bathrooms") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.realEstateDetails.floors, onValueChange = { vm.updateRealEstate { copy(floors = it) } },
            label = { Text("Floors") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
        OutlinedTextField(value = s.realEstateDetails.yearBuilt, onValueChange = { vm.updateRealEstate { copy(yearBuilt = it) } },
            label = { Text("Year Built") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
    }
    OutlinedTextField(value = s.realEstateDetails.landSize, onValueChange = { vm.updateRealEstate { copy(landSize = it) } },
        label = { Text("Land Size (e.g., 50x100ft)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        Row { Checkbox(s.realEstateDetails.furnished, { vm.updateRealEstate { copy(furnished = it) } }); Text("Furnished", modifier = Modifier.padding(top = 14.dp)) }
        Row { Checkbox(s.realEstateDetails.parking, { vm.updateRealEstate { copy(parking = it) } }); Text("Parking", modifier = Modifier.padding(top = 14.dp)) }
    }
}

// ─── SHOES ──────────────────────────────────────────────
@Composable
fun ShoeDetailsForm(vm: CreateListingViewModel, s: CreateListingState) {
    SectionTitle("Shoe Details")
    OutlinedTextField(value = s.shoeDetails.shoeSize, onValueChange = { vm.updateShoe { copy(shoeSize = it) } },
        label = { Text("Shoe Size (e.g., 42, US 9)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    DropdownField("Gender", s.shoeDetails.gender, listOf("Men", "Women", "Unisex", "Kids"),
        { vm.updateShoe { copy(gender = it) } }, Modifier.fillMaxWidth())
    DropdownField("Closure Type", s.shoeDetails.closureType,
        listOf("Lace-up", "Velcro", "Slip-on", "Buckle", "Zipper"),
        { vm.updateShoe { copy(closureType = it.lowercase().replace("-", "_")) } }, Modifier.fillMaxWidth())
    OutlinedTextField(value = s.shoeDetails.soleMaterial, onValueChange = { vm.updateShoe { copy(soleMaterial = it) } },
        label = { Text("Sole Material (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    Row(Modifier.fillMaxWidth()) {
        Checkbox(s.shoeDetails.waterResistant, { vm.updateShoe { copy(waterResistant = it) } })
        Text("Water Resistant", modifier = Modifier.padding(top = 14.dp))
    }
}

// ─── FURNITURE ────────────────────────────────────────────
@Composable
fun FurnitureDetailsForm(vm: CreateListingViewModel, s: CreateListingState) {
    SectionTitle("Furniture Details")
    DropdownField("Furniture Type", s.furnitureDetails.furnitureType,
        listOf("Sofa", "Bed", "Table", "Chair", "Cabinet", "Desk", "Shelf", "Other"),
        { vm.updateFurniture { copy(furnitureType = it.lowercase()) } }, Modifier.fillMaxWidth())
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.furnitureDetails.material, onValueChange = { vm.updateFurniture { copy(material = it) } },
            label = { Text("Material") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., Wood, Metal") }, shape = fieldShape)
        OutlinedTextField(value = s.furnitureDetails.color, onValueChange = { vm.updateFurniture { copy(color = it) } },
            label = { Text("Color") }, modifier = Modifier.weight(1f), singleLine = true, shape = fieldShape)
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.furnitureDetails.dimensions, onValueChange = { vm.updateFurniture { copy(dimensions = it) } },
            label = { Text("Dimensions") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., 200x150x80cm") }, shape = fieldShape)
        OutlinedTextField(value = s.furnitureDetails.weight, onValueChange = { vm.updateFurniture { copy(weight = it) } },
            label = { Text("Weight") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., 50kg") }, shape = fieldShape)
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.furnitureDetails.seatingCapacity, onValueChange = { vm.updateFurniture { copy(seatingCapacity = it) } },
            label = { Text("Seating Capacity") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
        OutlinedTextField(value = s.furnitureDetails.style, onValueChange = { vm.updateFurniture { copy(style = it) } },
            label = { Text("Style") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., Modern, Classic") }, shape = fieldShape)
    }
    OutlinedTextField(value = s.furnitureDetails.warrantyMonths, onValueChange = { vm.updateFurniture { copy(warrantyMonths = it) } },
        label = { Text("Warranty (Months)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
    Row(Modifier.fillMaxWidth()) {
        Checkbox(s.furnitureDetails.assemblyRequired, { vm.updateFurniture { copy(assemblyRequired = it) } })
        Text("Assembly Required", modifier = Modifier.padding(top = 14.dp))
    }
}

// ─── FMCG & HOUSEHOLD ───────────────────────────────────
@Composable
fun FmcgDetailsForm(vm: CreateListingViewModel, s: CreateListingState) {
    SectionTitle("FMCG / Household Details")
    DropdownField("Product Type", s.fmcgDetails.productType,
        listOf("Baby Care", "Personal Care", "Household", "Toiletries", "Health & Wellness", "Stationery", "Pet Supplies", "Cosmetics"),
        { vm.updateFmcg { copy(productType = it.lowercase().replace(" & ", "_").replace(" ", "_")) } }, Modifier.fillMaxWidth())
    OutlinedTextField(value = s.fmcgDetails.brand, onValueChange = { vm.updateFmcg { copy(brand = it) } },
        label = { Text("Brand") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.fmcgDetails.weightVolume, onValueChange = { vm.updateFmcg { copy(weightVolume = it) } },
            label = { Text("Weight / Volume") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., 500ml, 200g") }, shape = fieldShape)
        OutlinedTextField(value = s.fmcgDetails.packSize, onValueChange = { vm.updateFmcg { copy(packSize = it) } },
            label = { Text("Pack Size") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., Pack of 12") }, shape = fieldShape)
    }
    OutlinedTextField(value = s.fmcgDetails.ingredients, onValueChange = { vm.updateFmcg { copy(ingredients = it) } },
        label = { Text("Ingredients / Contents (comma-separated, optional)") }, modifier = Modifier.fillMaxWidth(), maxLines = 2, shape = fieldShape)
    OutlinedTextField(value = s.fmcgDetails.expiryDate, onValueChange = { vm.updateFmcg { copy(expiryDate = it) } },
        label = { Text("Expiry Date (YYYY-MM-DD, if applicable)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    OutlinedTextField(value = s.fmcgDetails.certifications, onValueChange = { vm.updateFmcg { copy(certifications = it) } },
        label = { Text("Certifications (comma-separated, optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        placeholder = { Text("e.g., KEBS, ISO") }, shape = fieldShape)
    Row(Modifier.fillMaxWidth()) {
        Checkbox(s.fmcgDetails.isOrganic, { vm.updateFmcg { copy(isOrganic = it) } })
        Text("Organic / Eco-Friendly", modifier = Modifier.padding(top = 14.dp))
    }
}

// ─── GROCERIES ──────────────────────────────────────────
@Composable
fun GroceryDetailsForm(vm: CreateListingViewModel, s: CreateListingState) {
    SectionTitle("Grocery Details")
    DropdownField("Grocery Type", s.groceryDetails.groceryType,
        listOf("Fresh Produce", "Dairy & Eggs", "Meat & Poultry", "Bakery", "Dry Goods", "Canned & Packaged", "Frozen Foods", "Beverages", "Snacks", "Spices & Condiments", "Cooking Oils", "Baby Food"),
        { vm.updateGrocery { copy(groceryType = it.lowercase().replace(" & ", "_").replace(" ", "_")) } }, Modifier.fillMaxWidth())
    OutlinedTextField(value = s.groceryDetails.brand, onValueChange = { vm.updateGrocery { copy(brand = it) } },
        label = { Text("Brand (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.groceryDetails.weightVolume, onValueChange = { vm.updateGrocery { copy(weightVolume = it) } },
            label = { Text("Weight / Volume") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., 1kg, 2L") }, shape = fieldShape)
        OutlinedTextField(value = s.groceryDetails.packSize, onValueChange = { vm.updateGrocery { copy(packSize = it) } },
            label = { Text("Pack Size") }, modifier = Modifier.weight(1f), singleLine = true,
            placeholder = { Text("e.g., 6 units") }, shape = fieldShape)
    }
    OutlinedTextField(value = s.groceryDetails.ingredients, onValueChange = { vm.updateGrocery { copy(ingredients = it) } },
        label = { Text("Ingredients (comma-separated, optional)") }, modifier = Modifier.fillMaxWidth(), maxLines = 2, shape = fieldShape)
    OutlinedTextField(value = s.groceryDetails.allergens, onValueChange = { vm.updateGrocery { copy(allergens = it) } },
        label = { Text("Allergens (comma-separated, optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        placeholder = { Text("e.g., Gluten, Nuts, Dairy") }, shape = fieldShape)
    OutlinedTextField(value = s.groceryDetails.expiryDate, onValueChange = { vm.updateGrocery { copy(expiryDate = it) } },
        label = { Text("Expiry Date (YYYY-MM-DD)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    DropdownField("Storage Type", s.groceryDetails.storageType,
        listOf("Room Temperature", "Refrigerated", "Frozen"),
        { vm.updateGrocery { copy(storageType = it.lowercase().replace(" ", "_")) } }, Modifier.fillMaxWidth())
    OutlinedTextField(value = s.groceryDetails.countryOfOrigin, onValueChange = { vm.updateGrocery { copy(countryOfOrigin = it) } },
        label = { Text("Country of Origin (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Row { Checkbox(s.groceryDetails.isOrganic, { vm.updateGrocery { copy(isOrganic = it) } }); Text("Organic", modifier = Modifier.padding(top = 14.dp)) }
        Row { Checkbox(s.groceryDetails.isHalal, { vm.updateGrocery { copy(isHalal = it) } }); Text("Halal", modifier = Modifier.padding(top = 14.dp)) }
        Row { Checkbox(s.groceryDetails.isVegan, { vm.updateGrocery { copy(isVegan = it) } }); Text("Vegan", modifier = Modifier.padding(top = 14.dp)) }
    }
}

// ─── BOOKS ──────────────────────────────────────────────
@Composable
fun BookDetailsForm(vm: CreateListingViewModel, s: CreateListingState) {
    SectionTitle("Book Details")
    OutlinedTextField(value = s.bookDetails.author, onValueChange = { vm.updateBook { copy(author = it) } },
        label = { Text("Author") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.bookDetails.isbn, onValueChange = { vm.updateBook { copy(isbn = it) } },
            label = { Text("ISBN (optional)") }, modifier = Modifier.weight(1f), singleLine = true, shape = fieldShape)
        OutlinedTextField(value = s.bookDetails.edition, onValueChange = { vm.updateBook { copy(edition = it) } },
            label = { Text("Edition") }, modifier = Modifier.weight(1f), singleLine = true, shape = fieldShape)
    }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.bookDetails.publisher, onValueChange = { vm.updateBook { copy(publisher = it) } },
            label = { Text("Publisher") }, modifier = Modifier.weight(1f), singleLine = true, shape = fieldShape)
        OutlinedTextField(value = s.bookDetails.language, onValueChange = { vm.updateBook { copy(language = it) } },
            label = { Text("Language") }, modifier = Modifier.weight(1f), singleLine = true, shape = fieldShape)
    }
    OutlinedTextField(value = s.bookDetails.pageCount, onValueChange = { vm.updateBook { copy(pageCount = it) } },
        label = { Text("Page Count") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
    DropdownField("Genre", s.bookDetails.genre,
        listOf("Fiction", "Non-Fiction", "Academic", "Children", "Comics", "Religious", "Self-Help", "Biography"),
        { vm.updateBook { copy(genre = it) } }, Modifier.fillMaxWidth())
    Row(Modifier.fillMaxWidth()) {
        Checkbox(s.bookDetails.downloadable, { vm.updateBook { copy(downloadable = it) } })
        Text("Available as E-Book", modifier = Modifier.padding(top = 14.dp))
    }
}

// ─── DIGITAL PRODUCTS ───────────────────────────────────
@Composable
fun DigitalProductDetailsForm(vm: CreateListingViewModel, s: CreateListingState) {
    SectionTitle("Digital Product Details")
    OutlinedTextField(value = s.digitalProductDetails.fileFormat, onValueChange = { vm.updateDigitalProduct { copy(fileFormat = it) } },
        label = { Text("File Format (e.g., PDF, MP3, PSD)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    OutlinedTextField(value = s.digitalProductDetails.fileSizeMb, onValueChange = { vm.updateDigitalProduct { copy(fileSizeMb = it) } },
        label = { Text("File Size (MB)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), shape = fieldShape)
    DropdownField("License Type", s.digitalProductDetails.licenseType,
        listOf("Single Use", "Multi Use", "Unlimited"),
        { vm.updateDigitalProduct { copy(licenseType = it.lowercase().replace(" ", "_")) } }, Modifier.fillMaxWidth())
    OutlinedTextField(value = s.digitalProductDetails.downloadLimit, onValueChange = { vm.updateDigitalProduct { copy(downloadLimit = it) } },
        label = { Text("Download Limit (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
    Row(Modifier.fillMaxWidth()) {
        Checkbox(s.digitalProductDetails.drmProtected, { vm.updateDigitalProduct { copy(drmProtected = it) } })
        Text("DRM Protected", modifier = Modifier.padding(top = 14.dp))
    }
}

// ─── SERVICES ───────────────────────────────────────────
@Composable
fun ServiceDetailsForm(vm: CreateListingViewModel, s: CreateListingState) {
    SectionTitle("Service Details")
    OutlinedTextField(value = s.serviceDetails.serviceType, onValueChange = { vm.updateService { copy(serviceType = it) } },
        label = { Text("Service Type (e.g., Plumbing, Design)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    DropdownField("Delivery Mode", s.serviceDetails.deliveryMode,
        listOf("Online", "On-site", "Both"),
        { vm.updateService { copy(deliveryMode = it.lowercase().replace("-", "")) } }, Modifier.fillMaxWidth())
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(value = s.serviceDetails.durationMinutes, onValueChange = { vm.updateService { copy(durationMinutes = it) } },
            label = { Text("Duration (min)") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
        OutlinedTextField(value = s.serviceDetails.turnaroundDays, onValueChange = { vm.updateService { copy(turnaroundDays = it) } },
            label = { Text("Turnaround (days)") }, modifier = Modifier.weight(1f), singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
    }
    OutlinedTextField(value = s.serviceDetails.availability, onValueChange = { vm.updateService { copy(availability = it) } },
        label = { Text("Availability (e.g., Mon-Fri 9-5)") }, modifier = Modifier.fillMaxWidth(), singleLine = true, shape = fieldShape)
    OutlinedTextField(value = s.serviceDetails.revisionsAllowed, onValueChange = { vm.updateService { copy(revisionsAllowed = it) } },
        label = { Text("Revisions Allowed (optional)") }, modifier = Modifier.fillMaxWidth(), singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = fieldShape)
}
