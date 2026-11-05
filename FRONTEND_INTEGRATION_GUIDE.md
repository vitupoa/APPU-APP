# Frontend Integration Guide

## Overview
This guide covers connecting the Kotlin Multiplatform frontend to the new backend API endpoints for:
- Creator Boost Management
- Niche Selection System
- Display Ad Campaigns
- Location-Based Targeting

---

## 1. API Client Setup

### Base Configuration
```kotlin
// composeApp/src/commonMain/kotlin/com/runinga/core/network/ApiClient.kt

object ApiConfig {
    const val BASE_URL = "http://localhost:3000/api/v1" // Update for production
    
    // New endpoints
    const val CREATOR_BOOST = "/creator-boost"
    const val NICHES = "/niches"
    const val DISPLAY_ADS = "/display-ads"
    const val LOCATIONS = "/locations"
}
```

---

## 2. Creator Boost Integration

### API Service
```kotlin
// composeApp/src/commonMain/kotlin/com/runinga/feature/boost/data/BoostApiService.kt

interface BoostApiService {
    @GET("${ApiConfig.CREATOR_BOOST}/settings")
    suspend fun getBoostSettings(): BoostSettingsResponse
}

data class BoostSettingsResponse(
    val minBoostAmountKes: Double,
    val shortCpmKes: Double,
    val postCpmKes: Double,
    val liveCpmKes: Double
)
```

### Update ViewModel
```kotlin
// composeApp/src/commonMain/kotlin/com/runinga/feature/boost/presentation/BoostContentViewModel.kt

class BoostContentViewModel(
    private val boostApiService: BoostApiService
) : ViewModel() {
    
    init {
        viewModelScope.launch {
            try {
                val settings = boostApiService.getBoostSettings()
                _minBoostAmount.value = settings.minBoostAmountKes
                _shortCpm.value = settings.shortCpmKes
                _postCpm.value = settings.postCpmKes
                _liveCpm.value = settings.liveCpmKes
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
```

---

## 3. Niche System Integration

### API Service
```kotlin
// composeApp/src/commonMain/kotlin/com/runinga/feature/niches/data/NicheApiService.kt

interface NicheApiService {
    @GET(ApiConfig.NICHES)
    suspend fun getAllNiches(): List<NicheResponse>
    
    @GET("${ApiConfig.NICHES}/me")
    suspend fun getMyNiches(): UserNichesResponse
    
    @PATCH("${ApiConfig.NICHES}/me")
    suspend fun updateMyNiches(@Body request: UpdateNichesRequest): UserNichesResponse
    
    @POST("${ApiConfig.NICHES}/custom")
    suspend fun addCustomNiche(@Body request: AddCustomNicheRequest): NicheResponse
}

data class NicheResponse(
    val id: String,
    val name: String,
    val isCustom: Boolean,
    val usageCount: Int
)

data class UserNichesResponse(
    val selectedNiches: List<String>,
    val customNiches: List<String>
)

data class UpdateNichesRequest(
    val selectedNiches: List<String>,
    val customNiches: List<String>
)

data class AddCustomNicheRequest(
    val name: String
)
```

### Update EditProfileViewModel
```kotlin
// composeApp/src/commonMain/kotlin/com/runinga/feature/profile/presentation/EditProfileViewModel.kt

class EditProfileViewModel(
    private val nicheApiService: NicheApiService
) : ViewModel() {
    
    private val _allNiches = MutableStateFlow<List<NicheResponse>>(emptyList())
    val allNiches: StateFlow<List<NicheResponse>> = _allNiches
    
    init {
        loadNiches()
        loadUserNiches()
    }
    
    private fun loadNiches() {
        viewModelScope.launch {
            try {
                _allNiches.value = nicheApiService.getAllNiches()
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
    
    private fun loadUserNiches() {
        viewModelScope.launch {
            try {
                val userNiches = nicheApiService.getMyNiches()
                _selectedNiches.value = userNiches.selectedNiches
                _customNiches.value = userNiches.customNiches
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
    
    fun saveNiches() {
        viewModelScope.launch {
            try {
                val request = UpdateNichesRequest(
                    selectedNiches = _selectedNiches.value,
                    customNiches = _customNiches.value
                )
                nicheApiService.updateMyNiches(request)
                // Show success message
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
    
    fun addCustomNiche(name: String) {
        viewModelScope.launch {
            try {
                val niche = nicheApiService.addCustomNiche(AddCustomNicheRequest(name))
                _allNiches.value = _allNiches.value + niche
                _customNiches.value = _customNiches.value + name
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
```

