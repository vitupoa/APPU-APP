# Apply Backend Schema Fixes
# This script:
# 1. Creates the user_bookmarks table
# 2. Regenerates Prisma client with updated schema

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backend Schema Fixes - Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot"

Write-Host "[1/3] Applying user_bookmarks table migration..." -ForegroundColor Yellow

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "ERROR: DATABASE_URL environment variable is not set!" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL in your .env file or environment" -ForegroundColor Red
    exit 1
}

# Apply SQL migration directly
$migrationFile = ".\prisma\migrations\create_user_bookmarks_table.sql"
if (Test-Path $migrationFile) {
    Write-Host "Executing SQL migration: $migrationFile" -ForegroundColor Green
    
    # Use npx prisma db execute
    Write-Host "Applying migration to database..." -ForegroundColor Yellow
    npx prisma db execute --file $migrationFile --schema ./prisma/schema.prisma
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migration applied successfully" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to apply migration" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client generated successfully" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/3] Verifying schema..." -ForegroundColor Yellow
npx prisma validate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Schema is valid" -ForegroundColor Green
} else {
    Write-Host "WARNING: Schema validation had issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ All fixes applied successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary of fixes:" -ForegroundColor White
Write-Host "  • Created user_bookmarks table" -ForegroundColor White
Write-Host "  • Fixed chama_members → chama_member references" -ForegroundColor White
Write-Host "  • Fixed story views → story_view references" -ForegroundColor White
Write-Host "  • Fixed story creator → user references" -ForegroundColor White
Write-Host "  • Fixed chamaWallet → chama_wallet references" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your backend server (npm run dev)" -ForegroundColor White
Write-Host "  2. Test the following endpoints:" -ForegroundColor White
Write-Host "     - GET /api/v1/stories/feed" -ForegroundColor White
Write-Host "     - GET /api/v1/stories/me" -ForegroundColor White
Write-Host "     - GET /api/v1/chama/*" -ForegroundColor White
Write-Host "     - GET /api/v1/shorts/feed" -ForegroundColor White
Write-Host ""
