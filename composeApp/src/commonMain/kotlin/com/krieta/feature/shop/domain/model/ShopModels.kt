package com.krieta.feature.shop.domain.model

import kotlinx.serialization.Serializable

@Serializable
data class ProductSeller(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String?,
    val isVerified: Boolean
)

@Serializable
data class Product(
    val id: String,
    val seller: ProductSeller,
    val title: String,
    val description: String?,
    val imageUrls: List<String>,
    val priceKr: Double,
    val currency: String? = null,
    val localPrice: Double? = null,
    val wholesalePrice: Double? = null,
    val wholesaleMinQty: Int? = null,
    val bargainEnabled: Boolean = false,
    val bargainMinPrice: Double? = null,
    val category: String?,
    val subcategory: String? = null,
    val condition: String? = null,
    val brand: String? = null,
    val tags: List<String> = emptyList(),
    val whatsappNumber: String,
    val purchaseUrl: String? = null,
    val contactMethod: String = "WHATSAPP",
    val location: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val stock: Int = 1,
    val viewCount: Int = 0,
    val salesCount: Int = 0,
    val avgRating: Double = 0.0,
    val reviewCount: Int = 0,
    val isFeatured: Boolean = false,
    val isPromoted: Boolean = false,
    val isTopSpot: Boolean = false,
    val status: String,
    val createdAt: String,
    val vehicleDetail: VehicleDetail? = null,
    val sparePartDetail: SparePartDetail? = null,
    val realEstateDetail: RealEstateDetail? = null,
    val fashionDetail: FashionDetail? = null,
    val shoeDetail: ShoeDetail? = null,
    val electronicsDetail: ElectronicsDetail? = null,
    val foodDetail: FoodDetail? = null,
    val bookDetail: BookDetail? = null,
    val digitalProductDetail: DigitalProductDetail? = null,
    val serviceDetail: ServiceDetail? = null
)

@Serializable
data class ProductReview(
    val id: String,
    val user: ReviewUser,
    val rating: Int,
    val title: String? = null,
    val text: String? = null,
    val videoUrl: String? = null,
    val imageUrls: List<String> = emptyList(),
    val isVerified: Boolean = false,
    val createdAt: String
)

@Serializable
data class ReviewUser(
    val id: String,
    val username: String,
    val displayName: String,
    val avatarUrl: String? = null
)

@Serializable
data class ReviewListResult(
    val items: List<ProductReview>,
    val nextCursor: String? = null
)

@Serializable
data class VehicleDetail(
    val vehicleType: String,
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
    val logbookReady: Boolean = false
)

@Serializable
data class SparePartDetail(
    val compatibleMakes: List<String>,
    val compatibleModels: List<String>,
    val partType: String,
    val partNumber: String? = null,
    val isGenuine: Boolean = false
)

@Serializable
data class RealEstateDetail(
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
data class FashionDetail(
    val size: String? = null,
    val material: String? = null,
    val colorVariants: List<String> = emptyList(),
    val fitType: String? = null,
    val gender: String? = null
)

@Serializable
data class ShoeDetail(
    val shoeSize: String,
    val soleMaterial: String? = null,
    val heelHeight: String? = null,
    val closureType: String? = null,
    val waterResistant: Boolean = false,
    val gender: String? = null
)

@Serializable
data class ElectronicsDetail(
    val processor: String? = null,
    val ram: String? = null,
    val storage: String? = null,
    val screenSize: String? = null,
    val batteryLife: String? = null,
    val os: String? = null,
    val connectivity: List<String> = emptyList(),
    val warrantyMonths: Int? = null
)

@Serializable
data class FoodDetail(
    val ingredients: List<String> = emptyList(),
    val expiryDate: String? = null,
    val allergens: List<String> = emptyList(),
    val certifications: List<String> = emptyList(),
    val isOrganic: Boolean = false,
    val weightVolume: String? = null
)

@Serializable
data class BookDetail(
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
data class DigitalProductDetail(
    val fileFormat: String,
    val fileSizeMb: Double? = null,
    val licenseType: String,
    val downloadLimit: Int? = null,
    val drmProtected: Boolean = false
)

@Serializable
data class ServiceDetail(
    val serviceType: String,
    val deliveryMode: String,
    val durationMinutes: Int? = null,
    val availability: String? = null,
    val revisionsAllowed: Int? = null,
    val turnaroundDays: Int? = null
)
