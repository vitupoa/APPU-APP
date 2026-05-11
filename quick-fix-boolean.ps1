# Quick Fix: Patch existing SQLDelight generated files
# Run this if you just want to fix the Boolean import without full rebuild

Write-Host "Fixing SQLDelight Boolean imports..." -ForegroundColor Cyan

$generatedDbPath = "composeApp\build\generated\sqldelight\code\KrietaDatabase\commonMain\com\krieta\db"

if (-not (Test-Path $generatedDbPath)) {
    Write-Host "✗ Generated code not found at: $generatedDbPath" -ForegroundColor Red
    Write-Host "  Run: .\gradlew.bat :composeApp:generateCommonMainKrietaDatabaseInterface" -ForegroundColor Yellow
    exit 1
}

$fixedCount = 0
$files = Get-ChildItem -Path $generatedDbPath -Filter "*.kt"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file has the incorrect import
    if ($content -match "(?m)^import Boolean$") {
        # Replace with correct import
        $newContent = $content -replace "(?m)^import Boolean$", "import kotlin.Boolean"
        Set-Content $file.FullName $newContent -NoNewline
        Write-Host "✓ Fixed: $($file.Name)" -ForegroundColor Green
        $fixedCount++
    }
}

if ($fixedCount -eq 0) {
    Write-Host "ℹ No files needed fixing" -ForegroundColor Gray
} else {
    Write-Host "`n✓ Fixed $fixedCount files" -ForegroundColor Green
    Write-Host "`nNow run: .\gradlew.bat :composeApp:assembleDebug" -ForegroundColor Yellow
}
