# Location Data Integration for Krieta Ads Manager

## Overview
Instead of manual entry, we can automatically populate location data from free/paid APIs and services.

## Recommended Location Data Sources

### 1. **GeoNames (FREE - RECOMMENDED)**
- **URL**: http://www.geonames.org/
- **Coverage**: 11+ million place names worldwide
- **Granularity**: Country → Region → City → Town → Streets → Landmarks
- **API**: Free REST API (no key required for basic usage)
- **Data**: 
  - Countries, regions, cities, towns, villages
  - Streets, roads, neighborhoods
  - Landmarks, shopping centers, points of interest
  - Lat/Long coordinates
  - Population data

**Example API Calls**:
```typescript
// Get all cities in Kenya
GET http://api.geonames.org/searchJSON?country=KE&featureClass=P&maxRows=1000&username=demo

// Get children of a location (e.g., cities in a region)
GET http://api.geonames.org/childrenJSON?geonameId=192798&username=demo

// Search for shopping centers
GET http://api.geonames.org/searchJSON?q=mall&country=KE&featureCode=MALL&username=demo
```

### 2. **OpenStreetMap Nominatim (FREE)**
- **URL**: https://nominatim.openstreetmap.org/
- **Coverage**: Global, community-maintained
- **Granularity**: Very detailed - down to individual buildings
- **API**: Free REST API
- **Data**:
  - Streets, roads, avenues
  - Shopping centers, malls
  - Landmarks, buildings
  - Neighborhoods, suburbs

**Example API Calls**:
```typescript
// Search for locations in Kenya
GET https://nominatim.openstreetmap.org/search?country=Kenya&format=json

// Get shopping malls in Nairobi
GET https://nominatim.openstreetmap.org/search?q=mall+Nairobi&format=json

// Reverse geocode (get location from coordinates)
GET https://nominatim.openstreetmap.org/reverse?lat=-1.286389&lon=36.817223&format=json
```

### 3. **REST Countries (FREE)**
- **URL**: https://restcountries.com/
- **Coverage**: All countries
- **Data**: Country codes, names, regions, continents
- **API**: Free, no authentication

### 4. **Google Places API (PAID - Most Comprehensive)**
- **Coverage**: Global, most up-to-date
- **Granularity**: Extremely detailed
- **Cost**: $17 per 1000 requests (Place Search)
- **Data**: Shopping centers, malls, landmarks, businesses

### 5. **Mapbox Geocoding API (FREEMIUM)**
- **Free Tier**: 100,000 requests/month
- **Coverage**: Global
- **Granularity**: Very detailed

## Implementation Strategy

### Phase 1: Initial Seed (One-time)
```typescript
// backend/src/scripts/seedLocations.ts

import axios from 'axios';
import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function seedLocations() {
  // 1. Seed Countries
  const countries = await axios.get('https://restcountries.com/v3.1/all');
  for (const country of countries.data) {
    await prisma.locationMaster.create({
      data: {
        scope: 'COUNTRY',
        scopeValue: country.cca2,
        displayName: country.name.common,
        countryCode: country.cca2,
        continent: country.region,
        latitude: country.latlng?.[0],
        longitude: country.latlng?.[1],
        population: country.population,
      },
    });
  }

  // 2. Seed Cities for Kenya (example)
  const kenyaCities = await axios.get(
    'http://api.geonames.org/searchJSON?country=KE&featureClass=P&maxRows=1000&username=YOUR_USERNAME'
  );
  
  for (const city of kenyaCities.data.geonames) {
    const countryLocation = await prisma.locationMaster.findFirst({
      where: { countryCode: 'KE', scope: 'COUNTRY' },
    });

    await prisma.locationMaster.create({
      data: {
        scope: city.fcode.startsWith('PPL') ? 'CITY' : 'TOWN',
        scopeValue: `KE_${city.geonameId}`,
        displayName: city.name,
        parentId: countryLocation?.id,
        country: 'Kenya',
        countryCode: 'KE',
        region: city.adminName1,
        city: city.name,
        latitude: parseFloat(city.lat),
        longitude: parseFloat(city.lng),
        population: city.population,
      },
    });
  }

  // 3. Seed Shopping Centers in Nairobi
  const nairobiMalls = await axios.get(
    'https://nominatim.openstreetmap.org/search?q=mall+Nairobi+Kenya&format=json&limit=50'
  );

  for (const mall of nairobiMalls.data) {
    await prisma.locationMaster.create({
      data: {
        scope: 'SHOPPING_CENTER',
        scopeValue: `KE_MALL_${mall.place_id}`,
        displayName: mall.display_name.split(',')[0],
        country: 'Kenya',
        countryCode: 'KE',
        city: 'Nairobi',
        latitude: parseFloat(mall.lat),
        longitude: parseFloat(mall.lon),
      },
    });
  }
}

seedLocations();
```

