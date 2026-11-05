# Fix SQLDelight Boolean import issue
# This script fixes the "import Boolean" to "import kotlin.Boolean" in generated files

$generatedPath = "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db"

Write-Host "Fixing SQLDelight Boolean imports..." -ForegroundColor Cyan

Get-ChildItem -Path $generatedPath -Filter "*.kt" | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file -Raw
    
    # Replace "import Boolean" with "import kotlin.Boolean"
    if ($content -match "^import Boolean$") {
        $content = $content -replace "^import Boolean$", "import kotlin.Boolean"
        Set-Content $file $content -NoNewline
        Write-Host "  ✓ Fixed: $($_.Name)" -ForegroundColor Green
    }
}

Write-Host "`nDone! Now run: .\gradlew.bat :composeApp:assembleDebug" -ForegroundColor Yellow
