# Automated Icon Migration Script
# This script replaces Material Icons Extended with Material Symbols across all Kotlin files

Write-Host "=== Material Icons Migration Script ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "c:\Users\ADMIN\Krieta\composeApp\src\commonMain\kotlin"
$filesProcessed = 0
$totalReplacements = 0

# Define replacement mappings
$iconReplacements = @{
    "Icons.Default.Home" = "painterResource(Res.drawable.ic_home)"
    "Icons.Default.Search" = "painterResource(Res.drawable.ic_search)"
    "Icons.Default.Person" = "painterResource(Res.drawable.ic_person)"
    "Icons.Default.Settings" = "painterResource(Res.drawable.ic_settings)"
    "Icons.Default.Favorite" = "painterResource(Res.drawable.ic_favorite)"
    "Icons.Default.Add" = "painterResource(Res.drawable.ic_add)"
    "Icons.Default.Close" = "painterResource(Res.drawable.ic_close)"
    "Icons.Default.Delete" = "painterResource(Res.drawable.ic_delete)"
    "Icons.Default.Edit" = "painterResource(Res.drawable.ic_edit)"
    "Icons.Default.Check" = "painterResource(Res.drawable.ic_check)"
    "Icons.Default.MoreVert" = "painterResource(Res.drawable.ic_more_vert)"
    "Icons.Default.Share" = "painterResource(Res.drawable.ic_share)"
    "Icons.Default.Send" = "painterResource(Res.drawable.ic_send)"
    "Icons.Default.Campaign" = "painterResource(Res.drawable.ic_campaign)"
    "Icons.Default.ChevronRight" = "painterResource(Res.drawable.ic_chevron_right)"
    "Icons.Default.AttachMoney" = "painterResource(Res.drawable.ic_attach_money)"
    "Icons.Default.Visibility" = "painterResource(Res.drawable.ic_visibility)"
    "Icons.Default.VisibilityOff" = "painterResource(Res.drawable.ic_visibility_off)"
    "Icons.Default.Image" = "painterResource(Res.drawable.ic_image)"
    "Icons.Default.Notifications" = "painterResource(Res.drawable.ic_notifications)"
    "Icons.Default.Menu" = "painterResource(Res.drawable.ic_menu)"
    "Icons.Default.Videocam" = "painterResource(Res.drawable.ic_videocam)"
    "Icons.Default.Lock" = "painterResource(Res.drawable.ic_lock)"
    "Icons.AutoMirrored.Filled.ArrowBack" = "painterResource(Res.drawable.ic_arrow_back)"
    "Icons.Filled.ArrowBack" = "painterResource(Res.drawable.ic_arrow_back)"
    "rememberVectorPainter(Icons.Default.Home)" = "painterResource(Res.drawable.ic_home)"
    "rememberVectorPainter(Icons.Default.Search)" = "painterResource(Res.drawable.ic_search)"
    "rememberVectorPainter(Icons.Default.Person)" = "painterResource(Res.drawable.ic_person)"
    "rememberVectorPainter(Icons.Default.Favorite)" = "painterResource(Res.drawable.ic_favorite)"
    "rememberVectorPainter(Icons.Default.Campaign)" = "painterResource(Res.drawable.ic_campaign)"
}

# Import statements to replace
$oldImports = @(
    "import androidx.compose.material.icons.Icons",
    "import androidx.compose.material.icons.filled.*",
    "import androidx.compose.material.icons.outlined.*",
    "import androidx.compose.material.icons.automirrored.filled.*",
    "import androidx.compose.material.icons.automirrored.filled.ArrowBack",
    "import androidx.compose.ui.graphics.vector.rememberVectorPainter"
)

$newImports = @"
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
"@

Write-Host "Scanning for files with Material Icons..." -ForegroundColor Yellow

# Find all Kotlin files with Material Icons imports
$files = Get-ChildItem -Path $projectRoot -Filter "*.kt" -Recurse | 
    Where-Object { (Select-String -Path $_.FullName -Pattern "androidx.compose.material.icons" -Quiet) }

Write-Host "Found $($files.Count) files to process" -ForegroundColor Green
Write-Host ""

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace($projectRoot, "").TrimStart('\')
    Write-Host "Processing: $relativePath" -ForegroundColor Cyan
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileReplacements = 0
    
    # Remove old imports
    foreach ($oldImport in $oldImports) {
        if ($content -match [regex]::Escape($oldImport)) {
            $content = $content -replace [regex]::Escape($oldImport), ""
            $fileReplacements++
        }
    }
    
    # Add new imports if not already present
    if ($content -notmatch "import org.jetbrains.compose.resources.painterResource") {
        # Find the package declaration and add imports after it
        $content = $content -replace "(package\s+[\w.]+\s*\n)", "`$1`n$newImports`n"
    }
    
    # Replace icon usages
    foreach ($key in $iconReplacements.Keys) {
        $escapedKey = [regex]::Escape($key)
        if ($content -match $escapedKey) {
            $content = $content -replace $escapedKey, $iconReplacements[$key]
            $fileReplacements++
        }
    }
    
    # Clean up multiple blank lines
    $content = $content -replace "(\r?\n){3,}", "`n`n"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesProcessed++
        $totalReplacements += $fileReplacements
        Write-Host "  Updated ($fileReplacements replacements)" -ForegroundColor Green
    } else {
        Write-Host "  - No changes needed" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Cyan
Write-Host "Files processed: $filesProcessed" -ForegroundColor Green
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Build the project to generate resources"
Write-Host "2. Fix any remaining icon references manually"
Write-Host "3. Test all screens"
Write-Host ""
