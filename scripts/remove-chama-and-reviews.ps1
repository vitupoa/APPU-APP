# ==========================================
# REMOVE CHAMA & SHOP REVIEWS/WISHLISTS
# PowerShell Cleanup Script
# ==========================================

Write-Host "🧹 Starting Chama & Shop Reviews/Wishlists Cleanup..." -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"
$projectRoot = "c:\Users\ADMIN\Runinga"

# ==========================================
# 1. CREATE BACKUP
# ==========================================
Write-Host "📦 Step 1: Creating backup..." -ForegroundColor Yellow

# Git backup
Write-Host "  Creating git backup branch..."
git checkout -b backup-before-cleanup 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Git backup branch created" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Could not create git backup (branch may exist)" -ForegroundColor Yellow
}
git checkout main 2>$null

# Create cleanup branch
Write-Host "  Creating cleanup branch..."
git checkout -b remove-chama-reviews 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Cleanup branch created" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Branch already exists, using existing branch" -ForegroundColor Yellow
}

Write-Host ""

# ==========================================
# 2. DELETE BACKEND FILES
# ==========================================
Write-Host "📁 Step 2: Deleting backend files..." -ForegroundColor Yellow

$backendFilesToDelete = @(
    "$projectRoot\backend\src\modules\chama",
    "$projectRoot\backend\src\workers\chamaDefaultWorker.ts",
    "$projectRoot\backend\src\services\compliance\chamaPatternDetection.service.ts",
    "$projectRoot\backend\dist\modules\chama",
    "$projectRoot\backend\dist\workers\chamaDefaultWorker.js",
    "$projectRoot\backend\dist\services\compliance\chamaPatternDetection.service.js"
)

$deletedBackend = 0
foreach ($file in $backendFilesToDelete) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Recurse -Force
        Write-Host "  ✅ Deleted: $(Split-Path $file -Leaf)" -ForegroundColor Green
        $deletedBackend++
    } else {
        Write-Host "  ⏭️  Not found: $(Split-Path $file -Leaf)" -ForegroundColor Gray
    }
}

Write-Host "  📊 Backend files deleted: $deletedBackend" -ForegroundColor Cyan
Write-Host ""

# ==========================================
# 3. DELETE FRONTEND FILES
# ==========================================
Write-Host "📱 Step 3: Deleting frontend files..." -ForegroundColor Yellow

$frontendFilesToDelete = @(
    "$projectRoot\composeApp\src\commonMain\kotlin\com\krieta\feature\chama"
)

$deletedFrontend = 0
foreach ($file in $frontendFilesToDelete) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Recurse -Force
        Write-Host "  ✅ Deleted: $(Split-Path $file -Leaf)" -ForegroundColor Green
        $deletedFrontend++
    } else {
        Write-Host "  ⏭️  Not found: $(Split-Path $file -Leaf)" -ForegroundColor Gray
    }
}

Write-Host "  📊 Frontend directories deleted: $deletedFrontend" -ForegroundColor Cyan
Write-Host ""

# ==========================================
# 4. DELETE DOCUMENTATION
# ==========================================
Write-Host "📝 Step 4: Deleting documentation..." -ForegroundColor Yellow

$docsToDelete = @(
    "$projectRoot\chama_implementation_plan.md",
    "$projectRoot\chama_implementation_plan_copy.md"
)

$deletedDocs = 0
foreach ($doc in $docsToDelete) {
    if (Test-Path $doc) {
        Remove-Item -Path $doc -Force
        Write-Host "  ✅ Deleted: $(Split-Path $doc -Leaf)" -ForegroundColor Green
        $deletedDocs++
    } else {
        Write-Host "  ⏭️  Not found: $(Split-Path $doc -Leaf)" -ForegroundColor Gray
    }
}

Write-Host "  📊 Documentation files deleted: $deletedDocs" -ForegroundColor Cyan
Write-Host ""

# ==========================================
# 5. UPDATE BACKEND INDEX.TS
# ==========================================
Write-Host "✏️  Step 5: Updating backend index.ts..." -ForegroundColor Yellow

$indexPath = "$projectRoot\backend\src\index.ts"
if (Test-Path $indexPath) {
    $content = Get-Content $indexPath -Raw
    
    # Remove imports
    $content = $content -replace "import \{ chamaRoutes \} from './modules/chama/chama\.routes\.js';\r?\n?", ""
    $content = $content -replace "import \{ startChamaDefaultWorker \} from './workers/chamaDefaultWorker\.js';\r?\n?", ""
    
    # Remove route registration
    $content = $content -replace "app\.use\('/api/v1/chamas', chamaRoutes\);\r?\n?", ""
    
    # Remove worker initialization
    $content = $content -replace "\s+startChamaDefaultWorker\(\);\r?\n?", ""
    
    Set-Content $indexPath -Value $content -NoNewline
    Write-Host "  ✅ index.ts updated" -ForegroundColor Green
} else {
    Write-Host "  ❌ index.ts not found" -ForegroundColor Red
}

Write-Host ""

# ==========================================
# 6. UPDATE SECURITY CONFIG
# ==========================================
Write-Host "🔒 Step 6: Updating security config..." -ForegroundColor Yellow

