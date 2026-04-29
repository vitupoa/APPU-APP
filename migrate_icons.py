import os
import re
from pathlib import Path

# Icon mapping
icon_map = {
    "Icons.Default.Lock": "Res.drawable.ic_lock",
    "Icons.Filled.Lock": "Res.drawable.ic_lock",
    "Icons.Default.Search": "Res.drawable.ic_search",
    "Icons.Filled.Search": "Res.drawable.ic_search",
    "Icons.Default.Warning": "Res.drawable.ic_warning",
    "Icons.Filled.Warning": "Res.drawable.ic_warning",
    "Icons.Default.Close": "Res.drawable.ic_close",
    "Icons.Filled.Close": "Res.drawable.ic_close",
    "Icons.Default.TrendingUp": "Res.drawable.ic_trending_up",
    "Icons.Filled.TrendingUp": "Res.drawable.ic_trending_up",
    "Icons.AutoMirrored.Filled.TrendingUp": "Res.drawable.ic_trending_up",
    "Icons.Default.Visibility": "Res.drawable.ic_visibility",
    "Icons.Filled.Visibility": "Res.drawable.ic_visibility",
    "Icons.Default.Favorite": "Res.drawable.ic_favorite",
    "Icons.Filled.Favorite": "Res.drawable.ic_favorite",
    "Icons.Default.PersonAdd": "Res.drawable.ic_person_add",
    "Icons.Filled.PersonAdd": "Res.drawable.ic_person_add",
    "Icons.Default.CallEnd": "Res.drawable.ic_call_end",
    "Icons.Filled.CallEnd": "Res.drawable.ic_call_end",
    "Icons.Default.Mic": "Res.drawable.ic_mic",
    "Icons.Filled.Mic": "Res.drawable.ic_mic",
    "Icons.Default.MicOff": "Res.drawable.ic_mic_off",
    "Icons.Filled.MicOff": "Res.drawable.ic_mic_off",
    "Icons.Default.Videocam": "Res.drawable.ic_videocam",
    "Icons.Filled.Videocam": "Res.drawable.ic_videocam",
    "Icons.Default.VideocamOff": "Res.drawable.ic_videocam_off",
    "Icons.Filled.VideocamOff": "Res.drawable.ic_videocam_off",
    "Icons.Default.Check": "Res.drawable.ic_check",
    "Icons.Filled.Check": "Res.drawable.ic_check",
    "Icons.Default.LockOpen": "Res.drawable.ic_lock_open",
    "Icons.Filled.LockOpen": "Res.drawable.ic_lock_open",
    "Icons.Default.Send": "Res.drawable.ic_send",
    "Icons.Filled.Send": "Res.drawable.ic_send",
    "Icons.AutoMirrored.Filled.Send": "Res.drawable.ic_send",
    "Icons.Default.Add": "Res.drawable.ic_add",
    "Icons.Filled.Add": "Res.drawable.ic_add",
    "Icons.Default.CheckCircle": "Res.drawable.ic_check_circle",
    "Icons.Filled.CheckCircle": "Res.drawable.ic_check_circle",
    "Icons.Default.AddPhotoAlternate": "Res.drawable.ic_add_photo",
    "Icons.Filled.AddPhotoAlternate": "Res.drawable.ic_add_photo",
    "Icons.Default.FavoriteBorder": "Res.drawable.ic_favorite_border",
    "Icons.Filled.FavoriteBorder": "Res.drawable.ic_favorite_border",
    "Icons.Default.ModeComment": "Res.drawable.ic_comment",
    "Icons.Filled.ModeComment": "Res.drawable.ic_comment",
    "Icons.Default.Pause": "Res.drawable.ic_pause",
    "Icons.Filled.Pause": "Res.drawable.ic_pause",
    "Icons.Default.PlayArrow": "Res.drawable.ic_play_arrow",
    "Icons.Filled.PlayArrow": "Res.drawable.ic_play_arrow",
    "Icons.Default.ShoppingBag": "Res.drawable.ic_shopping_bag",
    "Icons.Filled.ShoppingBag": "Res.drawable.ic_shopping_bag",
    "Icons.Default.List": "Res.drawable.ic_list",
    "Icons.Filled.List": "Res.drawable.ic_list",
    "Icons.AutoMirrored.Filled.List": "Res.drawable.ic_list",
    "Icons.Default.Delete": "Res.drawable.ic_delete",
    "Icons.Filled.Delete": "Res.drawable.ic_delete",
    "Icons.Default.Edit": "Res.drawable.ic_edit",
    "Icons.Filled.Edit": "Res.drawable.ic_edit",
    "Icons.Default.MoreVert": "Res.drawable.ic_more_vert",
    "Icons.Filled.MoreVert": "Res.drawable.ic_more_vert",
    "Icons.Default.PhotoCamera": "Res.drawable.ic_photo_camera",
    "Icons.Filled.PhotoCamera": "Res.drawable.ic_photo_camera",
    "Icons.Default.Verified": "Res.drawable.ic_verified",
    "Icons.Filled.Verified": "Res.drawable.ic_verified",
    "Icons.Default.Chat": "Res.drawable.ic_chat",
    "Icons.Filled.Chat": "Res.drawable.ic_chat",
    "Icons.AutoMirrored.Filled.Chat": "Res.drawable.ic_chat",
    "Icons.Default.Image": "Res.drawable.ic_image",
    "Icons.Filled.Image": "Res.drawable.ic_image",
    "Icons.Default.Backspace": "Res.drawable.ic_backspace",
    "Icons.Filled.Backspace": "Res.drawable.ic_backspace",
    "Icons.AutoMirrored.Filled.Backspace": "Res.drawable.ic_backspace",
    "Icons.Default.ArrowUpward": "Res.drawable.ic_arrow_upward",
    "Icons.Filled.ArrowUpward": "Res.drawable.ic_arrow_upward",
    "Icons.Default.ArrowDownward": "Res.drawable.ic_arrow_downward",
    "Icons.Filled.ArrowDownward": "Res.drawable.ic_arrow_downward",
    "Icons.Default.VisibilityOff": "Res.drawable.ic_visibility_off",
    "Icons.Filled.VisibilityOff": "Res.drawable.ic_visibility_off",
}

