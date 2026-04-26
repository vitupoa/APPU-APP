# Quick Icon Migration Reference

## Common Patterns

### Pattern 1: Simple Icon
```kotlin
// OLD
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
Icon(Icons.Filled.Home, "Home")

// NEW
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.ic_home
Icon(painterResource(Res.drawable.ic_home), "Home")
```

### Pattern 2: Tab Icon
```kotlin
// OLD
val icon = rememberVectorPainter(Icons.Default.Home)

// NEW
val icon = painterResource(Res.drawable.ic_home)
```

### Pattern 3: IconButton
```kotlin
// OLD
IconButton(onClick = { }) {
    Icon(Icons.Default.Close, "Close")
}

// NEW
IconButton(onClick = { }) {
    Icon(painterResource(Res.drawable.ic_close), "Close")
}
```

## Top 50 Most Common Icons

| Old Import | New Resource | Download Name |
|-----------|--------------|---------------|
| Icons.Default.Home | Res.drawable.ic_home | home |
| Icons.Default.Search | Res.drawable.ic_search | search |
| Icons.Default.Person | Res.drawable.ic_person | person |
| Icons.Default.Settings | Res.drawable.ic_settings | settings |
| Icons.Default.Favorite | Res.drawable.ic_favorite | favorite |
| Icons.Default.Add | Res.drawable.ic_add | add |
| Icons.Default.Close | Res.drawable.ic_close | close |
| Icons.Default.Delete | Res.drawable.ic_delete | delete |
| Icons.Default.Edit | Res.drawable.ic_edit | edit |
| Icons.Default.Check | Res.drawable.ic_check | check |
| Icons.Default.MoreVert | Res.drawable.ic_more_vert | more_vert |
| Icons.Default.Share | Res.drawable.ic_share | share |
| Icons.Default.Send | Res.drawable.ic_send | send |
| Icons.Default.Campaign | Res.drawable.ic_campaign | campaign |
| Icons.Default.ChevronRight | Res.drawable.ic_chevron_right | chevron_right |
| Icons.Default.ChevronLeft | Res.drawable.ic_chevron_left | chevron_left |
| Icons.Default.ExpandMore | Res.drawable.ic_expand_more | expand_more |
| Icons.Default.ExpandLess | Res.drawable.ic_expand_less | expand_less |
| Icons.Default.Notifications | Res.drawable.ic_notifications | notifications |
| Icons.Default.Email | Res.drawable.ic_email | email |
| Icons.Default.Phone | Res.drawable.ic_phone | phone |
| Icons.Default.LocationOn | Res.drawable.ic_location_on | location_on |
| Icons.Default.DateRange | Res.drawable.ic_date_range | date_range |
| Icons.Default.AccessTime | Res.drawable.ic_access_time | access_time |
| Icons.Default.AttachMoney | Res.drawable.ic_attach_money | attach_money |
| Icons.Default.ShoppingCart | Res.drawable.ic_shopping_cart | shopping_cart |
| Icons.Default.Store | Res.drawable.ic_store | store |
| Icons.Default.Visibility | Res.drawable.ic_visibility | visibility |
| Icons.Default.VisibilityOff | Res.drawable.ic_visibility_off | visibility_off |
| Icons.Default.ThumbUp | Res.drawable.ic_thumb_up | thumb_up |
| Icons.Default.Comment | Res.drawable.ic_comment | comment |
| Icons.Default.Image | Res.drawable.ic_image | image |
| Icons.Default.VideoLibrary | Res.drawable.ic_video_library | video_library |
| Icons.Default.Camera | Res.drawable.ic_camera | camera |
| Icons.Default.Mic | Res.drawable.ic_mic | mic |
| Icons.Default.PlayArrow | Res.drawable.ic_play_arrow | play_arrow |
| Icons.Default.Pause | Res.drawable.ic_pause | pause |
| Icons.Default.Stop | Res.drawable.ic_stop | stop |
| Icons.Default.VolumeUp | Res.drawable.ic_volume_up | volume_up |
| Icons.Default.VolumeOff | Res.drawable.ic_volume_off | volume_off |
| Icons.Default.Refresh | Res.drawable.ic_refresh | refresh |
| Icons.Default.Download | Res.drawable.ic_download | download |
| Icons.Default.Upload | Res.drawable.ic_upload | upload |
| Icons.Default.CloudUpload | Res.drawable.ic_cloud_upload | cloud_upload |
| Icons.Default.CloudDownload | Res.drawable.ic_cloud_download | cloud_download |
| Icons.Default.Info | Res.drawable.ic_info | info |
| Icons.Default.Warning | Res.drawable.ic_warning | warning |
| Icons.Default.Error | Res.drawable.ic_error | error |
| Icons.Default.CheckCircle | Res.drawable.ic_check_circle | check_circle |
| Icons.Default.Cancel | Res.drawable.ic_cancel | cancel |

