# Icon Resources Directory

This directory contains vector drawable icons for the Krieta app.

## File Naming Convention
- Use lowercase with underscores: `ic_home.xml`, `ic_settings.xml`
- Prefix all icons with `ic_` for consistency
- For outlined variants: `ic_home_outlined.xml`

## Icon Format
All icons should be in Android Vector Drawable XML format:

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FF000000"
        android:pathData="M..."/>
</vector>
```

## How to Add Icons

1. Download SVG from [Material Symbols](https://fonts.google.com/icons)
2. Convert to Android Vector Drawable using [svg2vector.com](https://svg2vector.com/)
3. Save as `ic_[name].xml` in this directory
4. Rebuild project to generate resources

## Usage in Code

```kotlin
import org.jetbrains.compose.resources.painterResource
import krieta.composeapp.generated.resources.Res
import krieta.composeapp.generated.resources.ic_home

Icon(
    painter = painterResource(Res.drawable.ic_home),
    contentDescription = "Home"
)
```

## Sample Icon Included
- `ic_home.xml` - Sample home icon for reference

## Required Icons (60 files need these)
See `ICON_MIGRATION_QUICK_REFERENCE.md` in project root for complete list.

## Notes
- Icons are automatically compiled into resources
- No need to manually import each icon file
- Resources are generated at build time
- Works on both Android and iOS