### Phase 2: On-Demand Loading
When user searches for a location that doesn't exist, fetch it dynamically:

```typescript
// backend/src/modules/locations/locations.service.ts

export class LocationService {
  async searchOrFetchLocation(query: string, scope: string, countryCode: string) {
    // 1. Check if exists in database
    let locations = await prisma.locationMaster.findMany({
      where: {
        displayName: { contains: query, mode: 'insensitive' },
        scope,
        countryCode,
      },
    });

    if (locations.length > 0) return locations;

    // 2. If not found, fetch from GeoNames
    const response = await axios.get(
      `http://api.geonames.org/searchJSON?q=${query}&country=${countryCode}&username=YOUR_USERNAME`
    );

    // 3. Save to database
    for (const result of response.data.geonames) {
      const location = await prisma.locationMaster.create({
        data: {
          scope: this.mapFeatureCodeToScope(result.fcode),
          scopeValue: `${countryCode}_${result.geonameId}`,
          displayName: result.name,
          countryCode,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lng),
          population: result.population,
        },
      });
      locations.push(location);
    }

    return locations;
  }

  private mapFeatureCodeToScope(fcode: string): string {
    const mapping: Record<string, string> = {
      PCLI: 'COUNTRY',
      ADM1: 'REGION',
      PPLA: 'CITY',
      PPL: 'TOWN',
      ST: 'ROAD',
      MALL: 'SHOPPING_CENTER',
      // ... more mappings
    };
    return mapping[fcode] || 'LANDMARK';
  }
}
```

### Phase 3: Scheduled Updates
Update location data weekly/monthly:

```typescript
// backend/src/jobs/updateLocations.job.ts

import cron from 'node-cron';

// Run every Sunday at 2 AM
cron.schedule('0 2 * * 0', async () => {
  console.log('Updating location data...');
  
  // Fetch latest data from GeoNames
  // Update population, coordinates, etc.
  
  console.log('Location data updated');
});
```

## Cost Analysis

### FREE Option (Recommended for MVP)
- **GeoNames**: Free (requires registration)
- **Nominatim**: Free (rate limit: 1 req/sec)
- **REST Countries**: Free
- **Total Cost**: $0/month
- **Coverage**: Sufficient for 95% of use cases

### PAID Option (For Scale)
- **Google Places API**: $17 per 1000 requests
- **Estimated Usage**: 10,000 searches/month = $170/month
- **Benefits**: Most accurate, real-time updates

## Implementation Timeline

**Week 1**: 
- Set up GeoNames account
- Create seed script for countries
- Seed Kenya locations (cities, towns)

**Week 2**:
- Implement on-demand location fetching
- Add shopping centers/malls for major cities
- Create location search API

**Week 3**:
- Add caching layer (Redis)
- Implement scheduled updates
- Add more countries

## Frontend Integration

```kotlin
// In LocationPickerDialog
LaunchedEffect(searchQuery) {
    if (searchQuery.length >= 3) {
        val response = httpClient.get("https://api.krieta.com/api/v1/locations") {
            parameter("search", searchQuery)
            parameter("scope", selectedScope)
            parameter("countryCode", "KE")
        }.body<List<Location>>()
        
        locations = response
    }
}
```

## Summary

**Answer to your question**: 
- **YES**, there are free APIs (GeoNames, OpenStreetMap Nominatim) that provide location data from country level down to shopping centers
- **NO manual entry needed** - locations can be automatically populated via seed scripts and on-demand fetching
- **Recommended approach**: Use GeoNames for initial seed + on-demand fetching, with optional Google Places API for premium accuracy
