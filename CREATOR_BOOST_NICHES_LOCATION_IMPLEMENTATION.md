# Creator Boost, Niches, and Location API Implementation

## Overview
This document covers three major features implemented:
1. **Super Admin Creator Boost Management** - Admin control over boost pricing
2. **Creator Niche System** - Signup niche selection with custom niche support
3. **Location API Strategy** - Multi-tier free API approach

---

## 1. SUPER ADMIN CREATOR BOOST MANAGEMENT

### Database Schema (schema.prisma)
```prisma
model CreatorBoostSettings {
  id                    String   @id @default("00000000-0000-0000-0000-000000000001")
  minBoostAmountKes     Decimal  @default(500) @map("min_boost_amount_kes") @db.Decimal(18, 4)
  shortCpmKes           Decimal  @default(50) @map("short_cpm_kes") @db.Decimal(10, 2)
  postCpmKes            Decimal  @default(40) @map("post_cpm_kes") @db.Decimal(10, 2)
  liveCpmKes            Decimal  @default(60) @map("live_cpm_kes") @db.Decimal(10, 2)
  updatedBy             String?  @map("updated_by")
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")

  @@map("creator_boost_settings")
}
```

### Backend Routes (creatorBoost.routes.ts)
- **GET /api/creator-boost/settings** - Fetch current boost settings (authenticated)
- **PATCH /api/creator-boost/settings** - Update boost settings (super admin only)

### How It Works
1. Super admin updates boost amounts via admin panel
2. New amounts override previous values immediately
3. Settings persist until next admin update
4. All creators see updated amounts in BoostContentScreen

### Default Values
- Minimum Boost: KES 500
- Short CPM: KES 50
- Post CPM: KES 40
- Live CPM: KES 60

---

## 2. CREATOR NICHE SYSTEM

### Database Schema Updates

#### User Model Extension
```prisma
model User {
  // ... existing fields
  selectedNiches String[]   @default([]) @map("selected_niches")
  customNiches   String[]   @default([]) @map("custom_niches")
  // ... rest of model
  
  @@index([selectedNiches])
}
```

#### CreatorNiche Model
```prisma
model CreatorNiche {
  id          String   @id @default(uuid())
  name        String   @unique
  isCustom    Boolean  @default(false) @map("is_custom")
  usageCount  Int      @default(1) @map("usage_count")
  createdBy   String?  @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([usageCount])
  @@index([isCustom])
  @@map("creator_niches")
}
```

### Backend Routes (niches.routes.ts)
- **GET /api/niches** - Get all niches (predefined + custom)
- **POST /api/niches/custom** - Add custom niche
- **PATCH /api/niches/me** - Update user's niches
- **GET /api/niches/me** - Get current user's niches
- **GET /api/niches/user/:userId** - Get specific user's niches (public)

### Frontend Implementation

#### Signup Flow
During signup, users:
1. Select from predefined niches dropdown
2. Add custom niches if not found
3. Custom niches saved to database
4. Custom niches appear in dropdown for other users

#### Profile Display (ProfileScreen.kt)
- Niches displayed as chips below bio
- Visible to all users (public)
- Shows both selected and custom niches

#### Profile Editing (EditProfileScreen.kt)
- "Manage Niches" button opens dialog
- Select from predefined niches
- Add custom niches with text input
- Remove niches with chip close button
- Changes saved with profile

### Predefined Niches
Tech, Gadgets, Fashion, Beauty, Automotive, Food & Beverage, Health & Fitness, Education, Entertainment, Gaming, Travel, Real Estate, Finance, Sports, Music, Art, Business, Lifestyle, Parenting, Pets, Home Decor

---

## 3. LOCATION API STRATEGY

### Recommended Approach: Multi-Tier Free APIs

#### Primary: GeoNames (11M+ locations)
- **Coverage**: Country → Region → City → Town
- **Cost**: FREE (no API key required)
- **Rate Limit**: 1000 requests/hour (free tier)
- **Data Quality**: Excellent for administrative boundaries
- **Use Case**: Primary source for all location data

#### Fallback #1: OpenStreetMap Nominatim
- **Coverage**: Landmarks, Shopping Centers, Roads, POIs
- **Cost**: FREE (open source)
- **Rate Limit**: 1 request/second
- **Data Quality**: Best for detailed POIs
- **Use Case**: When GeoNames lacks granular data

#### Fallback #2: REST Countries
- **Coverage**: Country-level data only
- **Cost**: FREE
- **Rate Limit**: Unlimited
- **Data Quality**: Excellent for country metadata
- **Use Case**: Country names, codes, regions

### Implementation Strategy