$securityPath = "$projectRoot\backend\src\config\security.ts"
if (Test-Path $securityPath) {
    $content = Get-Content $securityPath -Raw
    
    # Remove chama path from cache control
    $content = $content -replace "\s+req\.path\.includes\('/api/v1/chamas'\)\) \{\r?\n?", " {"
    $content = $content -replace "\|\|\s*\r?\n\s+req\.path\.includes\('/api/v1/chamas'\)", ""
    
    Set-Content $securityPath -Value $content -NoNewline
    Write-Host "  ✅ security.ts updated" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  security.ts not found" -ForegroundColor Yellow
}

Write-Host ""

# ==========================================
# 7. UPDATE CLOUDINARY CONFIG
# ==========================================
Write-Host "☁️  Step 7: Updating cloudinary config..." -ForegroundColor Yellow

$cloudinaryPath = "$projectRoot\backend\src\config\cloudinary.ts"
if (Test-Path $cloudinaryPath) {
    $content = Get-Content $cloudinaryPath -Raw
    
    # Remove chama cloudinary folders
    $content = $content -replace "\s+// Chat - Chama Groups\r?\n", ""
    $content = $content -replace "\s+CHAT_CHAMA_IMAGES: 'Krieta/Chats/Chama/Images',\r?\n", ""
    $content = $content -replace "\s+CHAT_CHAMA_VIDEOS: 'Krieta/Chats/Chama/Videos',\r?\n", ""
    
    Set-Content $cloudinaryPath -Value $content -NoNewline
    Write-Host "  ✅ cloudinary.ts updated" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  cloudinary.ts not found" -ForegroundColor Yellow
}

Write-Host ""

# ==========================================
# 8. UPDATE TRANSACTION TYPES
# ==========================================
Write-Host "💰 Step 8: Updating transaction types..." -ForegroundColor Yellow

$transactionTypesPath = "$projectRoot\backend\src\types\transaction.types.ts"
if (Test-Path $transactionTypesPath) {
    $content = Get-Content $transactionTypesPath -Raw
    
    # Remove chama transaction types from enum
    $content = $content -replace "\s+CHAMA_CONTRIBUTION = 'CHAMA_CONTRIBUTION',\r?\n", ""
    $content = $content -replace "\s+CHAMA_PAYOUT = 'CHAMA_PAYOUT',\r?\n", ""
    
    # Remove chama transaction type metadata
    $content = $content -replace "\s+\[TransactionType\.CHAMA_CONTRIBUTION\]: \{[^}]+\},\r?\n", ""
    $content = $content -replace "\s+\[TransactionType\.CHAMA_PAYOUT\]: \{[^}]+\},\r?\n", ""
    
    Set-Content $transactionTypesPath -Value $content -NoNewline
    Write-Host "  ✅ transaction.types.ts updated" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  transaction.types.ts not found" -ForegroundColor Yellow
}

Write-Host ""

# ==========================================
# 9. VERIFY CLEANUP
# ==========================================
Write-Host "🔍 Step 9: Verifying cleanup..." -ForegroundColor Yellow

Write-Host "  Searching for remaining 'chama' references in backend..."
$chamaRefsBackend = Select-String -Path "$projectRoot\backend\src\**\*.ts" -Pattern "chama|Chama" -ErrorAction SilentlyContinue | Measure-Object
Write-Host "  Found: $($chamaRefsBackend.Count) references" -ForegroundColor $(if ($chamaRefsBackend.Count -gt 20) { "Yellow" } else { "Green" })

Write-Host "  Searching for remaining 'chama' references in frontend..."
$chamaRefsFrontend = Select-String -Path "$projectRoot\composeApp\src\**\*.kt" -Pattern "chama|Chama" -ErrorAction SilentlyContinue | Measure-Object
Write-Host "  Found: $($chamaRefsFrontend.Count) references" -ForegroundColor $(if ($chamaRefsFrontend.Count -gt 0) { "Red" } else { "Green" })

Write-Host ""

# ==========================================
# 10. SUMMARY
# ==========================================
Write-Host "📊 Cleanup Summary:" -ForegroundColor Cyan
Write-Host "  Backend files deleted: $deletedBackend" -ForegroundColor White
Write-Host "  Frontend directories deleted: $deletedFrontend" -ForegroundColor White
Write-Host "  Documentation deleted: $deletedDocs" -ForegroundColor White
Write-Host "  Code files updated: 4 (index.ts, security.ts, cloudinary.ts, transaction.types.ts)" -ForegroundColor White
Write-Host ""

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""

# ==========================================
# NEXT STEPS
# ==========================================
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Run database migration: 'cd backend && npx tsx prisma/migrations/remove_chama_and_reviews.sql'" -ForegroundColor White
Write-Host "  2. Update Prisma schema: Remove Chama and review models" -ForegroundColor White
Write-Host "  3. Regenerate Prisma client: 'npx prisma generate'" -ForegroundColor White
Write-Host "  4. Build backend: 'npm run build'" -ForegroundColor White
Write-Host "  5. Build frontend: './gradlew clean build'" -ForegroundColor White
Write-Host "  6. Test thoroughly" -ForegroundColor White
Write-Host "  7. Commit changes: 'git add . && git commit -m \"chore: remove Chama and Shop reviews for MVP\"'" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANT: Review all changes before committing!" -ForegroundColor Yellow
Write-Host ""
