import re
from pathlib import Path

root = Path(r"c:\Users\ADMIN\Krieta\composeApp\src\commonMain\kotlin")

print("Fixing import issues...")

for kt_file in root.rglob("*.kt"):
    content = kt_file.read_text(encoding='utf-8', errors='ignore')
    original = content
    
    # Fix malformed imports
    content = re.sub(r'import androidx\.compose\.foundation\.shapeShape', 'import androidx.compose.foundation.shape.CircleShape', content)
    content = re.sub(r'import androidx\.compose\.foundation\.foundationStroke', 'import androidx.compose.foundation.BorderStroke', content)
    
    # Fix missing CircleShape import
    if 'CircleShape' in content and 'import androidx.compose.foundation.shape.CircleShape' not in content:
        package_match = re.search(r'^package .+$', content, re.MULTILINE)
        if package_match:
            # Find last import
            imports = list(re.finditer(r'^import .+$', content, re.MULTILINE))
            if imports:
                last_import = imports[-1]
                insert_pos = content.find('\n', last_import.end()) + 1
                content = content[:insert_pos] + 'import androidx.compose.foundation.shape.CircleShape\n' + content[insert_pos:]
    
    # Fix missing BorderStroke import
    if 'BorderStroke' in content and 'import androidx.compose.foundation.BorderStroke' not in content:
        package_match = re.search(r'^package .+$', content, re.MULTILINE)
        if package_match:
            imports = list(re.finditer(r'^import .+$', content, re.MULTILINE))
            if imports:
                last_import = imports[-1]
                insert_pos = content.find('\n', last_import.end()) + 1
                content = content[:insert_pos] + 'import androidx.compose.foundation.BorderStroke\n' + content[insert_pos:]
    
    # Fix .Circle, .Border, .PhotoAlternate references
    content = re.sub(r'\.Circle(?!Shape)', '', content)
    content = re.sub(r'\.Border(?!Stroke)', '', content)
    content = re.sub(r'\.PhotoAlternate', '', content)
    content = re.sub(r'\.Off(?!\w)', '', content)
    content = re.sub(r'\.Add(?!\w)', '', content)
    
    # Fix imageVector = painter issues for Icon calls
    content = re.sub(r'Icon\s*\(\s*imageVector\s*=', 'Icon(painter =', content)
    
    if content != original:
        kt_file.write_text(content, encoding='utf-8')
        print(f"  Fixed: {kt_file.relative_to(root)}")

print("\n[DONE] All import issues fixed")
