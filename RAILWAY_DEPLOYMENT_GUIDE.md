# 🚂 Railway Deployment Guide - Prisma 7.8.0

## 🚨 Issue Fixed

**Problem**: `P3006 - Migration failed to apply cleanly to the shadow database`  
**Cause**: Railway databases don't support shadow databases by default  
**Solution**: Use `prisma db push` for Railway or configure shadow database

---

## ✅ Solution 1: Use `prisma db push` (Recommended for Railway)

For production databases like Railway, use `db push` instead of `migrate dev`:

```bash
# Clean install dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# Generate Prisma Client 7.8.0
npx prisma generate

# Push schema to Railway database (no shadow database needed)
npx prisma db push

# Start server
npm run dev
```

### Why `db push`?
- ✅ No shadow database required
- ✅ Works with Railway, Heroku, Vercel
- ✅ Directly syncs schema to database
- ✅ Perfect for development/staging

---

## ✅ Solution 2: Configure Shadow Database (For Migrations)

If you need proper migrations, add a shadow database URL to `.env`:

### Step 1: Add Shadow Database URL

Create a second database in Railway or use a local PostgreSQL:

```env
# .env
DATABASE_URL="postgresql://user:pass@maglev.proxy.rlwy.net:47013/railway"
SHADOW_DATABASE_URL="postgresql://user:pass@localhost:5432/krieta_shadow"
```

### Step 2: Run Migrations

```bash
npx prisma migrate dev --name add_shop_features
```

---

## 🔧 Quick Fix Commands

### For Railway (Production):
```bash
cd backend

# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Generate Prisma Client 7.8.0
npx prisma generate

# 3. Push schema (no migrations)
npx prisma db push

# 4. Verify
npx prisma db pull
```

### For Local Development:
```bash
cd backend

# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Generate Prisma Client 7.8.0
npx prisma generate

# 3. Run migrations
npx prisma migrate dev

# 4. Start server
npm run dev
```

---

## 📝 What Changed

### 1. package.json Updates
```json
{
  "dependencies": {
    "@prisma/adapter-pg": "^7.8.0",  // Updated from 7.0.0
    "@prisma/client": "^7.8.0"       // Already at 7.8.0
  },
  "devDependencies": {
    "prisma": "^7.8.0"                // Updated from 6.19.3
  }
}
```

### 2. schema.prisma Updates
```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")  // Added
}
```

### 3. Removed Dependencies
- ❌ `bullmq@0.0.1` (unused, caused node-uuid deprecation)

---

## 🎯 Railway Deployment Steps

### Step 1: Update Dependencies Locally
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

### Step 2: Push to Git
```bash
git add .
git commit -m "Update Prisma to 7.8.0 and fix Railway deployment"
git push origin main
```

### Step 3: Deploy to Railway

Railway will automatically:
1. Install dependencies (Prisma 7.8.0)
2. Run `npm run postinstall` (prisma generate)
3. Start the server

### Step 4: Push Schema to Railway Database

After deployment, run this command locally (connected to Railway DB):

```bash
npx prisma db push
```

Or add to Railway's build command:
```json
{
  "scripts": {
    "build": "prisma generate && prisma db push && tsc --noEmit"
  }
}
```

---

## 🔍 Verify Prisma Version

After installation, verify the version:

```bash
npx prisma --version
```

Expected output:
```
prisma                  : 7.8.0
@prisma/client          : 7.8.0
Computed binaryTarget   : windows
Operating System        : windows
Architecture            : x64
Node.js                 : v22.x.x
```

---

## 🐛 Troubleshooting

### Issue: Still showing Prisma 6.19.3

**Solution**:
```bash
# Clear Prisma cache
rm -rf node_modules/.prisma
rm -rf src/generated/prisma

# Reinstall
npm install
npx prisma generate
```

### Issue: Cannot reach database server

**Solution**:
1. Check Railway database is running
2. Verify `DATABASE_URL` in `.env`
3. Check Railway network connectivity
4. Try `npx prisma db pull` to test connection

### Issue: Shadow database error persists

**Solution**: Use `prisma db push` instead of `migrate dev`
```bash
npx prisma db push
```

### Issue: node-uuid deprecation warning

**Solution**: Already fixed by removing `bullmq@0.0.1`
```bash
npm list node-uuid
# Should return empty
```

---

## 📊 Comparison: migrate dev vs db push

| Feature | `migrate dev` | `db push` |
|---------|---------------|-----------|
| **Shadow DB Required** | ✅ Yes | ❌ No |
| **Migration History** | ✅ Yes | ❌ No |
| **Railway Compatible** | ⚠️ Needs config | ✅ Yes |
| **Production Use** | ✅ Recommended | ⚠️ Dev/Staging |
| **Speed** | Slower | ✅ Faster |
| **Rollback** | ✅ Yes | ❌ No |

---

## 🎯 Recommended Workflow

### For Railway (Production):
```bash
# Use db push for quick schema sync
npx prisma db push
```

### For Local Development:
```bash
# Use migrations for version control
npx prisma migrate dev
```

### For CI/CD:
```bash
# Use migrate deploy for production migrations
npx prisma migrate deploy
```

---

## 📝 Environment Variables

### Required for Railway:
```env
DATABASE_URL="postgresql://user:pass@maglev.proxy.rlwy.net:47013/railway"
```

### Optional (for migrations):
```env
SHADOW_DATABASE_URL="postgresql://user:pass@localhost:5432/krieta_shadow"
```

---

## ✅ Success Checklist

After deployment, verify:

- [ ] `npm install` completes without errors
- [ ] No `node-uuid` deprecation warnings
- [ ] `npx prisma --version` shows 7.8.0
- [ ] `npx prisma generate` succeeds
- [ ] `npx prisma db push` succeeds (Railway)
- [ ] Server starts without errors
- [ ] Database queries work
- [ ] Shop endpoints respond

---

## 🚀 Quick Commands Reference

```bash
# Clean install
rm -rf node_modules package-lock.json && npm install

# Generate Prisma Client
npx prisma generate

# Push schema (Railway)
npx prisma db push

# Run migrations (Local)
npx prisma migrate dev

# Deploy migrations (Production)
npx prisma migrate deploy

# Check version
npx prisma --version

# Test connection
npx prisma db pull

# View database
npx prisma studio
```

---

## 📞 Need Help?

### Railway Database Issues:
1. Check Railway dashboard for database status
2. Verify connection string in Railway variables
3. Test connection: `npx prisma db pull`

### Prisma Version Issues:
1. Clear cache: `rm -rf node_modules/.prisma`
2. Reinstall: `npm install`
3. Regenerate: `npx prisma generate`

### Migration Issues:
1. Use `db push` for Railway
2. Use `migrate dev` for local
3. Use `migrate deploy` for production

---

**Updated**: December 2024  
**Prisma Version**: 7.8.0  
**Railway Compatible**: ✅ YES  
**Status**: Ready to Deploy 🚀