#### 1. Seed Script (One-Time)
```typescript
// backend/scripts/seedLocations.ts
async function seedLocations() {
  // Fetch all countries from REST Countries
  const countries = await fetch('https://restcountries.com/v3.1/all');
  
  // For each country, fetch regions/cities from GeoNames
  for (const country of countries) {
    const geoData = await fetch(
      `http://api.geonames.org/searchJSON?country=${country.code}&featureClass=P&maxRows=1000&username=YOUR_USERNAME`
    );
    
    // Save to LocationMaster table
    await prisma.locationMaster.createMany({ data: locations });
  }
}
```

#### 2. On-Demand Fetching
```typescript
// When user searches for location not in DB
async function searchLocation(query: string) {
  // Check database first
  let location = await prisma.locationMaster.findFirst({
    where: { displayName: { contains: query } }
  });
  
  if (!location) {
    // Fetch from GeoNames
    const geoData = await fetchFromGeoNames(query);
    
    // Save to database
    location = await prisma.locationMaster.create({ data: geoData });
  }
  
  return location;
}
```

#### 3. Fallback Chain
```typescript
async function getLocationData(query: string) {
  try {
    // Try GeoNames first
    return await fetchFromGeoNames(query);
  } catch (error) {
    try {
      // Fallback to Nominatim
      return await fetchFromNominatim(query);
    } catch (error) {
      // Fallback to REST Countries (country only)
      return await fetchFromRESTCountries(query);
    }
  }
}
```

### Cost Analysis
- **GeoNames**: $0/month (free tier sufficient)
- **Nominatim**: $0/month (self-hosted or public instance)
- **REST Countries**: $0/month (always free)
- **Total**: $0/month

### Rate Limit Management
```typescript
class RateLimiter {
  private lastRequest: Map<string, number> = new Map();
  
  async throttle(api: string, minInterval: number) {
    const last = this.lastRequest.get(api) || 0;
    const now = Date.now();
    const wait = Math.max(0, minInterval - (now - last));
    
    if (wait > 0) await sleep(wait);
    this.lastRequest.set(api, Date.now());
  }
}

// Usage
await rateLimiter.throttle('nominatim', 1000); // 1 req/sec
await rateLimiter.throttle('geonames', 3600); // 1000 req/hour
```

### Data Hierarchy
```
Country (REST Countries)
  └─ Region (GeoNames)
      └─ City (GeoNames)
          └─ Town (GeoNames)
              └─ Road (Nominatim)
                  └─ Landmark (Nominatim)
                      └─ Shopping Center (Nominatim)
```

---

## INTEGRATION CHECKLIST

### Backend
- [x] Add CreatorBoostSettings model to schema
- [x] Add CreatorNiche model to schema
- [x] Update User model with niche fields
- [x] Create creatorBoost.routes.ts
- [x] Create niches.routes.ts
- [ ] Register routes in main app
- [ ] Run prisma migrate
- [ ] Seed predefined niches
- [ ] Implement location seed script

### Frontend
- [x] Update ProfileScreen to display niches
- [x] Update EditProfileScreen with niche management
- [ ] Add niche selection to signup flow
- [ ] Update BoostContentScreen to fetch boost settings
- [ ] Add admin panel for boost settings management

### Testing
- [ ] Test super admin boost amount updates
- [ ] Test niche selection during signup
- [ ] Test custom niche creation
- [ ] Test niche display on profile
- [ ] Test location API fallback chain
- [ ] Test rate limiting

---

## API ENDPOINTS SUMMARY

### Creator Boost
```
GET    /api/creator-boost/settings
PATCH  /api/creator-boost/settings (admin only)
```

### Niches
```
GET    /api/niches
POST   /api/niches/custom
PATCH  /api/niches/me
GET    /api/niches/me
GET    /api/niches/user/:userId
```

### Locations (existing)
```
GET    /api/locations
POST   /api/locations (admin only)
PATCH  /api/locations/:id (admin only)
DELETE /api/locations/:id (admin only)
GET    /api/locations/hierarchy/:countryCode
GET    /api/locations/search
```

---

## NOTES

1. **Location APIs**: Use all three (GeoNames, Nominatim, REST Countries) with GeoNames as primary. This ensures maximum coverage at $0 cost.

2. **Niche System**: Custom niches are automatically added to the global dropdown when created, making the system self-expanding.

3. **Boost Settings**: Super admin changes take effect immediately for all creators. No migration needed for existing boosts.

4. **Profile Niches**: Visible to everyone (public) to help users discover creators in their interest areas.

5. **Rate Limiting**: Implement proper throttling to stay within free tier limits. Cache location data aggressively.
