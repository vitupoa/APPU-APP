# Krieta Multi-Category Marketplace — Implementation Plan

## Architecture Decision

**Listing-only marketplace** — Products/services are listed, buyers are directed to seller's WhatsApp or external purchase point. No direct payment processing for products (except premium listings, which use Kr wallet).

## Implementation Phases

### Phase 1: Database Schema (Foundation)
- Extend `Product` model with global fields
- Create 10 category-specific tables (vehicles, spare parts, real estate, etc.)
- Add pricing models (wholesale, bargaining, discounts, flash sales, group buying)
- Add review, wishlist, cart, and escrow models
- Add garage, importer, logistics models
- Add analytics and premium listing models

### Phase 2: Core Shop Services  
- Product CRUD with category-specific fields
- Category routing and validation
- Flexible pricing system
- Search & filtering engine

### Phase 3: Social & Discovery
- Reviews & ratings
- Wishlists & gifting
- Flash sales & deals
- Social shopping integration

### Phase 4: Specialized Verticals
- Vehicle marketplace specifics
- Spare parts compatibility
- Garage services & bookings
- Car importers & logistics

### Phase 5: Advanced Features
- Live shopping sessions
- Premium listings & subscriptions
- Group buying campaigns
- Deal alerts

### Phase 6: Analytics & Integration
- Product/seller/category analytics
- Affiliate system integration
- Social feed integration (Drips/Sips tagging)
- Notification system integration

## File Structure
```
backend/src/modules/shop/
├── shop.routes.ts          (main router - delegates to sub-routers)
├── shop.service.ts         (core product CRUD)
├── shop.types.ts           (shared types & Zod schemas)
├── pricing.service.ts      (pricing calculations)
├── cart.service.ts          (cart & checkout)
├── wishlist.service.ts      (wishlists & gifting)
├── review.service.ts        (reviews & ratings)
├── flash-sale.service.ts    (flash sales & deals)
├── garage.service.ts        (garage profiles & bookings)
├── importer.service.ts      (car importers & logistics)
├── live-shopping.service.ts (live shopping sessions)
├── premium.service.ts       (premium listings)
├── analytics.service.ts     (shop analytics)
└── search.service.ts        (search & discovery)
```