---

## 4. Display Ad Campaign Integration

### API Service
```kotlin
// composeApp/src/commonMain/kotlin/com/runinga/feature/ads/data/DisplayAdsApiService.kt

interface DisplayAdsApiService {
    @POST("${ApiConfig.DISPLAY_ADS}/campaigns")
    suspend fun createCampaign(@Body request: CreateCampaignRequest): CampaignResponse
    
    @GET("${ApiConfig.DISPLAY_ADS}/campaigns")
    suspend fun getMyCampaigns(): List<CampaignResponse>
    
    @GET("${ApiConfig.DISPLAY_ADS}/campaigns/{id}")
    suspend fun getCampaign(@Path("id") id: String): CampaignResponse
    
    @PATCH("${ApiConfig.DISPLAY_ADS}/campaigns/{id}")
    suspend fun updateCampaign(
        @Path("id") id: String,
        @Body request: UpdateCampaignRequest
    ): CampaignResponse
}

data class CreateCampaignRequest(
    val campaignName: String,
    val campaignObjective: String,
    val adTitle: String,
    val adDescription: String?,
    val primaryImageUrl: String,
    val secondaryImageUrls: List<String>,
    val videoUrl: String?,
    val ctaText: String,
    val ctaUrl: String,
    val budgetType: String,
    val dailyBudgetKes: Double?,
    val lifetimeBudgetKes: Double?,
    val biddingStrategy: String,
    val targetCpm: Double?,
    val costCap: Double?,
    val targetAgeMin: Int?,
    val targetAgeMax: Int?,
    val targetGenders: List<String>,
    val targetLanguages: List<String>,
    val targetInterests: List<String>,
    val targetBehaviors: List<String>,
    val targetContentNiches: List<String>,
    val targetCreatorTiers: List<String>,
    val placements: List<String>,
    val chatNiches: List<String>,
    val locations: List<LocationTargeting>,
    val startDate: String,
    val endDate: String?
)

data class LocationTargeting(
    val scope: String,
    val scopeValue: String,
    val scopeDisplayName: String,
    val isExcluded: Boolean = false
)

data class CampaignResponse(
    val id: String,
    val campaignName: String,
    val status: String,
    val totalSpentKes: Double,
    val impressions: Int,
    val clicks: Int,
    val conversions: Int,
    val ctr: Double,
    val avgCpm: Double,
    val createdAt: String
)
```

### Update CreateDisplayAdCampaignViewModel
```kotlin
// composeApp/src/commonMain/kotlin/com/runinga/feature/ads/presentation/CreateDisplayAdCampaignViewModel.kt

class CreateDisplayAdCampaignViewModel(
    private val displayAdsApiService: DisplayAdsApiService
) : ViewModel() {
    
    fun submitCampaign() {
        viewModelScope.launch {
            try {
                val request = CreateCampaignRequest(
                    campaignName = _campaignName.value,
                    campaignObjective = _selectedObjective.value,
                    adTitle = _adTitle.value,
                    adDescription = _adDescription.value,
                    primaryImageUrl = _primaryImageUrl.value,
                    secondaryImageUrls = _secondaryImageUrls.value,
                    videoUrl = _videoUrl.value,
                    ctaText = _ctaText.value,
                    ctaUrl = _ctaUrl.value,
                    budgetType = _budgetType.value,
                    dailyBudgetKes = _dailyBudget.value,
                    lifetimeBudgetKes = _lifetimeBudget.value,
                    biddingStrategy = _biddingStrategy.value,
                    targetCpm = _targetCpm.value,
                    costCap = _costCap.value,
                    targetAgeMin = _ageRange.value.start.toInt(),
                    targetAgeMax = _ageRange.value.endInclusive.toInt(),
                    targetGenders = _selectedGenders.value,
                    targetLanguages = _selectedLanguages.value,
                    targetInterests = _selectedInterests.value,
                    targetBehaviors = _selectedBehaviors.value,
                    targetContentNiches = _selectedNiches.value,
                    targetCreatorTiers = _selectedCreatorTiers.value,
                    placements = _selectedPlacements.value,
                    chatNiches = _selectedChatNiches.value,
                    locations = _selectedLocations.value.map {
                        LocationTargeting(
                            scope = it.scope,
                            scopeValue = it.scopeValue,
                            scopeDisplayName = it.displayName,
                            isExcluded = it.isExcluded
                        )
                    },
                    startDate = _startDate.value.toString(),
                    endDate = _endDate.value?.toString()
                )
                
                val campaign = displayAdsApiService.createCampaign(request)
                // Navigate to campaign details or show success
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}
```

