package com.krieta.feature.shop.presentation.viewmodel
import com.krieta.com.core.util.SafeConversion
import cafe.adriel.voyager.core.model.ScreenModel
import cafe.adriel.voyager.core.model.screenModelScope
import com.krieta.com.core.network.NetworkResult
import com.krieta.feature.shop.domain.model.Product
import com.krieta.feature.shop.domain.repository.ShopRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.JsonObject

enum class ProductCategory(val displayName: String, val backendValue: String) {
    VEHICLES("Vehicles", "VEHICLES"),
    SPARE_PARTS("Spare Parts", "SPARE_PARTS"),
    REAL_ESTATE("Real Estate", "REAL_ESTATE"),
    FASHION("Fashion", "FASHION"),
    SHOES("Shoes", "SHOES"),
    ELECTRONICS("Electronics", "ELECTRONICS"),
    FURNITURE("Furniture", "FURNITURE"),
    FOOD_FMCG("FMCG & Household", "FOOD_FMCG"),
    GROCERIES("Food & Groceries", "GROCERIES"),
    BOOKS("Books", "BOOKS"),
    DIGITAL_PRODUCTS("Digital Products", "DIGITAL_PRODUCTS"),
    SERVICES("Services", "SERVICES"),
    OTHER("Other", "OTHER")
}

// Subcategory definitions per category
object CategorySubcategories {
    val map: Map<ProductCategory, List<String>> = mapOf(
        ProductCategory.VEHICLES to listOf("Cars", "Motorcycles", "Trucks", "Buses", "Trailers", "Boats", "Heavy Machinery"),
        ProductCategory.SPARE_PARTS to listOf("Engine Parts", "Body Parts", "Suspension", "Electrical", "Interior", "Tyres & Wheels", "Accessories"),
        ProductCategory.REAL_ESTATE to listOf("Apartments", "Houses", "Land", "Commercial", "Office Space", "Warehouses"),
        ProductCategory.FASHION to listOf(
            // Men
            "Men - Shirts", "Men - T-Shirts", "Men - Trousers", "Men - Jeans", "Men - Suits", "Men - Jackets", "Men - Shorts", "Men - Underwear", "Men - Swimwear", "Men - Traditional",
            // Women
            "Women - Tops", "Women - Blouses", "Women - Dresses", "Women - Skirts", "Women - Trousers", "Women - Jeans", "Women - Jackets", "Women - Lingerie", "Women - Swimwear", "Women - Traditional",
            // Children
            "Boys - Tops", "Boys - Bottoms", "Boys - Outerwear", "Boys - School Uniform",
            "Girls - Tops", "Girls - Dresses", "Girls - Bottoms", "Girls - Outerwear", "Girls - School Uniform",
            // Baby
            "Baby - Rompers", "Baby - Onesies", "Baby - Sets",
            // Unisex / Other
            "Unisex - Hoodies", "Unisex - Activewear", "Unisex - Sleepwear", "Accessories",
            // Plus Size / Special Sizes
            "Size - X", "Size - XX", "Size - XXL", "Size - XXXL", "Plus Size"
        ),
        ProductCategory.SHOES to listOf("Sneakers", "Formal", "Boots", "Sandals", "Heels", "Sports", "Slides"),
        ProductCategory.ELECTRONICS to listOf("Phones", "Laptops", "Tablets", "TVs", "Audio", "Gaming", "Cameras", "Accessories"),
        ProductCategory.FURNITURE to listOf("Living Room", "Bedroom", "Dining", "Office", "Outdoor", "Kitchen", "Storage", "Kids", "Bathroom"),
        ProductCategory.FOOD_FMCG to listOf("Baby Care", "Personal Care", "Household & Cleaning", "Toiletries", "Health & Wellness", "Stationery", "Pet Supplies", "Cosmetics"),
        ProductCategory.GROCERIES to listOf("Fresh Produce", "Dairy & Eggs", "Meat & Poultry", "Bakery", "Dry Goods & Grains", "Canned & Packaged", "Frozen Foods", "Beverages", "Snacks", "Spices & Condiments", "Cooking Oils", "Baby Food"),
        ProductCategory.BOOKS to listOf("Fiction", "Non-Fiction", "Academic", "Children", "Comics", "Religious", "Self-Help"),
        ProductCategory.DIGITAL_PRODUCTS to listOf("Software", "Templates", "Music", "Graphics", "Courses", "E-Books", "Presets"),
        ProductCategory.SERVICES to listOf("Tutoring", "Repair", "Beauty", "Cleaning", "Photography", "Design", "Consulting"),
    )
}

