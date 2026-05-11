# Product Pricing Options & Bargaining Feature

## Overview
Enhanced the product listing form and detail page to support multiple pricing options (retail, wholesale, bargaining) with a smart bargaining system that validates buyer offers against seller's minimum price.

## Changes Made

### 1. Enhanced Product Listing Form

**Added Pricing Options Section:**
- **Retail Price** - Main product price (required)
- **Wholesale Price** - Optional bulk pricing with minimum quantity requirement
- **Bargaining** - Optional feature allowing buyers to make offers
  - Checkbox to enable bargaining
  - Minimum bargain price field (hidden from buyers)
  - Helpful text explaining the feature

**Files Modified:**
- `CreateListingViewModel.kt` - Added pricing fields to state and handlers
- `CreateListingScreen.kt` - Added pricing options UI
- `ShopRepositoryImpl.kt` - Added pricing parameters to API calls
- `ShopDtos.kt` - Added pricing fields to request DTO

### 2. Product Detail Page Enhancements

**Pricing Badges:**
- **RETAIL** badge (blue) - Always shown
- **WHOLESALE** badge (secondary color) - Shown when wholesale pricing available
- **BARGAIN** badge (red) - Shown when bargaining enabled

**Bargaining System:**
1. **Make an Offer Card** (when bargaining enabled):
   - Input field for buyer's offer
   - Submit button to validate offer
   - Error messages for invalid or too-low offers

2. **Offer Validation**:
   - Checks if offer is valid number
   - Compares against seller's minimum bargain price (hidden from buyer)
   - Shows "too low" message if below minimum
   - Shows success message if acceptable

3. **Offer Accepted Card**:
   - Green success message with checkmark
   - Shows agreed price
   - Enables contact seller button

4. **Contact Seller Button**:
   - Disabled until offer is accepted (if bargaining enabled)
   - WhatsApp message includes agreed price when bargaining used
   - Shows "Agreed Price" label instead of "Price" when bargaining successful

**Files Modified:**
- `ProductDetailViewModel.kt` - Added bargaining state and logic
- `ProductDetailScreen.kt` - Added pricing badges and bargaining UI
- `ShopModels.kt` - Already had pricing fields from previous update

## User Flow

### Seller Side:
1. Create product listing
2. Enter retail price (required)
3. Optionally add wholesale price + minimum quantity
4. Optionally enable bargaining and set minimum acceptable price
5. Minimum bargain price is never shown to buyers

### Buyer Side:
1. View product with pricing badges (RETAIL, WHOLESALE, BARGAIN)
2. See retail price prominently displayed
3. If wholesale available, see wholesale price with minimum quantity
4. If bargaining enabled:
   - Enter offer amount in "Make an Offer" card
   - Submit offer
   - If too low: See error "Your offer is too low. Please try a higher amount."
   - If acceptable: See success message and contact button becomes enabled
5. Contact seller via WhatsApp with agreed price

## Bargaining Logic

```kotlin
// Seller sets minimum (hidden from buyer)
bargainMinPrice = 200.0

// Buyer offers
buyerOffer = 180.0 // Too low - rejected
buyerOffer = 200.0 // Acceptable - approved
buyerOffer = 250.0 // Above minimum - approved
```

## UI Components

### Pricing Badges
```
[RETAIL] [WHOLESALE] [BARGAIN]
  Blue    Secondary     Red
```

### Make an Offer Card
```
┌─────────────────────────────┐
│ Make an Offer               │
│                             │
│ [Your Offer (Kr)_______]    │
│                             │
│ [Submit Offer Button]       │
└─────────────────────────────┘
```

### Offer Accepted Card
```
┌─────────────────────────────┐
│ ✓ Offer Accepted!           │
│                             │
│ Your offer of Kr. 250 is    │
│ acceptable. Contact seller  │
│ to complete the purchase.   │
└─────────────────────────────┘
```

## Benefits

1. **Flexible Pricing** - Sellers can offer multiple pricing tiers
2. **Bulk Sales** - Wholesale pricing encourages larger orders
3. **Negotiation** - Bargaining feature enables price negotiation
4. **Privacy** - Minimum bargain price hidden from buyers
5. **Smart Validation** - Automatic offer validation without revealing minimum
6. **Clear Communication** - Agreed price shown in WhatsApp message
7. **Visual Indicators** - Badges clearly show available pricing options

## Technical Notes

- Minimum bargain price is never sent to the frontend for buyers
- Validation happens client-side using the hidden minimum price
- Contact button is disabled until acceptable offer is made
- WhatsApp message automatically includes agreed price
- All pricing fields are optional except retail price
- Wholesale requires both price and minimum quantity
- Bargaining requires minimum price to be set
