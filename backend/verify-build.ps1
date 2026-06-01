# TypeScript Build Fix Verification Script
# Run this to verify all fixes are applied correctly

Write-Host "=== TypeScript Build Fix Verification ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check if queryParams exports exist
Write-Host "1. Checking queryParams.ts exports..." -ForegroundColor Yellow
$queryParamsContent = Get-Content "src\utils\queryParams.ts" -Raw
if ($queryParamsContent -match "export const getQueryString" -and 
    $queryParamsContent -match "export const getQueryDate" -and 
    $queryParamsContent -match "export const getQueryNumber") {
    Write-Host "   ✓ Query parameter aliases found" -ForegroundColor Green
} else {
    Write-Host "   ✗ Query parameter aliases missing" -ForegroundColor Red
}

# 2. Check compliance types
Write-Host "2. Checking compliance.types.ts..." -ForegroundColor Yellow
$complianceTypesContent = Get-Content "src\types\compliance.types.ts" -Raw
if ($complianceTypesContent -match "exclusiveInteractions" -and 
    $complianceTypesContent -match "totalInteractions") {
    Write-Host "   ✓ RiskAnalysisResult interface fixed" -ForegroundColor Green
} else {
    Write-Host "   ✗ RiskAnalysisResult interface needs fixing" -ForegroundColor Red
}

# 3. Check express.d.ts exists
Write-Host "3. Checking express.d.ts..." -ForegroundColor Yellow
if (Test-Path "src\types\express.d.ts") {
    Write-Host "   ✓ Express type definitions found" -ForegroundColor Green
} else {
    Write-Host "   ✗ Express type definitions missing" -ForegroundColor Red
}

# 4. Check admin middleware
Write-Host "4. Checking admin.ts..." -ForegroundColor Yellow
$adminContent = Get-Content "src\middleware\admin.ts" -Raw
if ($adminContent -match "user\.is_admin") {
    Write-Host "   ✓ Admin middleware uses correct field name" -ForegroundColor Green
} else {
    Write-Host "   ✗ Admin middleware needs fixing" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Running TypeScript Compiler ===" -ForegroundColor Cyan
Write-Host ""

# Try to compile
npm run build

Write-Host ""
Write-Host "=== Build Complete ===" -ForegroundColor Cyan