root_path = Path(r"c:\Users\ADMIN\Krieta\composeApp\src\commonMain\kotlin")

# Find all Kotlin files with Material Icons
files = [f for f in root_path.rglob("*.kt") if "androidx.compose.material.icons" in f.read_text(encoding='utf-8', errors='ignore')]

print(f"Found {len(files)} files to migrate\n")

for file_path in files:
    print(f"Processing: {file_path.name}")
    
    content = file_path.read_text(encoding='utf-8')
    original = content
    
    # Remove Material Icons imports
    content = re.sub(r'import androidx\.compose\.material\.icons\.Icons\s*\n', '', content)
    content = re.sub(r'import androidx\.compose\.material\.icons\.filled\.\w+\s*\n', '', content)
    content = re.sub(r'import androidx\.compose\.material\.icons\.outlined\.\w+\s*\n', '', content)
    content = re.sub(r'import androidx\.compose\.material\.icons\.automirrored\.filled\.\w+\s*\n', '', content)
    
    # Add new imports if needed
    if "androidx.compose.material.icons" in original and "painterResource" not in content:
        package_match = re.search(r'^package .+$', content, re.MULTILINE)
        if package_match:
            insert_pos = content.find('\n', package_match.end()) + 1
            new_imports = "\nimport org.jetbrains.compose.resources.painterResource\nimport krieta.composeapp.generated.resources.Res\nimport krieta.composeapp.generated.resources.*\n"
            content = content[:insert_pos] + new_imports + content[insert_pos:]
    
    # Replace icon usages
    for old_icon, new_icon in icon_map.items():
        escaped = re.escape(old_icon)
        # Pattern 1: Icon(Icons.X, ...)
        content = re.sub(rf'Icon\s*\(\s*{escaped}\s*,', f'Icon(painterResource({new_icon}),', content)
        # Pattern 2: imageVector = Icons.X
        content = re.sub(rf'imageVector\s*=\s*{escaped}', f'painter = painterResource({new_icon})', content)
        # Pattern 3: rememberVectorPainter(Icons.X)
        content = re.sub(rf'rememberVectorPainter\s*\(\s*{escaped}\s*\)', f'painterResource({new_icon})', content)
    
    if content != original:
        file_path.write_text(content, encoding='utf-8')
        print(f"  [OK] Migrated")
    else:
        print(f"  [-] No changes")

print(f"\n[OK] Migration complete! Processed {len(files)} files")
