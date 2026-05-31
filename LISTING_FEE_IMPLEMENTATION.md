# Shop Listing Fee System - Implementation Complete

## Overview
Implemented a comprehensive listing fee system for the Krieta shop marketplace with admin-configurable fees, free quota tracking, and mobile app integration.

## Implementation Breakdown

### 1. Database Schema (schema.prisma)
**Location**: `backend/prisma/schema.prisma`

**Models Added**:
- `listing_fee_config`: Configuration for listing fees by location/category
  - Supports GLOBAL, COUNTRY, REGION, CITY scopes
  - Category-specific pricing (VEHICLES, REAL_ESTATE, etc.)
  - Free quota limits (daily/weekly/monthly)
  - Priority-based matching
  
- `user_listing_quota`: Tracks user's free listing usage
  - Daily/weekly/monthly counters
  - Auto-reset timestamps
  
- `listing_fee_transaction`: Records all listing fee charges
  - Tracks paid vs free listings
  - Links to products and transactions

**Migration**: `backend/prisma/migrations/add_listing_fees.sql`

### 2. Backend Services

#### Listing Fee Service
**Location**: `backend/src/modules/shop/listing-fee.service.ts`

**Features**:
- `calculateListingFee()`: Calculates fee based on user location and category
- `chargeListingFee()`: Deducts fee from wallet or uses free quota
- `getListingFeeAnalytics()`: Revenue and usage analytics
- Automatic quota reset (daily/weekly/monthly)
- Priority-based fee matching (country > global)

#### Shop Service Integration
**Location**: `backend/src/modules/shop/shop.service.ts`

**Changes**:
- Integrated listing fee calculation in `createProduct()`
- Validates wallet balance before product creation
- Charges fee within transaction (atomic operation)
- Returns fee information to user

#### API Routes
**Location**: `backend/src/modules/shop/listing-fee.routes.ts`

**Endpoints**:
- `GET /shop/listing-fee/calculate?category=VEHICLES`: Calculate fee
- `GET /shop/listing-fee/quota`: Get user's quota status

### 3. Admin Panel (Rembrandt RAR)

#### Backend Routes
**Location**: `backend/src/modules/rembrandt-rar/rembrandt-rar.routes.ts`

**Endpoints Added**:
- `GET /listing-fees/config`: List all configurations
- `POST /listing-fees/config`: Create/update configuration
- `POST /listing-fees/toggle`: Enable/disable globally
- `DELETE /listing-fees/config/:id`: Delete configuration
- `GET /listing-fees/analytics`: Revenue analytics
- `GET /listing-fees/transactions`: Transaction history

#### Frontend UI
**Location**: `rembrandt-rar/src/app/(dashboard)/listing-fees/page.tsx`

**Features**:
- Global enable/disable toggle
- Configuration form with:
  - Scope selection (GLOBAL, COUNTRY, etc.)
  - Category-specific pricing
  - Free quota limits (daily/weekly/monthly)
  - Priority ordering
- Configuration table with edit/delete
- Analytics dashboard:
  - Total revenue
  - Paid vs free listings
  - Revenue by category
  - Revenue by location

### 4. Mobile App Integration

#### API Client
**Location**: `composeApp/src/commonMain/kotlin/com/krieta/feature/shop/data/remote/ListingFeeApi.kt`

**Functions**:
- `calculateListingFee(category)`: Get fee for product category
- `getUserQuota()`: Get user's remaining free listings

#### UI Component
**Location**: `composeApp/src/commonMain/kotlin/com/krieta/feature/shop/presentation/component/ListingFeeDialog.kt`

**Features**:
- Shows listing fee before posting
- Displays "Free Listing" if quota available
- Shows quota status (daily/weekly/monthly)
- Confirms wallet balance sufficient
- Cancel or proceed with posting

## Configuration Examples

### Global Default Fee
```json
{
  "scope": "GLOBAL",
  "scopeValue": null,
  "category": null,
  "baseFeeKr": 50,
  "dailyFreeQuota": 1,
  "weeklyFreeQuota": 3,
  "monthlyFreeQuota": 10,
  "isEnabled": true,
  "priority": 0
}
```

### Kenya Vehicle Listings
```json
{
  "scope": "COUNTRY",
  "scopeValue": "KE",
  "category": "VEHICLES",
  "baseFeeKr": 200,
  "dailyFreeQuota": 0,
  "weeklyFreeQuota": 1,
  "monthlyFreeQuota": 3,
  "isEnabled": true,
  "priority": 10
}
```

### Premium Categories (Real Estate)
```json
{
  "scope": "GLOBAL",
  "scopeValue": null,
  "category": "REAL_ESTATE",
  "baseFeeKr": 500,
  "dailyFreeQuota": 0,
  "weeklyFreeQuota": 0,
  "monthlyFreeQuota": 1,
  "isEnabled": true,
  "priority": 5
}
```

## User Flow

1. **User creates product listing**
   - Fills product details
   - Clicks "Post Product"

2. **Mobile app calculates fee**
   - Calls `/shop/listing-fee/calculate?category=VEHICLES`
   - Gets fee amount and quota status

3. **Shows confirmation dialog**
   - Displays fee or "Free Listing"
   - Shows remaining quota
   - User confirms or cancels

4. **Backend processes listing**
   - Validates wallet balance (if fee required)
   - Creates product
   - Charges fee or increments quota
   - Records transaction

5. **Product goes live**
   - User receives confirmation
   - Product appears in shop

## Revenue Tracking

### Platform Wallet
- Listing fees accumulate in `platform_wallet` with label `LISTING_FEES`
- Separate from contest fees, campaign fees, etc.

### Analytics Available
- Total revenue from listing fees
- Paid vs free listings ratio
- Revenue by category
- Revenue by location
- Average fee per listing
- Daily/weekly/monthly trends

## Admin Controls

### Enable/Disable
- Global toggle to enable/disable all listing fees
- Individual config enable/disable

### Pricing Strategy
- Set different fees by location (country-specific)
- Set different fees by category (vehicles vs books)
- Priority-based matching (most specific wins)

### Free Quota Management
- Daily limits (resets at midnight)
- Weekly limits (resets every 7 days)
- Monthly limits (resets on 1st of month)
- Per-user tracking

## Time Estimate
**Total Implementation Time**: 12-17 hours (1.5-2 days)

**Breakdown**:
- Database schema: 1 hour
- Backend service: 4-5 hours
- Admin API routes: 2-3 hours
- Admin panel UI: 3-4 hours
- Mobile app integration: 2-3 hours
- Testing & debugging: 2-3 hours

## Next Steps

1. **Run Migration**
   ```bash
   cd backend
   npx prisma migrate dev --name add_listing_fees
   ```

2. **Configure Initial Fees**
   - Access admin panel at `/listing-fees`
   - Set global default fee
   - Configure country-specific fees
   - Enable listing fees

3. **Test Flow**
   - Create product from mobile app
   - Verify fee calculation
   - Confirm wallet deduction
   - Check quota tracking

4. **Monitor Analytics**
   - Track revenue
   - Analyze usage patterns
   - Adjust fees as needed

## Revenue Model Summary

**Krieta Revenue Streams**:
1. Contest fees: 15%
2. Campaign fees: 10%
3. Sponsorship fees: 5%
4. **Shop listing fees: Admin-configurable** ✓ (NEW)

**No transaction fees** - Shop operates as listing-only platform with WhatsApp/external URL contact methods.
