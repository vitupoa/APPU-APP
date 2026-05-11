# Quick Fix: Patch existing SQLDelight generated files

Write-Host "Fixing SQLDelight Boolean imports..." -ForegroundColor Cyan

$generatedDbPath = "composeApp\build\generated\sqldelight\code\KrietaDatabase\commonMain\com\krieta\db"

if (-not (Test-Path $generatedDbPath)) {
    Write-Host "Generated code not found" -ForegroundColor Red
    exit 1
}

$fixedCount = 0
$files = Get-ChildItem -Path $generatedDbPath -Filter "*.kt"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match "(?m)^import Boolean$") {
        $newContent = $content -replace "(?m)^import Boolean$", "import kotlin.Boolean"
        Set-Content $file.FullName $newContent -NoNewline
        Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
        $fixedCount++
    }
}

if ($fixedCount -eq 0) {
    Write-Host "No files needed fixing" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "Fixed $fixedCount files" -ForegroundColor Green
    Write-Host "Now run: gradlew.bat :composeApp:assembleDebug" -ForegroundColor Yellow
}
