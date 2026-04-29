import re
from pathlib import Path

root = Path(r"c:\Users\ADMIN\Krieta\composeApp\src\commonMain\kotlin")

# Fix files with malformed imports (line 9/11 errors)
malformed_import_files = [
    "com/krieta/feature/chama/presentation/defaulters/DefaultersListScreen.kt",
    "com/krieta/feature/chama/presentation/payout/ChamaPayoutScreen.kt",
    "com/krieta/feature/chama/presentation/settings/ChamaSettingsScreen.kt",
]

for file_rel in malformed_import_files:
    file_path = root / file_rel
    if not file_path.exists():
        continue
    
    print(f"Fixing malformed imports: {file_rel}")
    content = file_path.read_text(encoding='utf-8')
    
    # Remove malformed import lines
    content = re.sub(r'import androidx\.compose\.material\.painterResource\([^)]+\)\s*\n', '', content)
    
    file_path.write_text(content, encoding='utf-8')
    print("  [FIXED]")

# Fix imageVector -> painter parameter
print("\nFixing imageVector -> painter...")
for kt_file in root.rglob("*.kt"):
    content = kt_file.read_text(encoding='utf-8', errors='ignore')
    original = content
    
    # Fix Icon(imageVector = ...) -> Icon(painter = ...)
    content = re.sub(r'Icon\s*\(\s*imageVector\s*=', 'Icon(painter =', content)
    
    # Fix standalone imageVector = painterResource
    content = re.sub(r'(\s+)imageVector\s*=\s*painterResource\(', r'\1painter = painterResource(', content)
    
    if content != original:
        kt_file.write_text(content, encoding='utf-8')
        print(f"  Fixed: {kt_file.relative_to(root)}")

# Fix references to CheckCircle, FavoriteBorder, etc that got mangled
print("\nFixing mangled icon references...")
fixes = {
    'painterResource(Res.drawable.ic_add).PhotoAlternate': 'painterResource(Res.drawable.ic_add_photo)',
    'painterResource(Res.drawable.ic_favorite).Border': 'painterResource(Res.drawable.ic_favorite_border)',
    'painterResource(Res.drawable.ic_check).Circle': 'painterResource(Res.drawable.ic_check_circle)',
    '.Circle': '',
    '.Border': '',
    '.PhotoAlternate': '',
}

for kt_file in root.rglob("*.kt"):
    content = kt_file.read_text(encoding='utf-8', errors='ignore')
    original = content
    
    for old, new in fixes.items():
        content = content.replace(old, new)
    
    if content != original:
        kt_file.write_text(content, encoding='utf-8')
        print(f"  Fixed: {kt_file.relative_to(root)}")

print("\n[DONE]")
