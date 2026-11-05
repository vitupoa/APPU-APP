# Railway npm install Fix

## Problem
Your Railway deployment is failing at `npm install` with exit code 1. This is happening during the `postinstall` script that runs `prisma generate`.

## Root Causes

### Most Likely: Prisma Generation Needs DATABASE_URL
The postinstall script runs `prisma generate`, which may require DATABASE_URL even though it shouldn't technically need it.

### Solution 1: Skip Postinstall During Build (Recommended)

Update your `package.json` to separate build and runtime Prisma generation:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "postinstall": "",
    "build": "echo 'Build complete'",
    "start": "prisma generate && prisma migrate deploy && tsx src/index.ts",
    "start:prod": "npm run migrate:rls && npm run start"
  }
}
```

**Why this works:**
- Removes `prisma generate` from postinstall (which runs during npm install)
- Moves it to the start command where DATABASE_URL is available
- Railway will have access to environment variables at runtime

### Solution 2: Add DATABASE_URL to Build Environment

In Railway:
1. Go to your service
2. Click "Variables"
3. Under "Build", add a temporary DATABASE_URL:
   ```
   DATABASE_URL=postgresql://user:pass@localhost:5432/dummy
   ```

This lets Prisma generate its client during build (it won't connect, just generate code).

### Solution 3: Use Railway's Prisma Plugin

Add to `railway.toml`:

```toml
[build]
builder = "railpack"

[build.env]
NODE_ENV = "production"

[[build.plugins]]
plugin = "prisma"

[deploy]
startCommand = "prisma migrate deploy && npm start"
healthcheckPath = "/health"
healthcheckTimeout = 600
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

## Quick Fix Steps

### Option A: Modify package.json (Fastest)

1. Update `backend/package.json`:
```json
"scripts": {
  "dev": "tsx watch src/index.ts",
  "postinstall": "",
  "build": "echo 'Build skipped - generated at runtime'",
  "start": "prisma generate && prisma migrate deploy && tsx src/index.ts",
  "start:prod": "prisma generate && npm run migrate:rls && tsx src/index.ts"
}
```

2. Commit and push:
```bash
git add backend/package.json
git commit -m "fix: remove prisma generate from postinstall for Railway"
git push
```

3. Railway will automatically redeploy

### Option B: Add Build Variables in Railway

1. Go to Railway dashboard
2. Select your backend service
3. Click "Variables" tab
4. Click "Add Variable"
5. Select "Build" scope
6. Add:
   - Key: `DATABASE_URL`
   - Value: `postgresql://dummy:dummy@localhost:5432/dummy`

### Option C: Check if it's a memory issue

If the above don't work, the build might be running out of memory. Check Railway logs for "heap out of memory" or similar errors.

Railway's default memory during build might not be enough for large dependency trees.

## Verification

After applying the fix, you should see:
1. ✅ `npm install` completes successfully
2. ✅ Build phase completes
3. ✅ `prisma generate` runs during startup
4. ✅ Application starts successfully

## Alternative: Use Docker

If Railway's Railpack builder keeps causing issues, create a `Dockerfile` in the backend folder:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma client at runtime
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm start"]
```

Then update `railway.toml`:
```toml
[build]
builder = "docker"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/health"
```

## Which Solution Should You Use?

**Recommended:** Solution 1 (modify package.json)
- Simplest
- No Railway config changes needed
- Follows best practices (generate at runtime with correct DB)

**Use Solution 2 if:**
- You can't change package.json
- Other scripts depend on postinstall

**Use Docker if:**
- You need full control over the build process
- Railpack has persistent issues

## Next Steps

1. Apply Solution 1 (modify package.json)
2. Commit and push
3. Watch Railway logs
4. If it still fails, check the **actual error message** in the full logs
5. Report back with the specific error if none of these work

Let me know which solution you'd like to try!
