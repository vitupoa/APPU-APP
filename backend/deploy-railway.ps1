# Runinga Backend - Railway Deployment Script
# Run this script to properly update Prisma and deploy to Railway

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Runinga Backend - Railway Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean install
Write-Host "[1/6] Cleaning node_modules and package-lock.json..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✓ Removed node_modules" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✓ Removed package-lock.json" -ForegroundColor Green
}

# Step 2: Install dependencies
Write-Host ""
Write-Host "[2/6] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Step 3: Verify Prisma version
Write-Host ""
Write-Host "[3/6] Verifying Prisma version..." -ForegroundColor Yellow
$prismaVersion = npx prisma --version | Select-String "prisma" | Select-Object -First 1
Write-Host "Prisma version: $prismaVersion" -ForegroundColor Cyan
if ($prismaVersion -match "7\.8\.0") {
    Write-Host "✓ Prisma 7.8.0 confirmed" -ForegroundColor Green
} else {
    Write-Host "✗ Prisma version mismatch. Expected 7.8.0" -ForegroundColor Red
    Write-Host "Run: npm install prisma@7.8.0 @prisma/client@7.8.0" -ForegroundColor Yellow
    exit 1
}

# Step 4: Generate Prisma Client
Write-Host ""
Write-Host "[4/6] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Prisma generate failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma Client generated" -ForegroundColor Green

# Step 5: Push schema to Railway
Write-Host ""
Write-Host "[5/6] Pushing schema to Railway database..." -ForegroundColor Yellow
Write-Host "This will update your production database!" -ForegroundColor Red
$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled" -ForegroundColor Yellow
    exit 0
}

npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Database push failed" -ForegroundColor Red
    Write-Host "Check your DATABASE_URL in .env" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Schema pushed to Railway" -ForegroundColor Green

# Step 6: Build TypeScript
Write-Host ""
Write-Host "[6/6] Building TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Build successful" -ForegroundColor Green

# Success
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✓ Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Add API keys to Railway environment variables" -ForegroundColor White
Write-Host "2. Push code to GitHub (Railway auto-deploys)" -ForegroundColor White
Write-Host "3. Monitor Railway logs for errors" -ForegroundColor White
Write-Host ""
Write-Host "API Keys needed:" -ForegroundColor Cyan
Write-Host "- YOUTUBE_API_KEY" -ForegroundColor White
Write-Host "- TWITTER_BEARER_TOKEN" -ForegroundColor White
Write-Host "- RAPIDAPI_KEY" -ForegroundColor White
Write-Host "- FACEBOOK_APP_ID" -ForegroundColor White
Write-Host "- FACEBOOK_APP_SECRET" -ForegroundColor White
Write-Host ""
Write-Host "See RAILWAY_DEPLOYMENT_GUIDE.md for details" -ForegroundColor Yellow
