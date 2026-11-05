# Runinga Backend - Prisma 7.8.0 Update & Railway Deployment Guide

## Issue: Prisma keeps reverting to 6.19.3

**Root Cause**: `npm audit fix --force` downgrades Prisma because of dependency conflicts.

## Solution: Proper Update Steps

### Step 1: Clean Install Prisma 7.8.0

```bash
cd backend

# Remove node_modules and lock file
rm -rf node_modules
rm package-lock.json

# Install dependencies fresh
npm install

# Verify Prisma version
npx prisma --version
# Should show: prisma: 7.8.0
```

### Step 2: Update Prisma Schema for Railway

Since you're using Railway (production), you need to:

1. **Disable shadow database** (Railway doesn't support it)
2. **Use `db push` instead of `migrate dev`**

Update your `prisma/schema.prisma`:

```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  // Remove shadowDatabaseUrl for Railway
  // shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

### Step 3: Deploy Schema to Railway

```bash
# Push schema changes to Railway database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### Step 4: Add Marketplace Tables to Schema

Since you can't use migrations on Railway, you need to add the new tables directly to your `schema.prisma` file.

**Option A: Merge schemas manually**
- Copy models from `brand-marketplace-schema.prisma`
- Copy models from `social-media-schema.prisma`
- Paste into main `schema.prisma`
- Run `npx prisma db push`

**Option B: Use raw SQL** (if schema is too large)
```bash
# Connect to Railway database
psql $DATABASE_URL

# Run the SQL migration file
\i migrations/add_marketplace_and_social_media.sql
```

### Step 5: Fix npm audit vulnerabilities (AFTER Prisma is updated)

```bash
# Only fix non-breaking changes
npm audit fix

# DO NOT use --force (it will downgrade Prisma)
```

## Railway-Specific Configuration

### Environment Variables in Railway

Add these to your Railway project:

```env
# Database (Railway provides this automatically)
DATABASE_URL=postgresql://...

# API Keys for Social Media Integration
YOUTUBE_API_KEY=your_youtube_api_key
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
RAPIDAPI_KEY=your_rapidapi_key
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Other existing vars
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
# etc.
```

### How to Add Environment Variables in Railway:

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable one by one
6. Click "Deploy" to apply changes

## Getting API Keys

### 1. YouTube Data API v3
**Where**: https://console.cloud.google.com/

**Steps**:
1. Create a new project (or select existing)
2. Go to "APIs & Services" → "Library"
3. Search for "YouTube Data API v3"
4. Click "Enable"
5. Go to "Credentials" → "Create Credentials" → "API Key"
6. Copy the API key
7. (Optional) Restrict the key to YouTube Data API only

**Cost**: Free (10,000 quota units/day)

### 2. Twitter API v2 Bearer Token
**Where**: https://developer.twitter.com/

**Steps**:
1. Sign up for Twitter Developer Account
2. Create a new app
3. Go to "Keys and tokens" tab
4. Generate "Bearer Token"
5. Copy the bearer token

**Cost**: Free tier available (500,000 tweets/month)

### 3. RapidAPI Key (for TikTok)
**Where**: https://rapidapi.com/

**Steps**:
1. Sign up for RapidAPI account
2. Search for "TikTok Scraper" API
3. Subscribe to a plan (free tier available)
4. Go to "Endpoints" tab
5. Copy your "X-RapidAPI-Key" from the code snippet

**Cost**: Free tier (100 requests/month), Paid plans start at $10/month

### 4. Facebook/Instagram Graph API
**Where**: https://developers.facebook.com/

**Steps**:
1. Create a Facebook Developer account
2. Create a new app
3. Add "Instagram Graph API" product
4. Go to "Settings" → "Basic"
5. Copy "App ID" and "App Secret"
6. Set up OAuth redirect URI: `https://your-domain.com/api/v1/marketplace/oauth/callback`

**Cost**: Free

## Deployment Checklist

- [ ] Update `package.json` with Prisma 7.8.0
- [ ] Remove `node_modules` and `package-lock.json`
- [ ] Run `npm install`
- [ ] Verify Prisma version: `npx prisma --version`
- [ ] Remove `shadowDatabaseUrl` from schema.prisma
- [ ] Add marketplace models to schema.prisma
- [ ] Run `npx prisma db push` to update Railway database
- [ ] Run `npx prisma generate` to generate client
- [ ] Add API keys to Railway environment variables
- [ ] Push code to GitHub (Railway auto-deploys)
- [ ] Verify deployment in Railway logs

## Troubleshooting

### Error: "Can't reach database server"
**Solution**: Railway database might be sleeping. Wait 30 seconds and try again.

### Error: "Migration failed to apply to shadow database"
**Solution**: Remove `shadowDatabaseUrl` from schema.prisma. Railway doesn't support shadow databases.

### Error: "Prisma version mismatch"
**Solution**: 
```bash
rm -rf node_modules
rm package-lock.json
npm install
npx prisma generate
```

### Error: "npm audit fix downgrades Prisma"
**Solution**: Don't use `--force` flag. Only run `npm audit fix` without force.

## Alternative: Direct SQL Execution on Railway

If `prisma db push` fails, you can execute SQL directly:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Connect to database
railway run psql $DATABASE_URL

# Inside psql, run:
\i migrations/add_marketplace_and_social_media.sql
```

## Verification

After deployment, verify everything works:

```bash
# Check Prisma version
npx prisma --version

# Check database connection
npx prisma db pull

# Check generated client
ls src/generated/prisma

# Test API endpoint
curl https://your-railway-app.up.railway.app/health
```

## Next Steps After Successful Deployment

1. Test social media integration endpoints
2. Test marketplace endpoints
3. Monitor Railway logs for errors
4. Set up monitoring/alerts
5. Test frontend integration

---

**Important**: Always test in a staging environment before deploying to production!
