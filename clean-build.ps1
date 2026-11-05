# Clean, fix, and build script
Write-Host "Starting clean build with fixes..." -ForegroundColor Cyan

# Step 1: Clean build
Write-Host "`n1. Cleaning build..." -ForegroundColor Yellow
& gradlew.bat clean

# Step 2: Generate SQLDelight files
Write-Host "`n2. Generating SQLDelight code..." -ForegroundColor Yellow
& gradlew.bat generateCommonMainRuningaDatabaseInterface

# Step 3: Fix Boolean imports in generated files
Write-Host "`n3. Fixing SQLDelight Boolean imports..." -ForegroundColor Yellow
$sqlFiles = Get-ChildItem -Path "composeApp\build\generated\sqldelight" -Filter "*.kt" -Recurse | Where-Object { $_.FullName -match "commonMain" }

foreach ($file in $sqlFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match '\nimport Boolean\n') {
        $content = $content -replace '\nimport Boolean\n', "`nimport kotlin.Boolean`n"
        Set-Content $file.FullName $content -NoNewline
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
    }
}

# Step 4: Build
Write-Host "`n4. Building project..." -ForegroundColor Yellow
& gradlew.bat :composeApp:assembleDebug

Write-Host "`nBuild complete!" -ForegroundColor Green
