# Campaign Creation Fix

## Problem
When creating a campaign, the app was showing an error:
```
Illegal input: Fields [id, brandId, brandName, title, description, budget, categories, requirements, deliverables, startDate, endDate, status, applicationsCount, selectedInfluencers] are required for type with serial name 'com.krieta.feature.marketplace.domain.model.BrandCampaign', but they were missing at path: $
```

## Root Cause
The frontend and backend had mismatched schemas:

### Frontend was sending:
- `title`, `description`, `budget`, `targetTier` (single value), `categories`, `requirements`, `deliverables`, `startDate`, `endDate`

### Backend expected:
- `title`, `description`, `type`, `targetTiers` (array), `targetCategories`, `budgetKr`, `compensationPerInfluencer`, `maxInfluencers`, `campaignStartDate`, `campaignEndDate`, etc.

## Solution

### 1. Updated CreateCampaignRequest (MarketplaceApiService.kt)
Changed the request DTO to match backend expectations:
```kotlin
data class CreateCampaignRequest(
    val title: String,
    val description: String,
    val type: String,
    val targetTiers: List<String>,
    val targetCategories: List<String>,
    val budgetKr: Double,
    val compensationPerInfluencer: Double,
    val maxInfluencers: Int,
    val contentGuidelines: String?,
    val campaignStartDate: String,
    val campaignEndDate: String,
    // ... other fields
)
```

### 2. Updated Repository Mapping (MarketplaceRepositoryImpl.kt)
Added logic to map old parameters to new schema:
- Convert single `targetTier` to `targetTiers` array
- When `targetTier` is null (ALL selected), send all tiers: `["NANO", "MICRO", "MID", "MACRO", "MEGA"]`
- Map `budget` to `budgetKr`
- Map `requirements` to `contentGuidelines`
- Map `startDate`/`endDate` to `campaignStartDate`/`campaignEndDate`

### 3. Added "ALL" Option (CampaignScreens.kt)
Added an "ALL" chip to the Target Influencer Tier selection:
```kotlin
FilterChip(
    selected = selectedTier == null,
    onClick = { selectedTier = null },
    label = { Text("ALL") }
)
```

### 4. Fixed Date Generation (CampaignScreens.kt)
Changed from empty strings to proper ISO datetime:
```kotlin
val now = kotlinx.datetime.Clock.System.now()
val startDate = now.toString()
val endDate = (now + kotlinx.datetime.DateTimePeriod(days = 30)).toString()
```

### 5. Updated BrandCampaign Model (MarketplaceModels.kt)
Updated the model to match backend response with backward compatibility:
```kotlin
@Serializable
data class BrandCampaign(
    val id: String,
    val brandId: String,
    val title: String,
    val description: String,
    val type: String,
    val status: CampaignStatus,
    val targetTiers: List<String>,
    val targetCategories: List<String>,
    val budgetKr: Double,
    val compensationPerInfluencer: Double,
    val maxInfluencers: Int,
    val campaignStartDate: String,
    val campaignEndDate: String,
    val totalApplications: Int = 0,
    val acceptedInfluencers: Int = 0,
    // ... other fields
) {
    // Computed properties for backward compatibility
    val budget: Double get() = budgetKr
    val applicationsCount: Int get() = totalApplications
    val selectedInfluencers: Int get() = acceptedInfluencers
    // ... other computed properties
}
```

## Backend Filtering
The backend already properly filters campaigns by influencer tier in `browseCampaigns`:
```typescript
where.AND = [
  { targetTiers: { has: influencer.tier } },
  ...
];
```

When "ALL" is selected, all tiers are sent in the array, so campaigns will be visible to all influencer tiers.

## Files Modified
1. `composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/data/remote/MarketplaceApiService.kt`
2. `composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/data/repository/MarketplaceRepositoryImpl.kt`
3. `composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/presentation/screen/CampaignScreens.kt`
4. `composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/domain/model/MarketplaceModels.kt`

## Testing
To test the fix:
1. Open the Create Campaign screen
2. Fill in all required fields
3. Select a target tier (or ALL)
4. Click "Create Campaign"
5. Campaign should be created successfully
6. Verify that influencers of the selected tier(s) can see the campaign
