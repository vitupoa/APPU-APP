package com.krieta.feature.shop.data.remote.dto

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

@Serializable
data class ProductSellerDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null,
    val isVerified: Boolean = false
)

@Serializable
data class ProductDto(
    val id: String,
    val seller: ProductSellerDto,
    val title: String,
    val description: String? = null,
    val imageUrls: List<String> = emptyList(),
    val priceKr: Double,
    val category: String? = null,
    val subcategory: String? = null,
    val condition: String? = null,
    val brand: String? = null,
    val location: String? = null,
    val whatsappNumber: String,
    val status: String = "active",
    val createdAt: String,
    // Category details (optional nested objects)
    val vehicleDetail: VehicleDetailDto? = null,
    val sparePartDetail: SparePartDetailDto? = null,
    val realEstateDetail: RealEstateDetailDto? = null,
    val fashionDetail: FashionDetailDto? = null,
    val shoeDetail: ShoeDetailDto? = null,
    val electronicsDetail: ElectronicsDetailDto? = null,
    val furnitureDetail: FurnitureDetailDto? = null,
    val foodDetail: FoodDetailDto? = null,
    val groceryDetail: GroceryDetailDto? = null,
    val bookDetail: BookDetailDto? = null,
    val digitalProductDetail: DigitalProductDetailDto? = null,
    val serviceDetail: ServiceDetailDto? = null
)

@Serializable
data class ProductListResponseDto(
    val items: List<ProductDto>,
    val nextCursor: String? = null
)

// ─── Category Detail DTOs ───────────────────────────────

@Serializable
data class VehicleDetailDto(
    val vehicleType: String = "car",
    val make: String,
    val model: String,
    val year: Int,
    val mileage: Int? = null,
    val fuelType: String? = null,
    val transmission: String? = null,
    val bodyType: String? = null,
    val engineSize: String? = null,
    val color: String? = null,
    val numberOfOwners: Int? = null,
    val logbookReady: Boolean = false,
    val importStatus: String? = null,
    val accidentHistory: Boolean = false,
    val tradeInEnabled: Boolean = false,
    val swapEnabled: Boolean = false
)

@Serializable
data class SparePartDetailDto(
    val compatibleMakes: List<String> = emptyList(),
    val compatibleModels: List<String> = emptyList(),
    val compatibleYearFrom: Int? = null,
    val compatibleYearTo: Int? = null,
    val partType: String,
    val partNumber: String? = null,
    val oemNumber: String? = null,
    val isGenuine: Boolean = false
)

@Serializable
data class RealEstateDetailDto(
    val propertyType: String,
    val listingType: String,
    val landSize: String? = null,
    val bedrooms: Int? = null,
    val bathrooms: Int? = null,
    val floors: Int? = null,
    val yearBuilt: Int? = null,
    val amenities: List<String> = emptyList(),
    val furnished: Boolean = false,
    val parking: Boolean = false
)

@Serializable
data class ElectronicsDetailDto(
    val processor: String? = null,
    val ram: String? = null,
    val storage: String? = null,
    val screenSize: String? = null,
    val batteryLife: String? = null,
    val os: String? = null,
    val warrantyMonths: Int? = null
)

@Serializable
data class FashionDetailDto(
    val size: String? = null,
    val material: String? = null,
    val colorVariants: List<String>? = null,
    val fitType: String? = null,
    val pattern: String? = null,
    val season: String? = null,
    val gender: String? = null,
    val ageGroup: String? = null,
    val careInstructions: String? = null
)

@Serializable
data class FurnitureDetailDto(
    val furnitureType: String,
    val material: String? = null,
    val color: String? = null,
    val dimensions: String? = null,
    val weight: String? = null,
    val seatingCapacity: Int? = null,
    val assemblyRequired: Boolean = false,
    val style: String? = null,
    val warrantyMonths: Int? = null
)

@Serializable
data class ShoeDetailDto(
    val shoeSize: String,
    val soleMaterial: String? = null,
    val heelHeight: String? = null,
    val closureType: String? = null,
    val waterResistant: Boolean = false,
    val gender: String? = null
)

@Serializable
data class FoodDetailDto(
    val ingredients: List<String> = emptyList(),
    val expiryDate: String? = null,
    val allergens: List<String> = emptyList(),
    val certifications: List<String> = emptyList(),
    val isOrganic: Boolean = false,
    val weightVolume: String? = null
)

@Serializable
data class GroceryDetailDto(
    val groceryType: String,
    val brand: String? = null,
    val weightVolume: String? = null,
    val packSize: String? = null,
    val ingredients: List<String> = emptyList(),
    val allergens: List<String> = emptyList(),
    val expiryDate: String? = null,
    val storageType: String? = null,
    val isOrganic: Boolean = false,
    val isHalal: Boolean = false,
    val isVegan: Boolean = false,
    val countryOfOrigin: String? = null,
    val certifications: List<String> = emptyList()
)

@Serializable
data class BookDetailDto(
    val author: String,
    val isbn: String? = null,
    val publisher: String? = null,
    val edition: String? = null,
    val language: String? = null,
    val pageCount: Int? = null,
    val genre: String? = null,
    val downloadable: Boolean = false
)

@Serializable
data class DigitalProductDetailDto(
    val fileFormat: String,
    val fileSizeMb: Double? = null,
    val licenseType: String,
    val downloadLimit: Int? = null,
    val drmProtected: Boolean = false
)

@Serializable
data class ServiceDetailDto(
    val serviceType: String,
    val deliveryMode: String,
    val durationMinutes: Int? = null,
    val availability: String? = null,
    val revisionsAllowed: Int? = null,
    val turnaroundDays: Int? = null
)

// ─── Request DTOs ───────────────────────────────────────

@Serializable
data class CreateProductRequestDto(
    val title: String,
    val description: String? = null,
    val imageUrls: List<String>,
    val priceKr: Double,
    val wholesalePrice: Double? = null,
    val wholesaleMinQty: Int? = null,
    val bargainEnabled: Boolean = false,
    val bargainMinPrice: Double? = null,
    val category: String,
    val subcategory: String? = null,
    val whatsappNumber: String,
    val brand: String? = null,
    val condition: String? = null,
    val location: String? = null,
    val categoryDetails: JsonObject? = null
)

@Serializable
data class UpdateProductRequestDto(
    val title: String? = null,
    val description: String? = null,
    val imageUrls: List<String>? = null,
    val priceKr: Double? = null,
    val category: String? = null,
    val subcategory: String? = null,
    val whatsappNumber: String? = null,
    val status: String? = null,
    val location: String? = null
)

@Serializable
data class ProductReviewDto(
    val id: String,
    val user: ReviewUserDto,
    val rating: Int,
    val title: String? = null,
    val text: String? = null,
    val videoUrl: String? = null,
    val imageUrls: List<String> = emptyList(),
    val isVerified: Boolean = false,
    val createdAt: String
)

@Serializable
data class ReviewUserDto(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null
)

@Serializable
data class ReviewListResponseDto(
    val items: List<ProductReviewDto>,
    val nextCursor: String? = null
)

@Serializable
data class CreateReviewRequestDto(
    val productId: String,
    val rating: Int,
    val title: String? = null,
    val text: String? = null,
    val videoUrl: String? = null,
    val imageUrls: List<String> = emptyList()
)
