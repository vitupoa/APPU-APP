# Krieta Shop API Reference

Base URL: `/api/v1/shop`

## 🛍️ Products

### Create Product
```http
POST /products
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Toyota Corolla 2015",
  "description": "Well maintained, single owner",
  "imageUrls": ["https://..."],
  "priceKr": 1500000,
  "category": "VEHICLES",
  "condition": "USED",
  "whatsappNumber": "+254712345678",
  "contactMethod": "WHATSAPP",
  "location": "Nairobi",
  "stock": 1,
  "categoryDetails": {
    "vehicleType": "car",
    "make": "Toyota",
    "model": "Corolla",
    "year": 2015,
    "mileage": 85000,
    "fuelType": "PETROL",
    "transmission": "AUTOMATIC",
    "bodyType": "SEDAN"
  }
}
```

### Browse Products
```http
GET /products?category=VEHICLES&make=Toyota&yearFrom=2010&yearTo=2020&minPrice=500000&maxPrice=2000000&limit=20
```

### Get Single Product
```http
GET /products/:id
```

### Update Product
```http
PUT /products/:id
Authorization: Bearer {token}
```

### Delete Product
```http
DELETE /products/:id
Authorization: Bearer {token}
```

### Get My Products
```http
GET /products/mine
Authorization: Bearer {token}
```

### Get Trending Products
```http
GET /products/trending
```

### Get Categories
```http
GET /categories
```

---

## 🔧 Spare Parts

### Find Compatible Parts
```http
GET /parts/compatible?make=Toyota&model=Corolla&year=2015&partType=brake_pads
```

---

## ⭐ Reviews

### Create Review
```http
POST /reviews
Authorization: Bearer {token}

{
  "productId": "uuid",
  "rating": 5,
  "title": "Great product!",
  "text": "Highly recommended",
  "videoUrl": "https://...",
  "imageUrls": ["https://..."]
}
```

### Get Product Reviews
```http
GET /products/:id/reviews?cursor=uuid&limit=20
```

### Delete Review
```http
DELETE /reviews/:id
Authorization: Bearer {token}
```

---

## 💝 Wishlists

### Create Wishlist
```http
POST /wishlists
Authorization: Bearer {token}

{
  "name": "Birthday Wishlist",
  "isPublic": true,
  "isRegistry": true,
  "eventType": "birthday",
  "eventDate": "2024-12-25"
}
```

### Get User Wishlists
```http
GET /wishlists
Authorization: Bearer {token}
```

### Get Public Wishlists
```http
GET /wishlists/public/:userId
```

### Add Item to Wishlist
```http
POST /wishlists/:id/items
Authorization: Bearer {token}

{
  "productId": "uuid",
  "quantity": 1,
  "priority": 5,
  "notes": "Size M preferred"
}
```

### Remove Item from Wishlist
```http
DELETE /wishlists/:id/items/:itemId
Authorization: Bearer {token}
```

### Delete Wishlist
```http
DELETE /wishlists/:id
Authorization: Bearer {token}
```

---

## 🎁 Gifts

### Send Gift
```http
POST /gifts
Authorization: Bearer {token}

{
  "recipientId": "uuid",
  "productId": "uuid",
  "message": "Happy Birthday!"
}
```

### Get Received Gifts
```http
GET /gifts/received
Authorization: Bearer {token}
```

### Get Sent Gifts
```http
GET /gifts/sent
Authorization: Bearer {token}
```

---

## 🛒 Cart

### Add to Cart
```http
POST /cart
Authorization: Bearer {token}

{
  "productId": "uuid",
  "quantity": 2,
  "bargainPrice": 1400000
}
```

### Get Cart
```http
GET /cart
Authorization: Bearer {token}
```

### Remove from Cart
```http
DELETE /cart/:productId
Authorization: Bearer {token}
```

### Clear Cart
```http
DELETE /cart
Authorization: Bearer {token}
```

---

## 📦 Orders

### Create Order
```http
POST /orders
Authorization: Bearer {token}

{
  "notes": "Please deliver before 5pm"
}
```

### Get My Orders
```http
GET /orders?cursor=uuid&limit=20
Authorization: Bearer {token}
```

### Get Seller Orders
```http
GET /orders/seller?cursor=uuid&limit=20
Authorization: Bearer {token}
```

### Get Single Order
```http
GET /orders/:id
Authorization: Bearer {token}
```

### Update Order Status
```http
PATCH /orders/:id/status
Authorization: Bearer {token}

{
  "status": "SHIPPED"
}
```

### Confirm Delivery
```http
POST /orders/:orderId/items/:itemId/confirm-delivery
Authorization: Bearer {token}
```

---

## 💰 Discounts

