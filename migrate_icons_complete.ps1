# Material Icons Migration Script
# This script automatically replaces Material Icons imports with painterResource

$rootPath = "c:\Users\ADMIN\Krieta\composeApp\src\commonMain\kotlin"

# Icon mapping: Material Icons -> Drawable Resource
$iconMap = @{
    "Icons.Default.Lock" = "Res.drawable.ic_lock"
    "Icons.Filled.Lock" = "Res.drawable.ic_lock"
    "Icons.Default.Search" = "Res.drawable.ic_search"
    "Icons.Filled.Search" = "Res.drawable.ic_search"
    "Icons.Default.Warning" = "Res.drawable.ic_warning"
    "Icons.Filled.Warning" = "Res.drawable.ic_warning"
    "Icons.Default.Close" = "Res.drawable.ic_close"
    "Icons.Filled.Close" = "Res.drawable.ic_close"
    "Icons.Default.TrendingUp" = "Res.drawable.ic_trending_up"
    "Icons.Filled.TrendingUp" = "Res.drawable.ic_trending_up"
    "Icons.AutoMirrored.Filled.TrendingUp" = "Res.drawable.ic_trending_up"
    "Icons.Default.Visibility" = "Res.drawable.ic_visibility"
    "Icons.Filled.Visibility" = "Res.drawable.ic_visibility"
    "Icons.Default.Favorite" = "Res.drawable.ic_favorite"
    "Icons.Filled.Favorite" = "Res.drawable.ic_favorite"
    "Icons.Default.PersonAdd" = "Res.drawable.ic_person_add"
    "Icons.Filled.PersonAdd" = "Res.drawable.ic_person_add"
    "Icons.Default.CallEnd" = "Res.drawable.ic_call_end"
    "Icons.Filled.CallEnd" = "Res.drawable.ic_call_end"
    "Icons.Default.Mic" = "Res.drawable.ic_mic"
    "Icons.Filled.Mic" = "Res.drawable.ic_mic"
    "Icons.Default.MicOff" = "Res.drawable.ic_mic_off"
    "Icons.Filled.MicOff" = "Res.drawable.ic_mic_off"
    "Icons.Default.Videocam" = "Res.drawable.ic_videocam"
    "Icons.Filled.Videocam" = "Res.drawable.ic_videocam"
    "Icons.Default.VideocamOff" = "Res.drawable.ic_videocam_off"
    "Icons.Filled.VideocamOff" = "Res.drawable.ic_videocam_off"
    "Icons.Default.Check" = "Res.drawable.ic_check"
    "Icons.Filled.Check" = "Res.drawable.ic_check"
    "Icons.Default.LockOpen" = "Res.drawable.ic_lock_open"
    "Icons.Filled.LockOpen" = "Res.drawable.ic_lock_open"
    "Icons.Default.Send" = "Res.drawable.ic_send"
    "Icons.Filled.Send" = "Res.drawable.ic_send"
    "Icons.AutoMirrored.Filled.Send" = "Res.drawable.ic_send"
    "Icons.Default.Add" = "Res.drawable.ic_add"
    "Icons.Filled.Add" = "Res.drawable.ic_add"
    "Icons.Default.CheckCircle" = "Res.drawable.ic_check_circle"
    "Icons.Filled.CheckCircle" = "Res.drawable.ic_check_circle"
    "Icons.Default.AddPhotoAlternate" = "Res.drawable.ic_add_photo"
    "Icons.Filled.AddPhotoAlternate" = "Res.drawable.ic_add_photo"
    "Icons.Default.FavoriteBorder" = "Res.drawable.ic_favorite_border"
    "Icons.Filled.FavoriteBorder" = "Res.drawable.ic_favorite_border"
    "Icons.Default.ModeComment" = "Res.drawable.ic_comment"
    "Icons.Filled.ModeComment" = "Res.drawable.ic_comment"
    "Icons.Default.Pause" = "Res.drawable.ic_pause"
    "Icons.Filled.Pause" = "Res.drawable.ic_pause"
    "Icons.Default.PlayArrow" = "Res.drawable.ic_play_arrow"
    "Icons.Filled.PlayArrow" = "Res.drawable.ic_play_arrow"
    "Icons.Default.ShoppingBag" = "Res.drawable.ic_shopping_bag"
    "Icons.Filled.ShoppingBag" = "Res.drawable.ic_shopping_bag"
    "Icons.Default.List" = "Res.drawable.ic_list"
    "Icons.Filled.List" = "Res.drawable.ic_list"
    "Icons.AutoMirrored.Filled.List" = "Res.drawable.ic_list"
    "Icons.Default.Delete" = "Res.drawable.ic_delete"
    "Icons.Filled.Delete" = "Res.drawable.ic_delete"
    "Icons.Default.Edit" = "Res.drawable.ic_edit"
    "Icons.Filled.Edit" = "Res.drawable.ic_edit"
    "Icons.Default.MoreVert" = "Res.drawable.ic_more_vert"
    "Icons.Filled.MoreVert" = "Res.drawable.ic_more_vert"
    "Icons.Default.PhotoCamera" = "Res.drawable.ic_photo_camera"
    "Icons.Filled.PhotoCamera" = "Res.drawable.ic_photo_camera"
    "Icons.Default.Verified" = "Res.drawable.ic_verified"
    "Icons.Filled.Verified" = "Res.drawable.ic_verified"
    "Icons.Default.Chat" = "Res.drawable.ic_chat"
    "Icons.Filled.Chat" = "Res.drawable.ic_chat"
    "Icons.AutoMirrored.Filled.Chat" = "Res.drawable.ic_chat"
    "Icons.Default.Image" = "Res.drawable.ic_image"
    "Icons.Filled.Image" = "Res.drawable.ic_image"
    "Icons.Default.Backspace" = "Res.drawable.ic_backspace"
    "Icons.Filled.Backspace" = "Res.drawable.ic_backspace"
    "Icons.AutoMirrored.Filled.Backspace" = "Res.drawable.ic_backspace"
    "Icons.Default.ArrowUpward" = "Res.drawable.ic_arrow_upward"
    "Icons.Filled.ArrowUpward" = "Res.drawable.ic_arrow_upward"
    "Icons.Default.ArrowDownward" = "Res.drawable.ic_arrow_downward"
    "Icons.Filled.ArrowDownward" = "Res.drawable.ic_arrow_downward"
    "Icons.Default.VisibilityOff" = "Res.drawable.ic_visibility_off"
    "Icons.Filled.VisibilityOff" = "Res.drawable.ic_visibility_off"
}

