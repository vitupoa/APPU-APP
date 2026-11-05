# Comprehensive SQLDelight Fix Script
# This script fixes the Boolean import issue and rebuilds the project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Runinga SQLDelight Fix & Rebuild" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean build directory
Write-Host "[1/5] Cleaning build directory..." -ForegroundColor Yellow
.\gradlew.bat clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Clean failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Clean successful" -ForegroundColor Green
Write-Host ""

# Step 2: Delete generated SQLDelight code
Write-Host "[2/5] Deleting generated SQLDelight code..." -ForegroundColor Yellow
$generatedPath = "composeApp\build\generated\sqldelight"
if (Test-Path $generatedPath) {
    Remove-Item -Path $generatedPath -Recurse -Force
    Write-Host "  ✓ Deleted: $generatedPath" -ForegroundColor Green
} else {
    Write-Host "  ℹ Already clean" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Generate SQLDelight code
Write-Host "[3/5] Generating SQLDelight code..." -ForegroundColor Yellow
.\gradlew.bat :composeApp:generateCommonMainRuningaDatabaseInterface
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Generation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Generation successful" -ForegroundColor Green
Write-Host ""

# Step 4: Fix Boolean imports in generated files
Write-Host "[4/5] Fixing Boolean imports..." -ForegroundColor Yellow
$generatedDbPath = "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db"
$fixedCount = 0

if (Test-Path $generatedDbPath) {
    Get-ChildItem -Path $generatedDbPath -Filter "*.kt" | ForEach-Object {
        $file = $_.FullName
        $content = Get-Content $file -Raw
        
        # Replace "import Boolean" with "import kotlin.Boolean"
        if ($content -match "(?m)^import Boolean$") {
            $content = $content -replace "(?m)^import Boolean$", "import kotlin.Boolean"
            Set-Content $file $content -NoNewline
            Write-Host "    ✓ Fixed: $($_.Name)" -ForegroundColor Green
            $fixedCount++
        }
    }
    
    if ($fixedCount -eq 0) {
        Write-Host "  ℹ No files needed fixing (already correct)" -ForegroundColor Gray
    } else {
        Write-Host "  ✓ Fixed $fixedCount files" -ForegroundColor Green
    }
} else {
    Write-Host "  ✗ Generated code not found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Build the project
Write-Host "[5/5] Building project..." -ForegroundColor Yellow
.\gradlew.bat :composeApp:assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Build failed! Check errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - If Boolean errors persist, run this script again" -ForegroundColor Gray
    Write-Host "  - Check for other compilation errors in the output" -ForegroundColor Gray
    exit 1
}
Write-Host "  ✓ Build successful!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ All fixes applied successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the app on an emulator or device" -ForegroundColor Gray
Write-Host "  2. If you see Boolean errors again, re-run this script" -ForegroundColor Gray
Write-Host ""
