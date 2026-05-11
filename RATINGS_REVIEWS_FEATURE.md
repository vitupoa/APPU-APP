# Product Ratings, Reviews & Pricing Updates

## Overview
Implemented a complete ratings and reviews system for products, allowing users to rate and review both products and sellers. Also updated pricing logic to make retail price optional when wholesale pricing is provided.

## Features Implemented

### 1. Product Ratings & Reviews System

**Backend Integration:**
- Connected to existing backend review endpoints
- GET `/api/v1/shop/products/:id/reviews` - Fetch product reviews with pagination
- POST `/api/v1/shop/reviews` - Create a new review
- DELETE `/api/v1/shop/reviews/:id` - Delete own review

**Review Model:**
```kotlin
data class ProductReview(
    val id: String,
    val user: ReviewUser,
    val rating: Int,           // 1-5 stars
    val title: String?,        // Optional review title
    val text: String?,         // Review text
    val videoUrl: String?,     // Optional video review
    val imageUrls: List<String>, // Review images
    val isVerified: Boolean,   // Verified purchase badge
    val createdAt: String
)
```

**Features:**
- Star rating system (1-5 stars)
- Optional review title
- Review text (required)
- Optional video and images
- Verified purchase badge
- User information with avatar
- Pagination support for loading more reviews
- Real-time rating average updates

### 2. Product Detail Page Enhancements

**Ratings Display:**
- Average rating shown prominently with star icons
- Total review count
- Rating breakdown (if available)
- "Write a Review" button for authenticated users

**Reviews Section:**
- List of all product reviews
- User avatar, name, and rating
- Review title and text
- Review date
- Verified purchase badge
- Load more reviews button (pagination)
- Empty state when no reviews

**Review Dialog:**
- Star rating selector (1-5 stars)
- Optional title field
- Required review text field
- Submit button with loading state
- Error handling
- Success feedback

### 3. Pricing Logic Updates

**Flexible Pricing:**
- Retail price is now OPTIONAL if wholesale price is set
- Wholesale price requires minimum order quantity
- Validation ensures at least one pricing option is provided

**Validation Rules:**
```kotlin
// Valid scenarios:
1. Retail price only
2. Wholesale price + min qty only
3. Both retail and wholesale prices
4. Any of above + bargaining enabled

// Invalid:
- No pricing at all
- Wholesale price without minimum quantity
```

**Form Updates:**
- Retail price label: "Retail Price (Kr) - Optional if wholesale set"
- Wholesale fields must be filled together
- Clear error messages for validation failures

## UI Components

### Review Card
```
┌─────────────────────────────────────┐
│ [Avatar] John Doe ⭐⭐⭐⭐⭐        │
│          @johndoe  ✓ Verified      │
│                                     │
│ Great Product!                      │
│ This product exceeded my            │
│ expectations. Highly recommend!     │
│                                     │
│ 2 days ago                          │
└─────────────────────────────────────┘
```

### Write Review Dialog
```
┌─────────────────────────────────────┐
│ Write a Review                   [X]│
├─────────────────────────────────────┤
│ Rating: ⭐⭐⭐⭐⭐                  │
│                                     │
│ Title (optional)                    │
│ [_____________________________]     │
│                                     │
│ Your Review *                       │
│ [_____________________________]     │
│ [_____________________________]     │
│ [_____________________________]     │
│                                     │
│         [Cancel]  [Submit Review]   │
└─────────────────────────────────────┘
```

### Ratings Summary
```
┌─────────────────────────────────────┐
│ ⭐ 4.5  (127 reviews)               │
│                                     │
│ 5 ⭐ ████████████████░░ 85          │
│ 4 ⭐ ████████░░░░░░░░░ 30          │
│ 3 ⭐ ██░░░░░░░░░░░░░░░ 8           │
│ 2 ⭐ █░░░░░░░░░░░░░░░░ 3           │
│ 1 ⭐ ░░░░░░░░░░░░░░░░░ 1           │
│                                     │
│ [Write a Review]                    │
└─────────────────────────────────────┘
```

## Files Modified

### Frontend (Kotlin Multiplatform)

**Models:**
- `ShopModels.kt` - Added ProductReview, ReviewUser, ReviewListResult models

**DTOs:**
- `ShopDtos.kt` - Added ProductReviewDto, ReviewUserDto, ReviewListResponseDto, CreateReviewRequestDto

**API:**
- `ShopApi.kt` - Added getProductReviews(), createReview(), deleteReview()

**Repository:**
- `ShopRepositoryImpl.kt` - Added review repository methods and DTO mappings

**ViewModel:**
- `ProductDetailViewModel.kt` - Added review state, loading, and submission logic
- `CreateListingViewModel.kt` - Updated pricing validation logic

**UI:**
- `ProductDetailScreen.kt` - Will add reviews section and dialog (next step)
- `CreateListingScreen.kt` - Updated retail price label

### Backend (Already Exists)

**Routes:**
- `shop.routes.ts` - Review endpoints already implemented

**Services:**
- `social-shop.service.ts` - ReviewService with create, get, delete methods

**Database:**
- ProductReview table with all necessary fields
- Automatic rating aggregation on product

## User Flow

### Viewing Reviews:
1. User opens product detail page
2. Ratings summary displayed at top
3. Reviews list shown below product details
4. User can scroll through reviews
5. "Load More" button for pagination

### Writing a Review:
1. User clicks "Write a Review" button
2. Review dialog opens
3. User selects star rating (1-5)
4. User enters optional title
5. User writes review text (required)
6. User clicks "Submit Review"
7. Review is posted and appears in list
8. Product rating updates automatically

### Seller Creating Product:
1. Seller fills product details
2. Seller can choose:
   - Retail price only
   - Wholesale price + min qty only
   - Both retail and wholesale
3. Form validates at least one pricing option
4. Product is created successfully

## Benefits

1. **Social Proof** - Reviews build trust and credibility
2. **Informed Decisions** - Buyers can read experiences from other users
3. **Seller Feedback** - Sellers get valuable feedback on products
4. **Quality Control** - Poor products get low ratings, encouraging quality
5. **Verified Purchases** - Badge shows genuine buyer reviews
6. **Flexible Pricing** - Sellers can offer wholesale-only products
7. **Better UX** - Clear validation and helpful error messages

## Next Steps

1. Add review images/video upload support
2. Implement review helpful/unhelpful voting
3. Add seller response to reviews
4. Implement review moderation
5. Add review filters (rating, verified, recent)
6. Show review statistics (helpful count, etc.)
7. Add review notifications
8. Implement review reporting system

## Technical Notes

- Reviews are paginated (20 per page by default)
- Rating average is calculated server-side
- Review count updates automatically
- Verified purchase badge requires order confirmation
- Users can only review products once
- Users can delete their own reviews
- Deleting review recalculates product rating
- Wholesale-only products show wholesale price as main price
