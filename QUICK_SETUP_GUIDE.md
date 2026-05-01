# Quick Setup Guide - Database & Seeds

## Current Status
✅ Schema already includes `CreatorBoostSettings` and `CreatorNiche` models
✅ Seed scripts created with correct imports
✅ Package.json updated with seed commands

## Steps to Deploy

### 1. Push Schema to Railway (Production)
```bash
# From backend directory
npx prisma db push
```

This will:
- Create all tables in your Railway PostgreSQL database
- Skip migration files (direct push)
- Faster than migrations for development

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Seeds
```bash
# Run all seeds
npm run seed

# Or run individually
npm run seed:admin    # Creates super admin
npm run seed:niches   # Seeds 21 predefined niches
```

### 4. Verify Super Admin Credentials
```
Email: admin@krieta.com
Password: Admin@123
```
⚠️ **IMPORTANT**: Change password immediately after first login!

### 5. Start Backend Server
```bash
npm run dev
```

## Troubleshooting

### If `npx prisma db push` fails:
```bash
# Check database connection
npx prisma db pull

# If connection works, try push again
npx prisma db push --accept-data-loss
```

### If seeds fail:
```bash
# Generate Prisma client first
npx prisma generate

# Then run seeds
npm run seed
```

### If import errors occur:
The seed scripts now use `@prisma/client` instead of custom path.
Make sure Prisma client is generated: `npx prisma generate`

## What Gets Created

### Tables
- `creator_boost_settings` (singleton with ID: 00000000-0000-0000-0000-000000000001)
- `creator_niches` (21 predefined + custom niches)
- All other existing tables remain unchanged

### Default Data
- **Super Admin User**
  - Email: admin@krieta.com
  - Username: krietaadmin
  - Role: SUPER_ADMIN
  
- **21 Predefined Niches**
  - Tech & Gadgets
  - Fashion & Style
  - Beauty & Makeup
  - Automotive
  - Food & Beverage
  - Health & Fitness
  - Education
  - Entertainment
  - Gaming
  - Travel
  - Real Estate
  - Finance & Investment
  - Sports
  - Music
  - Art & Design
  - Business & Entrepreneurship
  - Lifestyle
  - Parenting
  - Pets & Animals
  - Home & Decor
  - General

- **Creator Boost Settings** (defaults)
  - Min Boost Amount: KES 500
  - Short CPM: KES 50
  - Post CPM: KES 40
  - Live CPM: KES 60

## Next Steps

After successful deployment:
1. ✅ Test super admin login
2. ✅ Verify niches are loaded
3. ✅ Test API endpoints with Postman
4. ✅ Update frontend to connect to new endpoints
5. ✅ Test end-to-end flows

## Frontend Integration

See `FRONTEND_INTEGRATION_GUIDE.md` for:
- API service interfaces
- ViewModel updates
- Dependency injection setup
- Testing checklist
