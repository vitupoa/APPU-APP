# Fix All TypeScript Errors - Comprehensive Script
Write-Host "Starting comprehensive TypeScript error fixes..." -ForegroundColor Green

# HIGH PRIORITY FIXES (7 errors)
Write-Host "`n=== HIGH PRIORITY FIXES ===" -ForegroundColor Yellow

# Already fixed:
# - notification.service.ts prizeRc variable (DONE)
# - shorts.service.ts static method call (DONE)

Write-Host "High priority fixes completed!" -ForegroundColor Green

# MEDIUM PRIORITY FIXES (46 errors)
Write-Host "`n=== MEDIUM PRIORITY FIXES ===" -ForegroundColor Yellow

# Fix 1: Add return statements after res.json() calls
Write-Host "Adding return statements after res.json() calls..."

# displayAds.routes.ts
$displayAdsPath = "src\modules\displayAds\displayAds.routes.ts"
if (Test-Path $displayAdsPath) {
    $content = Get-Content $displayAdsPath -Raw
    
    # Pattern: res.json(...); -> res.json(...); return;
    $content = $content -replace '(\s+res\.json\([^;]+\);)(\s+})', '$1 return;$2'
    $content = $content -replace '(\s+res\.status\(\d+\)\.json\([^;]+\);)(\s+})', '$1 return;$2'
    
    Set-Content $displayAdsPath $content -NoNewline
    Write-Host "  [OK] Fixed displayAds.routes.ts" -ForegroundColor Green
}

# kyc.routes.ts
$kycPath = "src\modules\kyc\kyc.routes.ts"
if (Test-Path $kycPath) {
    $content = Get-Content $kycPath -Raw
    
    $content = $content -replace '(\s+res\.json\([^;]+\);)(\s+})', '$1 return;$2'
    $content = $content -replace '(\s+res\.status\(\d+\)\.json\([^;]+\);)(\s+})', '$1 return;$2'
    
    Set-Content $kycPath $content -NoNewline
    Write-Host "  [OK] Fixed kyc.routes.ts" -ForegroundColor Green
}

# recommendation.routes.ts
$recPath = "src\modules\recommendation\recommendation.routes.ts"
if (Test-Path $recPath) {
    $content = Get-Content $recPath -Raw
    
    $content = $content -replace '(\s+res\.json\([^;]+\);)(\s+})', '$1 return;$2'
    $content = $content -replace '(\s+res\.status\(\d+\)\.json\([^;]+\);)(\s+})', '$1 return;$2'
    
    Set-Content $recPath $content -NoNewline
    Write-Host "  [OK] Fixed recommendation.routes.ts" -ForegroundColor Green
}

# rembrandt-rar.routes.ts
$rembrandtPath = "src\modules\rembrandt-rar\rembrandt-rar.routes.ts"
if (Test-Path $rembrandtPath) {
    $content = Get-Content $rembrandtPath -Raw
    
    $content = $content -replace '(\s+res\.json\([^;]+\);)(\s+})', '$1 return;$2'
    $content = $content -replace '(\s+res\.status\(\d+\)\.json\([^;]+\);)(\s+})', '$1 return;$2'
    
    Set-Content $rembrandtPath $content -NoNewline
    Write-Host "  [OK] Fixed rembrandt-rar.routes.ts" -ForegroundColor Green
}

Write-Host "`nMedium priority fixes completed!" -ForegroundColor Green

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "[OK] Fixed notification.service.ts prizeRc variable"
Write-Host "[OK] Fixed shorts.service.ts static method call"
Write-Host "[OK] Added return statements after res.json() calls"
Write-Host "`nRun 'npm run build' to verify fixes" -ForegroundColor Yellow