data class VehicleDetails(
    val vehicleType: String = "car",
    val make: String = "",
    val model: String = "",
    val year: String = "",
    val mileage: String = "",
    val fuelType: String = "",
    val transmission: String = "",
    val bodyType: String = "",
    val engineSize: String = "",
    val color: String = "",
    val numberOfOwners: String = "",
    val logbookReady: Boolean = false,
    val importStatus: String = "",
    val accidentHistory: Boolean = false,
    val tradeInEnabled: Boolean = false,
    val swapEnabled: Boolean = false
)

data class SparePartDetails(
    val compatibleMakes: List<String> = emptyList(),
    val compatibleModels: List<String> = emptyList(),
    val compatibleYearFrom: String = "",
    val compatibleYearTo: String = "",
    val partType: String = "",
    val partNumber: String = "",
    val oemNumber: String = "",
    val isGenuine: Boolean = false,
    val position: String = "" // left, right, front, rear
)

data class RealEstateDetails(
    val propertyType: String = "",
    val listingType: String = "",
    val landSize: String = "",
    val bedrooms: String = "",
    val bathrooms: String = "",
    val floors: String = "",
    val yearBuilt: String = "",
    val amenities: List<String> = emptyList(),
    val furnished: Boolean = false,
    val parking: Boolean = false
)

data class ElectronicsDetails(
    val brand: String = "",
    val model: String = "",
    val processor: String = "",
    val ram: String = "",
    val storage: String = "",
    val screenSize: String = "",
    val batteryLife: String = "",
    val os: String = "",
    val warrantyMonths: String = "",
    val condition: String = ""
)

data class FashionDetails(
    val brand: String = "",
    val size: String = "",
    val color: String = "",
    val material: String = "",
    val gender: String = "",    // men, women, boys, girls, baby, unisex
    val ageGroup: String = "",  // adult, teen, children, baby
    val fitType: String = "",
    val pattern: String = "",
    val season: String = "",
    val careInstructions: String = ""
)

data class FurnitureDetails(
    val furnitureType: String = "",  // sofa, bed, table, chair, cabinet, desk, shelf, etc.
    val material: String = "",       // wood, metal, fabric, leather, glass, plastic
    val color: String = "",
    val dimensions: String = "",     // e.g., 200x150x80cm
    val weight: String = "",
    val seatingCapacity: String = "",
    val assemblyRequired: Boolean = false,
    val style: String = "",          // modern, classic, minimalist, industrial, rustic
    val warrantyMonths: String = ""
)

data class ShoeDetails(
    val shoeSize: String = "",
    val soleMaterial: String = "",
    val heelHeight: String = "",
    val closureType: String = "",
    val waterResistant: Boolean = false,
    val gender: String = ""
)

data class FmcgDetails(
    val productType: String = "", // baby_care, personal_care, household, toiletries, etc.
    val brand: String = "",
    val weightVolume: String = "",
    val ingredients: String = "",
    val expiryDate: String = "",
    val allergens: String = "",
    val certifications: String = "",
    val isOrganic: Boolean = false,
    val packSize: String = "" // e.g., "Pack of 6", "12 rolls"
)

data class GroceryDetails(
    val groceryType: String = "", // fresh_produce, dry_goods, frozen, canned, dairy, bakery, beverages, snacks
    val brand: String = "",
    val weightVolume: String = "",
    val packSize: String = "",
    val ingredients: String = "",
    val allergens: String = "",
    val expiryDate: String = "",
    val storageType: String = "", // room_temp, refrigerated, frozen
    val isOrganic: Boolean = false,
    val isHalal: Boolean = false,
    val isVegan: Boolean = false,
    val countryOfOrigin: String = ""
)

data class BookDetails(
    val author: String = "",
    val isbn: String = "",
    val publisher: String = "",
    val edition: String = "",
    val language: String = "",
    val pageCount: String = "",
    val genre: String = "",
    val downloadable: Boolean = false
)

data class DigitalProductDetails(
    val fileFormat: String = "",
    val fileSizeMb: String = "",
    val licenseType: String = "",
    val downloadLimit: String = "",
    val drmProtected: Boolean = false
)

data class ServiceDetails(
    val serviceType: String = "",
    val deliveryMode: String = "",
    val durationMinutes: String = "",
    val availability: String = "",
    val revisionsAllowed: String = "",
    val turnaroundDays: String = ""
)