## AutoMirrored Icons (RTL Support)

| Old Import | New Resource |
|-----------|--------------|
| Icons.AutoMirrored.Filled.ArrowBack | Res.drawable.ic_arrow_back |
| Icons.AutoMirrored.Filled.ArrowForward | Res.drawable.ic_arrow_forward |
| Icons.AutoMirrored.Filled.List | Res.drawable.ic_list |
| Icons.AutoMirrored.Filled.Send | Res.drawable.ic_send |

## Outlined Icons

| Old Import | New Resource |
|-----------|--------------|
| Icons.Outlined.Home | Res.drawable.ic_home_outlined |
| Icons.Outlined.Person | Res.drawable.ic_person_outlined |
| Icons.Outlined.Settings | Res.drawable.ic_settings_outlined |
| Icons.Outlined.Favorite | Res.drawable.ic_favorite_outlined |

## Import Blocks to Replace

### Old Import Block
```kotlin
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material.icons.automirrored.filled.*
```

### New Import Block
```kotlin
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.* // Or import specific icons
```

## Download Instructions

1. Go to https://fonts.google.com/icons
2. Search for icon name (e.g., "home")
3. Select the icon
4. Click "Download" (SVG format)
5. Rename to `ic_[name].xml` (e.g., `ic_home.xml`)
6. Place in: `composeApp/src/commonMain/composeResources/drawable/`

## Batch Download Script (PowerShell)

```powershell
# Create drawable directory if it doesn't exist
$drawableDir = "composeApp\src\commonMain\composeResources\drawable"
New-Item -ItemType Directory -Force -Path $drawableDir

# List of icons to download (add more as needed)
$icons = @(
    "home", "search", "person", "settings", "favorite",
    "add", "close", "delete", "edit", "check",
    "more_vert", "share", "send", "campaign", "chevron_right"
)

Write-Host "Download these icons from https://fonts.google.com/icons:"
foreach ($icon in $icons) {
    Write-Host "  - $icon → ic_$icon.xml"
}
```

## Testing After Migration

```kotlin
// Test icon displays correctly
@Preview
@Composable
fun IconTest() {
    Column {
        Icon(painterResource(Res.drawable.ic_home), "Home")
        Icon(painterResource(Res.drawable.ic_search), "Search")
        Icon(painterResource(Res.drawable.ic_person), "Person")
    }
}
```

## Troubleshooting

### Issue: Icon not found
**Solution**: Ensure the icon file is in the correct directory and rebuild the project

### Issue: Icon appears too small/large
**Solution**: Add `modifier = Modifier.size(24.dp)` to match Material Icons size

### Issue: Icon color not matching theme
**Solution**: Add `tint = MaterialTheme.colorScheme.primary` parameter

## Migration Checklist Per File

- [ ] Replace import statements
- [ ] Update all Icon() calls
- [ ] Update all IconButton() calls
- [ ] Update Tab icons
- [ ] Test screen renders correctly
- [ ] Verify icon sizes
- [ ] Verify icon colors
- [ ] Test on both light and dark themes