---

## 5. Location API Integration

### API Service
```kotlin
// composeApp/src/commonMain/kotlin/com/runinga/feature/locations/data/LocationApiService.kt

interface LocationApiService {
    @GET("${ApiConfig.LOCATIONS}/hierarchy")
    suspend fun getLocationHierarchy(
        @Query("parentId") parentId: String?
    ): List<LocationResponse>
    
    @GET("${ApiConfig.LOCATIONS}/search")
    suspend fun searchLocations(
        @Query("query") query: String,
        @Query("scope") scope: String?
    ): List<LocationResponse>
}

data class LocationResponse(
    val id: String,
    val scope: String,
    val scopeValue: String,
    val displayName: String,
    val parentId: String?,
    val continent: String?,
    val country: String?,
    val countryCode: String?,
    val region: String?,
    val city: String?,
    val latitude: Double?,
    val longitude: Double?
)
```

---

## 6. Dependency Injection Setup

### Koin Module
```kotlin
// composeApp/src/commonMain/kotlin/com/runinga/di/NetworkModule.kt

val networkModule = module {
    // API Services
    single { BoostApiService(get()) }
    single { NicheApiService(get()) }
    single { DisplayAdsApiService(get()) }
    single { LocationApiService(get()) }
    
    // ViewModels
    viewModel { BoostContentViewModel(get()) }
    viewModel { EditProfileViewModel(get(), get()) }
    viewModel { CreateDisplayAdCampaignViewModel(get(), get()) }
}
```

---

## 7. Running Database Seeds

### Execute Seeds
```bash
# Navigate to backend directory
cd backend

# Run all seeds
npm run seed

# Or run individually
npx tsx prisma/seeds/seed-super-admin.ts
npx tsx prisma/seeds/seed-niches.ts
```

### Add to package.json
```json
{
  "scripts": {
    "seed": "npx tsx prisma/seeds/seed-all.ts",
    "seed:admin": "npx tsx prisma/seeds/seed-super-admin.ts",
    "seed:niches": "npx tsx prisma/seeds/seed-niches.ts"
  }
}
```

---

## 8. Testing Checklist

### Backend Testing
- [ ] Run migrations: `npx prisma migrate dev`
- [ ] Run seeds: `npm run seed`
- [ ] Test super admin login with credentials
- [ ] Verify niches are seeded in database
- [ ] Test all API endpoints with Postman/Thunder Client

### Frontend Testing
- [ ] Test niche selection in profile edit
- [ ] Test custom niche creation
- [ ] Test boost content with dynamic CPM rates
- [ ] Test display ad campaign creation
- [ ] Test location search and selection

---

## 9. Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/runinga"
JWT_SECRET="your-secret-key"
PORT=3000
```

### Frontend (local.properties or Config.kt)
```kotlin
object ApiConfig {
    const val BASE_URL = "http://10.0.2.2:3000/api/v1" // Android emulator
    // const val BASE_URL = "http://localhost:3000/api/v1" // iOS simulator
    // const val BASE_URL = "https://api.runinga.com/api/v1" // Production
}
```

---

## 10. Next Steps

1. **Run Database Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_creator_boost_and_niches
   ```

2. **Run Seeds**
   ```bash
   npm run seed
   ```

3. **Start Backend Server**
   ```bash
   npm run dev
   ```

4. **Update Frontend API Client**
   - Add new API service interfaces
   - Update ViewModels to call new endpoints
   - Test with backend running locally

5. **Test End-to-End**
   - Login as super admin
   - Update boost settings
   - Create/edit user profile with niches
   - Create display ad campaign

---

## Support

For issues or questions:
- Check backend logs: `backend/logs/`
- Check API responses in network inspector
- Verify authentication tokens are being sent
- Ensure CORS is configured correctly for local development