data class CreateListingState(
    val title: String = "",
    val description: String = "",
    val imageUrls: List<String> = emptyList(),
    val priceKr: String = "",
    val wholesalePrice: String = "",
    val wholesaleMinQty: String = "",
    val bargainEnabled: Boolean = false,
    val bargainMinPrice: String = "",
    val selectedCategory: ProductCategory? = null,
    val selectedSubcategory: String = "",
    val customCategory: String = "",
    val whatsappNumber: String = "",
    val conditionField: String = "",
    val location: String = "",
    // Category details
    val vehicleDetails: VehicleDetails = VehicleDetails(),
    val sparePartDetails: SparePartDetails = SparePartDetails(),
    val realEstateDetails: RealEstateDetails = RealEstateDetails(),
    val electronicsDetails: ElectronicsDetails = ElectronicsDetails(),
    val fashionDetails: FashionDetails = FashionDetails(),
    val furnitureDetails: FurnitureDetails = FurnitureDetails(),
    val shoeDetails: ShoeDetails = ShoeDetails(),
    val fmcgDetails: FmcgDetails = FmcgDetails(),
    val groceryDetails: GroceryDetails = GroceryDetails(),
    val bookDetails: BookDetails = BookDetails(),
    val digitalProductDetails: DigitalProductDetails = DigitalProductDetails(),
    val serviceDetails: ServiceDetails = ServiceDetails(),
    val customCategories: List<String> = emptyList(),
    val isSaving: Boolean = false,
    val saveSuccess: Boolean = false,
    val error: String? = null
)

