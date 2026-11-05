# Railway Deployment Guide - Ad System

## Prerequisites
- Railway CLI installed
- Backend already deployed on Railway
- Database connection configured

## Deployment Steps

### 1. Add Ad Tables to Prisma Schema

The ad tables have been added to `backend/prisma/schema.prisma`:
- AdConfig
- AdCampaign
- SponsoredPostRequest
- AdAnalytics

### 2. Generate Prisma Migration

```bash
cd backend
npx prisma migrate dev --name add_ad_system
```

This creates a new migration file in `prisma/migrations/`.

### 3. Deploy to Railway

**Option A: Automatic Deployment (Recommended)**

Railway will automatically detect the new migration and run it on next deployment:

```bash
git add .
git commit -m "Add comprehensive ad system with super admin controls"
git push origin main
```

Railway will:
1. Detect changes in `prisma/schema.prisma`
2. Run `npx prisma migrate deploy` automatically
3. Restart the service

**Option B: Manual Migration**

If you need to run the migration manually:

```bash
# Connect to Railway database
railway run npx prisma migrate deploy

# Or use Railway CLI
railway connect
npx prisma migrate deploy
```

### 4. Verify Migration

Check that tables were created:

```bash
railway run npx prisma studio
```

Or connect to PostgreSQL directly:

```bash
railway connect postgres
\dt  # List all tables
\d ad_config  # Describe ad_config table
```

### 5. Seed Default Ad Config

The ad_config table should have one row with default values:

```sql
INSERT INTO ad_config (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
```

This is automatically created by the migration.

### 6. Update Environment Variables (if needed)

No new environment variables required. The ad system uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - For authentication

### 7. Test Super Admin Access

1. **Create Super Admin User** (if not exists):

```sql
-- Connect to Railway database
UPDATE users 
SET is_admin = true 
WHERE email = 'admin@runinga.com';

-- Add admin profile
INSERT INTO admin_profiles (user_id, role, is_active)
SELECT id, 'SUPER_ADMIN', true
FROM users
WHERE email = 'admin@runinga.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'SUPER_ADMIN';
```

2. **Test API Endpoints**:

```bash
# Get ad config
curl -X GET https://your-railway-app.up.railway.app/api/v1/admin/ads/config \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update platform cut
curl -X PUT https://your-railway-app.up.railway.app/api/v1/admin/ads/config/platform-cut \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platformCutPercentage": 15.0}'
```

### 8. Monitor Deployment

Check Railway logs:

```bash
railway logs
```

Look for:
- ✅ Migration completed successfully
- ✅ Server started
- ✅ Database connection established

## Rollback (if needed)

If something goes wrong:

```bash
# Rollback last migration
railway run npx prisma migrate resolve --rolled-back MIGRATION_NAME

# Or drop ad tables manually
railway connect postgres
DROP TABLE IF EXISTS ad_analytics CASCADE;
DROP TABLE IF EXISTS sponsored_post_requests CASCADE;
DROP TABLE IF EXISTS ad_campaigns CASCADE;
DROP TABLE IF EXISTS ad_config CASCADE;
```

## Post-Deployment Checklist

- [ ] Ad tables created in database
- [ ] Default ad_config row inserted
- [ ] Super admin user configured
- [ ] API endpoints responding
- [ ] Admin dashboard accessible (SUPER_ADMIN only)
- [ ] Ad components rendering in app

## Troubleshooting

### Migration Failed

**Error**: `Migration failed to apply`

**Solution**:
```bash
# Reset migration state
railway run npx prisma migrate resolve --applied MIGRATION_NAME

# Or force reset (CAUTION: loses data)
railway run npx prisma migrate reset
```

### Tables Not Created

**Error**: `Table 'ad_config' doesn't exist`

**Solution**:
```bash
# Manually run migration SQL
railway connect postgres
# Copy contents of backend/prisma/migrations/add_ad_config.sql
# Paste and execute
```

### Super Admin Access Denied

**Error**: `Access Denied - Only Super Admins can access Ad Management`

**Solution**:
```sql
-- Verify admin profile exists
SELECT u.email, ap.role 
FROM users u
LEFT JOIN admin_profiles ap ON u.id = ap.user_id
WHERE u.is_admin = true;

-- If missing, create admin profile
INSERT INTO admin_profiles (user_id, role, is_active)
SELECT id, 'SUPER_ADMIN', true
FROM users
WHERE email = 'YOUR_ADMIN_EMAIL'
ON CONFLICT (user_id) DO UPDATE SET role = 'SUPER_ADMIN';
```

### JWT Token Missing adminRole

**Error**: `userRole is null`

**Solution**:
Update backend auth service to include adminRole in JWT payload:

```typescript
// backend/src/modules/auth/auth.service.ts
const payload = {
  userId: user.id,
  email: user.email,
  adminRole: adminProfile?.role || null
};
```

Then re-login to get new token with adminRole.

## Performance Considerations

### Database Indexes

The migration includes indexes for:
- `ad_campaigns(brand_id, status, start_date, end_date)`
- `sponsored_post_requests(brand_id, creator_id, status)`
- `ad_analytics(date)`

### Query Optimization

Ad config is cached in memory for 5 minutes to reduce database load:

```typescript
// backend/src/modules/ads/adManagement.service.ts
private configCache: { data: AdConfig; timestamp: number } | null = null;

async getAdConfig() {
  const now = Date.now();
  if (this.configCache && now - this.configCache.timestamp < 300000) {
    return this.configCache.data;
  }
  
  const config = await this.prisma.adConfig.findUnique({
    where: { id: '00000000-0000-0000-0000-000000000001' }
  });
  
  this.configCache = { data: config, timestamp: now };
  return config;
}
```

## Monitoring & Alerts

Set up Railway alerts for:
- Database connection errors
- Migration failures
- High API error rates
- Slow query performance

## Support

For deployment issues:
- Railway Docs: https://docs.railway.app
- Prisma Docs: https://www.prisma.io/docs
- Runinga Support: dev@runinga.com