# Get all Kotlin files with Material Icons imports
$files = Get-ChildItem -Path $rootPath -Filter "*.kt" -Recurse | 
    Where-Object { (Get-Content $_.FullName -Raw) -match "androidx\.compose\.material\.icons" }

Write-Host "Found $($files.Count) files to migrate" -ForegroundColor Cyan

foreach ($file in $files) {
    Write-Host "`nProcessing: $($file.Name)" -ForegroundColor Yellow
    
    $content = Get-Content $file.FullName -Raw
    $modified = $false
    
    # Remove Material Icons imports
    $patterns = @(
        "import androidx\.compose\.material\.icons\.Icons\s*\n",
        "import androidx\.compose\.material\.icons\.filled\.\w+\s*\n",
        "import androidx\.compose\.material\.icons\.outlined\.\w+\s*\n",
        "import androidx\.compose\.material\.icons\.automirrored\.filled\.\w+\s*\n"
    )
    
    foreach ($pattern in $patterns) {
        if ($content -match $pattern) {
            $content = $content -replace $pattern, ""
            $modified = $true
        }
    }
    
    # Add new imports if not present
    if ($modified -and $content -notmatch "import org\.jetbrains\.compose\.resources\.painterResource") {
        $packageLine = $content -match "(?m)^package .+$"
        if ($packageLine) {
            $insertPoint = $content.IndexOf("`n", $content.IndexOf("package")) + 1
            $newImports = @"

import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.*
"@
            $content = $content.Insert($insertPoint, $newImports)
        }
    }
    
    # Replace Icon usages
    foreach ($oldIcon in $iconMap.Keys) {
        $newIcon = $iconMap[$oldIcon]
        
        # Pattern 1: Icon(Icons.Default.X, ...)
        $escapedOld = [regex]::Escape($oldIcon)
        $content = $content -replace "Icon\s*\(\s*$escapedOld\s*,", "Icon(painterResource($newIcon),"
        
        # Pattern 2: imageVector = Icons.Default.X
        $content = $content -replace "imageVector\s*=\s*$escapedOld", "painter = painterResource($newIcon)"
        
        # Pattern 3: rememberVectorPainter(Icons.Default.X)
        $content = $content -replace "rememberVectorPainter\s*\(\s*$escapedOld\s*\)", "painterResource($newIcon)"
    }
    
    $originalContent = Get-Content $file.FullName -Raw
    if ($modified -or $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Migrated" -ForegroundColor Green
    } else {
        Write-Host "  - No changes needed" -ForegroundColor Gray
    }
}

Write-Host "`n✓ Migration complete!" -ForegroundColor Green
Write-Host "Files processed: $($files.Count)" -ForegroundColor Cyan
