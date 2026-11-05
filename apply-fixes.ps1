Write-Host "=== RUNINGA BUILD FIX SCRIPT ===" -ForegroundColor Cyan
Write-Host ""

# Fix 1: SQLDelight Boolean imports
Write-Host "1. Fixing SQLDelight Boolean imports..." -ForegroundColor Yellow
$fixed = 0
Get-ChildItem -Path "composeApp\build\generated\sqldelight" -Filter "*.kt" -Recurse | Where-Object { $_.FullName -match "commonMain" } | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match 'import Boolean') {
        $content = $content -replace 'import Boolean', 'import kotlin.Boolean'
        Set-Content $_.FullName $content -NoNewline
        $fixed++
    }
}
Write-Host "   Fixed $fixed files" -ForegroundColor Green

Write-Host ""
Write-Host "=== FIXES APPLIED ===" -ForegroundColor Green
Write-Host ""
Write-Host "Run: gradlew.bat :composeApp:assembleDebug" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Run this script after 'gradlew clean' to fix regenerated files" -ForegroundColor Yellow
