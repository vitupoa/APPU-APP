# Comprehensive fix for all compilation errors

Write-Host "Fixing ALL compilation errors..." -ForegroundColor Green

# 1. Add Material Icons imports to ALL Screen files that are missing them
Write-Host "`n1. Adding Material Icons imports..." -ForegroundColor Yellow
$screenFiles = Get-ChildItem -Path "composeApp\src\commonMain\kotlin" -Recurse -Filter "*Screen.kt"
foreach ($file in $screenFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -notmatch "import androidx\.compose\.material\.icons\.Icons") {
        $content = $content -replace "(package .+?\n)", "`$1import androidx.compose.material.icons.Icons`nimport androidx.compose.material.icons.filled.*`n"
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Added to: $($file.Name)"
    }
}

# 2. Add Material Icons to component files
$componentFiles = @(
    "composeApp\src\commonMain\kotlin\com\runinga\feature\feed\presentation\components\ImmersivePlayerNew.kt"
)
foreach ($file in $componentFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -notmatch "import androidx\.compose\.material\.icons\.Icons") {
            $content = $content -replace "(package .+?\n)", "`$1import androidx.compose.material.icons.Icons`nimport androidx.compose.material.icons.filled.*`n"
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "  Added to: $(Split-Path $file -Leaf)"
        }
    }
}

# 3. Fix all SafeConversion conflicts - remove duplicate imports
Write-Host "`n2. Fixing SafeConversion conflicts..." -ForegroundColor Yellow
$safeConversionFiles = Get-ChildItem -Path "composeApp\src\commonMain\kotlin" -Recurse -Filter "*.kt" | Where-Object {
    (Get-Content $_.FullName -Raw) -match "Conflicting import.*SafeConversion"
}
foreach ($file in $safeConversionFiles) {
    $content = Get-Content $file.FullName -Raw
    # Remove all SafeConversion imports
    $content = $content -replace "import com\.runinga\.com\.core\.util\.SafeConversion\.[^\n]+\n", ""
    # Add single correct import if not present
    if ($content -notmatch "import com\.runinga\.com\.core\.util\.SafeConversion$") {
        $content = $content -replace "(package .+?\n)", "`$1import com.runinga.com.core.util.SafeConversion`n"
    }
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "  Fixed: $($file.Name)"
}

# 4. Fix BorderStroke conflicts
Write-Host "`n3. Fixing BorderStroke conflicts..." -ForegroundColor Yellow
$borderFiles = @(
    "composeApp\src\commonMain\kotlin\com\runinga\feature\chama\presentation\wizard\CreateChamaScreen.kt",
    "composeApp\src\commonMain\kotlin\com\runinga\feature\contests\presentation\screen\CreateContestScreen.kt",
    "composeApp\src\commonMain\kotlin\com\runinga\feature\profile\presentation\screen\ProfileScreen.kt",
    "composeApp\src\commonMain\kotlin\com\runinga\feature\wallet\presentation\screen\TopupScreen.kt",
    "composeApp\src\commonMain\kotlin\com\runinga\feature\wallet\presentation\screen\WithdrawScreen.kt"
)
foreach ($file in $borderFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        # Remove foundation BorderStroke import
        $content = $content -replace "import androidx\.compose\.foundation\.BorderStroke\n", ""
        # Add Material3 BorderStroke and Foundation alias
        if ($content -notmatch "import androidx\.compose\.material3\.BorderStroke") {
            $content = $content -replace "(package .+?\n)", "`$1import androidx.compose.material3.BorderStroke`nimport androidx.compose.foundation.BorderStroke as FoundationBorderStroke`n"
        }
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "  Fixed: $(Split-Path $file -Leaf)"
    }
}

# 5. Fix FoundationBorderStroke references in wizard files
Write-Host "`n4. Fixing FoundationBorderStroke references..." -ForegroundColor Yellow
$foundationFiles = Get-ChildItem -Path "composeApp\src\commonMain\kotlin" -Recurse -Filter "*.kt" | Where-Object {
    (Get-Content $_.FullName -Raw) -match "FoundationBorderStroke"
}
foreach ($file in $foundationFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -notmatch "import androidx\.compose\.foundation\.BorderStroke as FoundationBorderStroke") {
        $content = $content -replace "(package .+?\n)", "`$1import androidx.compose.foundation.BorderStroke as FoundationBorderStroke`n"
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed: $($file.Name)"
    }
}

# 6. Fix icon references
Write-Host "`n5. Fixing icon references..." -ForegroundColor Yellow
$iconFiles = Get-ChildItem -Path "composeApp\src\commonMain\kotlin" -Recurse -Filter "*.kt"
foreach ($file in $iconFiles) {
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    if ($content -match "Icons\.Filled\.PhotoAlternate") {
        $content = $content -replace "Icons\.Filled\.PhotoAlternate", "Icons.Filled.Photo"
        $modified = $true
    }
    if ($content -match "Icons\.Filled\.Border[^O]") {
        $content = $content -replace "Icons\.Filled\.Border", "Icons.Filled.BorderOuter"
        $modified = $true
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed icons in: $($file.Name)"
    }
}

# 7. Fix resource icon references (ic_refresh, ic_tiktok, etc.)
Write-Host "`n6. Fixing resource icon references..." -ForegroundColor Yellow
$resourceIconFiles = Get-ChildItem -Path "composeApp\src\commonMain\kotlin" -Recurse -Filter "*.kt" | Where-Object {
    $c = Get-Content $_.FullName -Raw
    $c -match "ic_refresh|ic_tiktok|ic_instagram|ic_youtube"
}
foreach ($file in $resourceIconFiles) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace "painterResource\(Res\.drawable\.ic_refresh\)", "Icons.Filled.Refresh"
    $content = $content -replace "painterResource\(Res\.drawable\.ic_tiktok\)", "Icons.Filled.MusicNote"
    $content = $content -replace "painterResource\(Res\.drawable\.ic_instagram\)", "Icons.Filled.PhotoCamera"
    $content = $content -replace "painterResource\(Res\.drawable\.ic_youtube\)", "Icons.Filled.PlayArrow"
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "  Fixed: $($file.Name)"
}

Write-Host "`nAll fixes applied!" -ForegroundColor Green