### Create Discount
```http
POST /products/:id/discounts
Authorization: Bearer {token}

{
  "discountType": "percentage",
  "discountValue": 15,
  "minQuantity": 1,
  "startDate": "2024-12-01T00:00:00Z",
  "endDate": "2024-12-31T23:59:59Z"
}
```

### Get Product Discounts
```http
GET /products/:id/discounts
```

### Delete Discount
```http
DELETE /discounts/:id
Authorization: Bearer {token}
```

---

## ⚡ Flash Sales

### Create Flash Sale
```http
POST /flash-sales
Authorization: Bearer {token}

{
  "title": "Black Friday Sale",
  "type": "FLASH",
  "startTime": "2024-11-29T00:00:00Z",
  "endTime": "2024-11-29T23:59:59Z",
  "products": [
    {
      "productId": "uuid",
      "salePrice": 1200000,
      "stockLimit": 10,
      "perUserLimit": 1
    }
  ]
}
```

### Get Active Flash Sales
```http
GET /flash-sales/active
```

### Get Upcoming Flash Sales
```http
GET /flash-sales/upcoming
```

---

## 👥 Group Buying

### Create Group Buy
```http
POST /group-buys
Authorization: Bearer {token}

{
  "productId": "uuid",
  "title": "Group Buy: iPhone 15",
  "targetParticipants": 50,
  "discountPercent": 30,
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

### Get Active Group Buys
```http
GET /group-buys?cursor=uuid&limit=20
```

### Join Group Buy
```http
POST /group-buys/:id/join
Authorization: Bearer {token}
```

---

## 🔔 Deal Alerts

### Create Deal Alert
```http
POST /deal-alerts
Authorization: Bearer {token}

{
  "productId": "uuid",
  "category": "VEHICLES",
  "maxPriceKr": 1000000,
  "keywords": ["toyota", "corolla"]
}
```

### Get User Alerts
```http
GET /deal-alerts
Authorization: Bearer {token}
```

### Delete Alert
```http
DELETE /deal-alerts/:id
Authorization: Bearer {token}
```

---

## 🔧 Garages

### Create Garage Profile
```http
POST /garages
Authorization: Bearer {token}

{
  "businessName": "AutoFix Garage",
  "serviceTypes": ["oil_change", "brake_repair", "engine_diagnostics"],
  "location": "Nairobi",
  "offersOnSite": true
}
```

### List Garages
```http
GET /garages?location=Nairobi&serviceType=oil_change
```

### Get Garage Profile
```http
GET /garages/:id
```

### Create Booking
```http
POST /garages/bookings
Authorization: Bearer {token}

{
  "garageId": "uuid",
  "serviceType": "oil_change",
  "scheduledDate": "2024-12-20T10:00:00Z",
  "isOnSite": false
}
```

### Get My Bookings
```http
GET /garages/bookings/mine
Authorization: Bearer {token}
```

### Update Booking Status
```http
PATCH /garages/bookings/:id/status
Authorization: Bearer {token}

{
  "status": "COMPLETED"
}
```

### Review Garage
```http
POST /garages/:id/reviews
Authorization: Bearer {token}

{
  "rating": 5,
  "text": "Excellent service!"
}
```

---

## 🚗 Car Importers

### Create Importer Profile
```http
POST /importers
Authorization: Bearer {token}

{
  "businessName": "Global Auto Imports",
  "countriesServed": ["JP", "UK", "US"],
  "yearsExperience": 10
}
```

### List Importers
```http
GET /importers?country=JP
```

### Create Import Request
```http
POST /import-requests
Authorization: Bearer {token}

{
  "make": "Toyota",
  "model": "Land Cruiser",
  "yearFrom": 2018,
  "yearTo": 2020,
  "countryOfOrigin": "JP",
  "budget": 5000000
}
```

### Get Import Requests
```http
GET /import-requests
Authorization: Bearer {token}
```

### Submit Quote
```http
POST /import-requests/:id/quotes
Authorization: Bearer {token}

{
  "quoteAmountKr": 4800000,
  "estimatedDays": 60,
  "notes": "Includes shipping and clearance"
}
```

### Accept Quote
```http
POST /import-requests/:id/accept/:quoteId
Authorization: Bearer {token}
```

---

## 🚚 Logistics

### Create Logistics Company
```http
POST /logistics
Authorization: Bearer {token}

{
  "companyName": "FastShip Logistics",
  "serviceTypes": ["shipping", "towing"],
  "coverageAreas": ["Nairobi", "Mombasa"],
  "vehicleTypes": ["sedan", "suv", "truck"]
}
```

### List Logistics Companies
```http
GET /logistics?area=Nairobi&serviceType=shipping
```

### Create Shipping Job
```http
POST /shipping-jobs
Authorization: Bearer {token}

{
  "pickupLocation": "Nairobi",
  "deliveryLocation": "Mombasa",
  "jobType": "shipping",
  "vehicleDesc": "Toyota Corolla 2015"
}
```

---

## 📺 Live Shopping

### Create Live Session
```http
POST /live-sessions
Authorization: Bearer {token}

