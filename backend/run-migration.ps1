# Run Chama & Reviews Removal Migration
# This script executes the SQL migration against your database

Write-Host "🗄️  Running Chama & Reviews Removal Migration..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "   Please create .env file with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Load DATABASE_URL from .env
$envContent = Get-Content ".env" -Raw
if ($envContent -match 'DATABASE_URL\s*=\s*"?([^"\r\n]+)"?') {
    $databaseUrl = $matches[1]
    Write-Host "✅ Found DATABASE_URL in .env" -ForegroundColor Green
} else {
    Write-Host "❌ Error: DATABASE_URL not found in .env!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⚠️  WARNING: This will DELETE the following tables:" -ForegroundColor Yellow
Write-Host "   - 13 Chama tables (chama, chama_wallet, chama_member, etc.)" -ForegroundColor Yellow
Write-Host "   - 4 Shop review tables (product_reviews, wishlists, etc.)" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Are you sure you want to proceed? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "❌ Migration cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Executing SQL migration..." -ForegroundColor Cyan

# Option 1: If psql is available
$psqlExists = Get-Command psql -ErrorAction SilentlyContinue
if ($psqlExists) {
    Write-Host "   Using psql..." -ForegroundColor Gray
    
    # Parse connection string (PostgreSQL URL format)
    # postgresql://user:password@host:port/database
    if ($databaseUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
        $dbUser = $matches[1]
        $dbPassword = $matches[2]
        $dbHost = $matches[3]
        $dbPort = $matches[4]
        $dbName = $matches[5]
        
        # Set password environment variable
        $env:PGPASSWORD = $dbPassword
        
        # Run migration
        psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f "prisma\migrations\remove_chama_and_reviews.sql"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
        } else {
            Write-Host ""
            Write-Host "❌ Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Error: Could not parse DATABASE_URL" -ForegroundColor Red
        exit 1
    }
} else {
    # Option 2: Use Prisma db execute
    Write-Host "   psql not found, using Prisma db execute..." -ForegroundColor Gray
    
    npx prisma db execute --file=".\prisma\migrations\remove_chama_and_reviews.sql" --schema=".\prisma\schema.prisma"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update prisma/schema.prisma (remove Chama models)" -ForegroundColor White
Write-Host "   2. Run: npx prisma generate" -ForegroundColor White
Write-Host "   3. Run: npm run build" -ForegroundColor White
Write-Host "   4. Test the application" -ForegroundColor White
Write-Host ""