class CreateListingViewModel(
    private val repository: ShopRepository,
    private val cloudinaryUploader: com.krieta.com.core.network.CloudinaryUploader
) : ScreenModel {

    private val _state = MutableStateFlow(CreateListingState())
    val state: StateFlow<CreateListingState> = _state.asStateFlow()

    // Common fields
    fun onTitleChange(v: String) { _state.value = _state.value.copy(title = v) }
    fun onDescriptionChange(v: String) { _state.value = _state.value.copy(description = v) }
    fun onPriceChange(v: String) { _state.value = _state.value.copy(priceKr = v) }
    fun onWholesalePriceChange(v: String) { _state.value = _state.value.copy(wholesalePrice = v) }
    fun onWholesaleMinQtyChange(v: String) { _state.value = _state.value.copy(wholesaleMinQty = v) }
    fun onBargainEnabledChange(v: Boolean) { _state.value = _state.value.copy(bargainEnabled = v) }
    fun onBargainMinPriceChange(v: String) { _state.value = _state.value.copy(bargainMinPrice = v) }
    fun onCategoryChange(category: ProductCategory?) {
        _state.value = _state.value.copy(selectedCategory = category, selectedSubcategory = "")
    }
    fun onSubcategoryChange(v: String) { _state.value = _state.value.copy(selectedSubcategory = v) }
    fun onCustomCategoryChange(v: String) {
        _state.value = _state.value.copy(customCategory = sanitizeInput(v))
    }
    fun onWhatsappChange(v: String) { _state.value = _state.value.copy(whatsappNumber = v) }
    fun onConditionChange(v: String) { _state.value = _state.value.copy(conditionField = v) }
    fun onLocationChange(v: String) { _state.value = _state.value.copy(location = v) }

    // Vehicle
    fun updateVehicle(fn: VehicleDetails.() -> VehicleDetails) {
        _state.value = _state.value.copy(vehicleDetails = _state.value.vehicleDetails.fn())
    }
    // Backward-compat helpers used by screen
    fun onVehicleMakeChange(v: String) = updateVehicle { copy(make = v) }
    fun onVehicleModelChange(v: String) = updateVehicle { copy(model = v) }
    fun onVehicleYearChange(v: String) = updateVehicle { copy(year = v) }
    fun onVehicleMileageChange(v: String) = updateVehicle { copy(mileage = v) }
    fun onVehicleFuelTypeChange(v: String) = updateVehicle { copy(fuelType = v) }
    fun onVehicleTransmissionChange(v: String) = updateVehicle { copy(transmission = v) }
    fun onVehicleBodyTypeChange(v: String) = updateVehicle { copy(bodyType = v) }
    fun onVehicleEngineSizeChange(v: String) = updateVehicle { copy(engineSize = v) }
    fun onVehicleColorChange(v: String) = updateVehicle { copy(color = v) }

    // Spare Parts
    fun updateSparePart(fn: SparePartDetails.() -> SparePartDetails) {
        _state.value = _state.value.copy(sparePartDetails = _state.value.sparePartDetails.fn())
    }

    // Real Estate
    fun updateRealEstate(fn: RealEstateDetails.() -> RealEstateDetails) {
        _state.value = _state.value.copy(realEstateDetails = _state.value.realEstateDetails.fn())
    }

    // Electronics
    fun updateElectronics(fn: ElectronicsDetails.() -> ElectronicsDetails) {
        _state.value = _state.value.copy(electronicsDetails = _state.value.electronicsDetails.fn())
    }
    fun onElectronicsBrandChange(v: String) = updateElectronics { copy(brand = v) }
    fun onElectronicsModelChange(v: String) = updateElectronics { copy(model = v) }
    fun onElectronicsProcessorChange(v: String) = updateElectronics { copy(processor = v) }
    fun onElectronicsRamChange(v: String) = updateElectronics { copy(ram = v) }
    fun onElectronicsStorageChange(v: String) = updateElectronics { copy(storage = v) }
    fun onElectronicsScreenSizeChange(v: String) = updateElectronics { copy(screenSize = v) }
    fun onElectronicsConditionChange(v: String) = updateElectronics { copy(condition = v) }

    // Fashion
    fun updateFashion(fn: FashionDetails.() -> FashionDetails) {
        _state.value = _state.value.copy(fashionDetails = _state.value.fashionDetails.fn())
    }
    fun onFashionBrandChange(v: String) = updateFashion { copy(brand = v) }
    fun onFashionSizeChange(v: String) = updateFashion { copy(size = v) }
    fun onFashionColorChange(v: String) = updateFashion { copy(color = v) }
    fun onFashionMaterialChange(v: String) = updateFashion { copy(material = v) }
    fun onFashionGenderChange(v: String) = updateFashion { copy(gender = v) }

    // Furniture
    fun updateFurniture(fn: FurnitureDetails.() -> FurnitureDetails) {
        _state.value = _state.value.copy(furnitureDetails = _state.value.furnitureDetails.fn())
    }

    // Shoes
    fun updateShoe(fn: ShoeDetails.() -> ShoeDetails) {
        _state.value = _state.value.copy(shoeDetails = _state.value.shoeDetails.fn())
    }

    // FMCG
    fun updateFmcg(fn: FmcgDetails.() -> FmcgDetails) {
        _state.value = _state.value.copy(fmcgDetails = _state.value.fmcgDetails.fn())
    }

    // Groceries
    fun updateGrocery(fn: GroceryDetails.() -> GroceryDetails) {
        _state.value = _state.value.copy(groceryDetails = _state.value.groceryDetails.fn())
    }

    // Books
    fun updateBook(fn: BookDetails.() -> BookDetails) {
        _state.value = _state.value.copy(bookDetails = _state.value.bookDetails.fn())
    }

    // Digital Products
    fun updateDigitalProduct(fn: DigitalProductDetails.() -> DigitalProductDetails) {
        _state.value = _state.value.copy(digitalProductDetails = _state.value.digitalProductDetails.fn())
    }

    // Services
    fun updateService(fn: ServiceDetails.() -> ServiceDetails) {
        _state.value = _state.value.copy(serviceDetails = _state.value.serviceDetails.fn())
    }

    fun addCustomCategory() {
        val custom = _state.value.customCategory.trim()
        if (custom.isNotBlank() && isValidCategoryName(custom) && !_state.value.customCategories.contains(custom)) {
            _state.value = _state.value.copy(
                customCategories = _state.value.customCategories + custom,
                customCategory = ""
            )
        } else if (!isValidCategoryName(custom)) {
            _state.value = _state.value.copy(error = "Invalid category name. Only letters, numbers, spaces, and basic punctuation allowed.")
        }
    }

    private fun sanitizeInput(input: String): String {
        return input.filter { char ->
            char.isLetterOrDigit() || char.isWhitespace() || char in ".,&-'"
        }.take(50)
    }

    private fun isValidCategoryName(name: String): Boolean {
        if (name.length > 50) return false
        val validPattern = Regex("^[a-zA-Z0-9\\s.,&'-]+$")
        return validPattern.matches(name)
    }

    fun uploadImage(filePath: String) {
        val current = _state.value.imageUrls
        if (current.size < 10) {
            screenModelScope.launch {
                _state.value = _state.value.copy(isSaving = true, error = null)
                when (val result = cloudinaryUploader.uploadMedia(com.krieta.com.core.network.ApiConstants.CloudinaryFolders.SHOP_PHOTO, filePath, isVideo = false)) {
                    is NetworkResult.Success -> {
                        _state.value = _state.value.copy(
                            imageUrls = current + result.data,
                            isSaving = false
                        )
                    }
                    is NetworkResult.Error -> {
                        _state.value = _state.value.copy(isSaving = false, error = "Failed to upload image: ${result.message}")
                    }
                    is NetworkResult.Loading -> {}
                }
            }
        }
    }

    fun removeImageUrl(index: Int) {
        val current = _state.value.imageUrls.toMutableList()
        if (index in current.indices) {
            current.removeAt(index)
            _state.value = _state.value.copy(imageUrls = current)
        }
    }

    fun save() {
        val s = _state.value
        if (s.title.isBlank() || s.imageUrls.isEmpty() || s.whatsappNumber.isBlank()) {
            _state.value = s.copy(error = "Title, at least 1 image, and WhatsApp number are required")
            return
        }
        if (s.selectedCategory == null) {
            _state.value = s.copy(error = "Please select a category")
            return
        }

        // Validate pricing: either retail price or wholesale price must be set
        val hasRetailPrice = s.priceKr.isNotBlank()
        val hasWholesalePrice = s.wholesalePrice.isNotBlank() && s.wholesaleMinQty.isNotBlank()
        
        if (!hasRetailPrice && !hasWholesalePrice) {
            _state.value = s.copy(error = "Please enter either retail price or wholesale price with minimum quantity")
            return
        }

        val price = if (hasRetailPrice) {
            SafeConversion.toDoubleOrDefaultWithValidation(s.priceKr, "productPrice", 0.0, defaultValue = 0.0)
        } else {
            0.0 // Will use wholesale price as main price
        }

        screenModelScope.launch {
            _state.value = s.copy(isSaving = true, error = null)

            val categoryDetails = buildCategoryDetailsJson(s)
            val brand = extractBrand(s)
            val condition = extractCondition(s)

            val result = (repository as com.krieta.feature.shop.data.repository.ShopRepositoryImpl).createProductWithDetails(
                title = s.title,
                description = s.description.ifBlank { null },
                imageUrls = s.imageUrls,
                priceKr = if (hasRetailPrice) price else SafeConversion.toDoubleOrDefaultWithValidation(s.wholesalePrice, "wholesalePrice", 0.0, defaultValue = 0.0),
                wholesalePrice = if (s.wholesalePrice.isNotBlank()) SafeConversion.toDoubleOrDefaultWithValidation(s.wholesalePrice, "wholesalePrice", 0.0, defaultValue = null) else null,
                wholesaleMinQty = if (s.wholesaleMinQty.isNotBlank()) s.wholesaleMinQty.toIntOrNull() else null,
                bargainEnabled = s.bargainEnabled,
                bargainMinPrice = if (s.bargainMinPrice.isNotBlank()) SafeConversion.toDoubleOrDefaultWithValidation(s.bargainMinPrice, "bargainMinPrice", 0.0, defaultValue = null) else null,
                category = s.selectedCategory.backendValue,
                whatsappNumber = s.whatsappNumber,
                brand = brand,
                condition = condition,
                categoryDetails = categoryDetails,
                subcategory = s.selectedSubcategory.ifBlank { null },
                location = s.location.ifBlank { null }
            )

            when (result) {
                is NetworkResult.Success -> {
                    _state.value = _state.value.copy(isSaving = false, saveSuccess = true)
                }
                is NetworkResult.Error -> {
                    _state.value = _state.value.copy(isSaving = false, error = result.message)
                }
                is NetworkResult.Loading -> {}
            }
        }
    }

    private fun buildCategoryDetailsJson(s: CreateListingState): JsonObject? {
        return when (s.selectedCategory) {
            ProductCategory.VEHICLES -> {
                val v = s.vehicleDetails
                if (v.make.isBlank() || v.model.isBlank() || v.year.isBlank()) return null
                buildJsonObject {
                    put("vehicleType", JsonPrimitive(v.vehicleType.ifBlank { "car" }))
                    put("make", JsonPrimitive(v.make))
                    put("model", JsonPrimitive(v.model))
                    put("year", JsonPrimitive(v.year.toIntOrNull() ?: 2020))
                    if (v.mileage.isNotBlank()) put("mileage", JsonPrimitive(v.mileage.toIntOrNull()))
                    if (v.fuelType.isNotBlank()) put("fuelType", JsonPrimitive(v.fuelType.uppercase()))
                    if (v.transmission.isNotBlank()) put("transmission", JsonPrimitive(v.transmission.uppercase()))
                    if (v.bodyType.isNotBlank()) put("bodyType", JsonPrimitive(v.bodyType.uppercase()))
                    if (v.engineSize.isNotBlank()) put("engineSize", JsonPrimitive(v.engineSize))
                    if (v.color.isNotBlank()) put("color", JsonPrimitive(v.color))
                    if (v.numberOfOwners.isNotBlank()) put("numberOfOwners", JsonPrimitive(v.numberOfOwners.toIntOrNull()))
                    put("logbookReady", JsonPrimitive(v.logbookReady))
                    if (v.importStatus.isNotBlank()) put("importStatus", JsonPrimitive(v.importStatus))
                    put("accidentHistory", JsonPrimitive(v.accidentHistory))
                    put("tradeInEnabled", JsonPrimitive(v.tradeInEnabled))
                    put("swapEnabled", JsonPrimitive(v.swapEnabled))
                }
            }
            ProductCategory.SPARE_PARTS -> {
                val sp = s.sparePartDetails
                if (sp.partType.isBlank()) return null
                buildJsonObject {
                    put("compatibleMakes", buildJsonArray { sp.compatibleMakes.forEach { add(JsonPrimitive(it)) } })
                    put("compatibleModels", buildJsonArray { sp.compatibleModels.forEach { add(JsonPrimitive(it)) } })
                    if (sp.compatibleYearFrom.isNotBlank()) put("compatibleYearFrom", JsonPrimitive(sp.compatibleYearFrom.toIntOrNull()))
                    if (sp.compatibleYearTo.isNotBlank()) put("compatibleYearTo", JsonPrimitive(sp.compatibleYearTo.toIntOrNull()))
                    put("partType", JsonPrimitive(sp.partType))
                    if (sp.partNumber.isNotBlank()) put("partNumber", JsonPrimitive(sp.partNumber))
                    if (sp.oemNumber.isNotBlank()) put("oemNumber", JsonPrimitive(sp.oemNumber))
                    put("isGenuine", JsonPrimitive(sp.isGenuine))
                }
            }
            ProductCategory.REAL_ESTATE -> {
                val re = s.realEstateDetails
                if (re.propertyType.isBlank() || re.listingType.isBlank()) return null
                buildJsonObject {
                    put("propertyType", JsonPrimitive(re.propertyType))
                    put("listingType", JsonPrimitive(re.listingType))
                    if (re.landSize.isNotBlank()) put("landSize", JsonPrimitive(re.landSize))
                    if (re.bedrooms.isNotBlank()) put("bedrooms", JsonPrimitive(re.bedrooms.toIntOrNull()))
                    if (re.bathrooms.isNotBlank()) put("bathrooms", JsonPrimitive(re.bathrooms.toIntOrNull()))
                    if (re.floors.isNotBlank()) put("floors", JsonPrimitive(re.floors.toIntOrNull()))
                    if (re.yearBuilt.isNotBlank()) put("yearBuilt", JsonPrimitive(re.yearBuilt.toIntOrNull()))
                    if (re.amenities.isNotEmpty()) put("amenities", buildJsonArray { re.amenities.forEach { add(JsonPrimitive(it)) } })
                    put("furnished", JsonPrimitive(re.furnished))
                    put("parking", JsonPrimitive(re.parking))
                }
            }
            ProductCategory.ELECTRONICS -> {
                val e = s.electronicsDetails
                buildJsonObject {
                    if (e.processor.isNotBlank()) put("processor", JsonPrimitive(e.processor))
                    if (e.ram.isNotBlank()) put("ram", JsonPrimitive(e.ram))
                    if (e.storage.isNotBlank()) put("storage", JsonPrimitive(e.storage))
                    if (e.screenSize.isNotBlank()) put("screenSize", JsonPrimitive(e.screenSize))
                    if (e.batteryLife.isNotBlank()) put("batteryLife", JsonPrimitive(e.batteryLife))
                    if (e.os.isNotBlank()) put("os", JsonPrimitive(e.os))
                    if (e.warrantyMonths.isNotBlank()) put("warrantyMonths", JsonPrimitive(e.warrantyMonths.toIntOrNull()))
                }
            }
            ProductCategory.FASHION -> {
                val f = s.fashionDetails
                buildJsonObject {
                    if (f.size.isNotBlank()) put("size", JsonPrimitive(f.size))
                    if (f.material.isNotBlank()) put("material", JsonPrimitive(f.material))
                    if (f.color.isNotBlank()) put("colorVariants", buildJsonArray { add(JsonPrimitive(f.color)) })
                    if (f.gender.isNotBlank()) put("gender", JsonPrimitive(f.gender.lowercase()))
                    if (f.ageGroup.isNotBlank()) put("ageGroup", JsonPrimitive(f.ageGroup.lowercase()))
                    if (f.fitType.isNotBlank()) put("fitType", JsonPrimitive(f.fitType))
                    if (f.pattern.isNotBlank()) put("pattern", JsonPrimitive(f.pattern))
                    if (f.season.isNotBlank()) put("season", JsonPrimitive(f.season))
                    if (f.careInstructions.isNotBlank()) put("careInstructions", JsonPrimitive(f.careInstructions))
                }
            }
            ProductCategory.FURNITURE -> {
                val fu = s.furnitureDetails
                if (fu.furnitureType.isBlank()) return null
                buildJsonObject {
                    put("furnitureType", JsonPrimitive(fu.furnitureType))
                    if (fu.material.isNotBlank()) put("material", JsonPrimitive(fu.material))
                    if (fu.color.isNotBlank()) put("color", JsonPrimitive(fu.color))
                    if (fu.dimensions.isNotBlank()) put("dimensions", JsonPrimitive(fu.dimensions))
                    if (fu.weight.isNotBlank()) put("weight", JsonPrimitive(fu.weight))
                    if (fu.seatingCapacity.isNotBlank()) put("seatingCapacity", JsonPrimitive(fu.seatingCapacity.toIntOrNull()))
                    put("assemblyRequired", JsonPrimitive(fu.assemblyRequired))
                    if (fu.style.isNotBlank()) put("style", JsonPrimitive(fu.style))
                    if (fu.warrantyMonths.isNotBlank()) put("warrantyMonths", JsonPrimitive(fu.warrantyMonths.toIntOrNull()))
                }
            }
            ProductCategory.SHOES -> {
                val sh = s.shoeDetails
                if (sh.shoeSize.isBlank()) return null
                buildJsonObject {
                    put("shoeSize", JsonPrimitive(sh.shoeSize))
                    if (sh.soleMaterial.isNotBlank()) put("soleMaterial", JsonPrimitive(sh.soleMaterial))
                    if (sh.heelHeight.isNotBlank()) put("heelHeight", JsonPrimitive(sh.heelHeight))
                    if (sh.closureType.isNotBlank()) put("closureType", JsonPrimitive(sh.closureType))
                    put("waterResistant", JsonPrimitive(sh.waterResistant))
                    if (sh.gender.isNotBlank()) put("gender", JsonPrimitive(sh.gender.lowercase()))
                }
            }
            ProductCategory.FOOD_FMCG -> {
                val fd = s.fmcgDetails
                buildJsonObject {
                    if (fd.productType.isNotBlank()) put("productType", JsonPrimitive(fd.productType))
                    if (fd.brand.isNotBlank()) put("brand", JsonPrimitive(fd.brand))
                    if (fd.weightVolume.isNotBlank()) put("weightVolume", JsonPrimitive(fd.weightVolume))
                    if (fd.packSize.isNotBlank()) put("packSize", JsonPrimitive(fd.packSize))
                    if (fd.ingredients.isNotBlank()) put("ingredients", buildJsonArray { fd.ingredients.split(",").map { it.trim() }.filter { it.isNotBlank() }.forEach { add(JsonPrimitive(it)) } })
                    if (fd.expiryDate.isNotBlank()) put("expiryDate", JsonPrimitive(fd.expiryDate))
                    if (fd.allergens.isNotBlank()) put("allergens", buildJsonArray { fd.allergens.split(",").map { it.trim() }.filter { it.isNotBlank() }.forEach { add(JsonPrimitive(it)) } })
                    if (fd.certifications.isNotBlank()) put("certifications", buildJsonArray { fd.certifications.split(",").map { it.trim() }.filter { it.isNotBlank() }.forEach { add(JsonPrimitive(it)) } })
                    put("isOrganic", JsonPrimitive(fd.isOrganic))
                }
            }
            ProductCategory.GROCERIES -> {
                val g = s.groceryDetails
                if (g.groceryType.isBlank()) return null
                buildJsonObject {
                    put("groceryType", JsonPrimitive(g.groceryType))
                    if (g.brand.isNotBlank()) put("brand", JsonPrimitive(g.brand))
                    if (g.weightVolume.isNotBlank()) put("weightVolume", JsonPrimitive(g.weightVolume))
                    if (g.packSize.isNotBlank()) put("packSize", JsonPrimitive(g.packSize))
                    if (g.ingredients.isNotBlank()) put("ingredients", buildJsonArray { g.ingredients.split(",").map { it.trim() }.filter { it.isNotBlank() }.forEach { add(JsonPrimitive(it)) } })
                    if (g.allergens.isNotBlank()) put("allergens", buildJsonArray { g.allergens.split(",").map { it.trim() }.filter { it.isNotBlank() }.forEach { add(JsonPrimitive(it)) } })
                    if (g.expiryDate.isNotBlank()) put("expiryDate", JsonPrimitive(g.expiryDate))
                    if (g.storageType.isNotBlank()) put("storageType", JsonPrimitive(g.storageType))
                    put("isOrganic", JsonPrimitive(g.isOrganic))
                    put("isHalal", JsonPrimitive(g.isHalal))
                    put("isVegan", JsonPrimitive(g.isVegan))
                    if (g.countryOfOrigin.isNotBlank()) put("countryOfOrigin", JsonPrimitive(g.countryOfOrigin))
                }
            }
            ProductCategory.BOOKS -> {
                val b = s.bookDetails
                if (b.author.isBlank()) return null
                buildJsonObject {
                    put("author", JsonPrimitive(b.author))
                    if (b.isbn.isNotBlank()) put("isbn", JsonPrimitive(b.isbn))
                    if (b.publisher.isNotBlank()) put("publisher", JsonPrimitive(b.publisher))
                    if (b.edition.isNotBlank()) put("edition", JsonPrimitive(b.edition))
                    if (b.language.isNotBlank()) put("language", JsonPrimitive(b.language))
                    if (b.pageCount.isNotBlank()) put("pageCount", JsonPrimitive(b.pageCount.toIntOrNull()))
                    if (b.genre.isNotBlank()) put("genre", JsonPrimitive(b.genre))
                    put("downloadable", JsonPrimitive(b.downloadable))
                }
            }
            ProductCategory.DIGITAL_PRODUCTS -> {
                val dp = s.digitalProductDetails
                if (dp.fileFormat.isBlank() || dp.licenseType.isBlank()) return null
                buildJsonObject {
                    put("fileFormat", JsonPrimitive(dp.fileFormat))
                    if (dp.fileSizeMb.isNotBlank()) put("fileSizeMb", JsonPrimitive(dp.fileSizeMb.toDoubleOrNull()))
                    put("licenseType", JsonPrimitive(dp.licenseType))
                    if (dp.downloadLimit.isNotBlank()) put("downloadLimit", JsonPrimitive(dp.downloadLimit.toIntOrNull()))
                    put("drmProtected", JsonPrimitive(dp.drmProtected))
                }
            }
            ProductCategory.SERVICES -> {
                val sv = s.serviceDetails
                if (sv.serviceType.isBlank() || sv.deliveryMode.isBlank()) return null
                buildJsonObject {
                    put("serviceType", JsonPrimitive(sv.serviceType))
                    put("deliveryMode", JsonPrimitive(sv.deliveryMode))
                    if (sv.durationMinutes.isNotBlank()) put("durationMinutes", JsonPrimitive(sv.durationMinutes.toIntOrNull()))
                    if (sv.availability.isNotBlank()) put("availability", JsonPrimitive(sv.availability))
                    if (sv.revisionsAllowed.isNotBlank()) put("revisionsAllowed", JsonPrimitive(sv.revisionsAllowed.toIntOrNull()))
                    if (sv.turnaroundDays.isNotBlank()) put("turnaroundDays", JsonPrimitive(sv.turnaroundDays.toIntOrNull()))
                }
            }
            else -> null
        }
    }

    private fun extractBrand(s: CreateListingState): String? {
        return when (s.selectedCategory) {
            ProductCategory.ELECTRONICS -> s.electronicsDetails.brand.ifBlank { null }
            ProductCategory.FASHION -> s.fashionDetails.brand.ifBlank { null }
            else -> null
        }
    }

    private fun extractCondition(s: CreateListingState): String? {
        return when (s.selectedCategory) {
            ProductCategory.ELECTRONICS -> s.electronicsDetails.condition.ifBlank { null }
            ProductCategory.VEHICLES -> "USED"
            else -> s.conditionField.ifBlank { "NEW" }
        }
    }
}