{
  "title": "Live Shopping: Fashion Week",
  "scheduledStart": "2024-12-25T18:00:00Z",
  "productIds": ["uuid1", "uuid2"]
}
```

### Get Active Sessions
```http
GET /live-sessions/active
```

### Get Upcoming Sessions
```http
GET /live-sessions/upcoming
```

### Start Session
```http
POST /live-sessions/:id/start
Authorization: Bearer {token}
```

### End Session
```http
POST /live-sessions/:id/end
Authorization: Bearer {token}
```

---

## 💎 Premium Listings

### Create Premium Listing
```http
POST /premium-listings
Authorization: Bearer {token}

{
  "productId": "uuid",
  "type": "FEATURED",
  "days": 7
}
```

---

## 📱 Social Shopping

### Share Product
```http
POST /shares
Authorization: Bearer {token}

{
  "productId": "uuid",
  "contentType": "POST",
  "caption": "Check out this amazing deal!"
}
```

### Tag Product
```http
POST /tags
Authorization: Bearer {token}

{
  "productId": "uuid",
  "contentId": "uuid",
  "contentType": "SHORT",
  "positionX": 50.5,
  "positionY": 30.2,
  "timestamp": 15
}
```

### Get Product Tags
```http
GET /tags/:contentType/:contentId
```

---

## 📊 Analytics

### Get Product Analytics
```http
GET /analytics/products/:id?days=30
Authorization: Bearer {token}
```

### Get Seller Analytics
```http
GET /analytics/seller?days=30
Authorization: Bearer {token}
```

### Get Category Analytics
```http
GET /analytics/categories
```

---

## ⭐ Vehicle Favorites

### Add Favorite
```http
POST /vehicles/favorites
Authorization: Bearer {token}

{
  "productId": "uuid"
}
```

### Remove Favorite
```http
DELETE /vehicles/favorites/:productId
Authorization: Bearer {token}
```

### Get Favorites
```http
GET /vehicles/favorites
Authorization: Bearer {token}
```

---

## 🧮 Price Calculator

### Calculate Import Cost
```http
POST /calculator/import-cost

{
  "vehiclePriceUsd": 15000,
  "destinationCountry": "KE",
  "engineCc": 1800,
  "yearOfManufacture": 2015
}
```

Response:
```json
{
  "vehiclePriceUsd": 15000,
  "destinationCountry": "KE",
  "breakdown": {
    "cif": 16500,
    "duty": 4125,
    "excise": 4125,
    "vat": 3960,
    "portCharges": 200,
    "clearingFees": 300,
    "registrationFees": 500
  },
  "totalCostUsd": 29710,
  "estimatedKr": 3862300
}
```

---

## 👥 Social Proof

### Get Friends Who Bought
```http
GET /products/:id/friends-bought
Authorization: Bearer {token}
```

### Get Friend Recommendations
```http
GET /recommendations/friends?limit=20
Authorization: Bearer {token}
```

---

## 🔐 Authentication

All endpoints marked with `Authorization: Bearer {token}` require a valid JWT token obtained from `/api/v1/auth/login`.

---

## 📝 Response Format

### Success Response
```json
{
  "id": "uuid",
  "title": "Product Title",
  "priceKr": 1500000,
  ...
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

### Paginated Response
```json
{
  "items": [...],
  "nextCursor": "uuid"
}
```

---

## 🎯 Query Parameters

### Common Filters
- `cursor` - Pagination cursor
- `limit` - Results per page (default: 20, max: 50)
- `sortBy` - Sort order (newest, price_asc, price_desc, popular, rating)

### Product Filters
- `category` - Product category
- `subcategory` - Product subcategory
- `q` - Search query
- `minPrice` / `maxPrice` - Price range
- `location` - Location filter
- `brand` - Brand filter
- `condition` - Product condition

### Vehicle Filters
- `make` / `model` - Vehicle make/model
- `bodyType` - Body type
- `yearFrom` / `yearTo` - Year range
- `mileageMax` - Maximum mileage
- `fuelType` - Fuel type
- `transmission` - Transmission type

---

## 📞 Contact Methods

Products support multiple contact methods:
- `WHATSAPP` - WhatsApp number
- `WEBSITE` - External website URL
- `PHONE` - Phone number
- `IN_APP_CHAT` - In-app messaging

---

## 💳 Platform Fees

- **Premium Listings**: Kr.10/day (FEATURED), Kr.25/day (PROMOTED), Kr.50/day (TOP_SPOT)
- **Order Platform Fee**: 2.5% of order total (deducted from seller payout)
- **Gift Escrow**: Held until delivery confirmation

---

**API Version**: v1  
**Last Updated**: December 2024
