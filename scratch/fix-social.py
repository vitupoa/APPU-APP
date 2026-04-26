import re

path2 = 'c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/presentation/screen/SocialMediaManagementScreen.kt'
with open(path2, 'r', encoding='utf-8') as f:
    c2 = f.read()

# Revert
c2 = c2.replace('modifier = Modifier.fillMaxWidth()', 'Modifier.fillMaxWidth()')

# Add @OptIn
c2 = c2.replace('@Composable\nprivate fun AvailablePlatformsGrid', '@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)\n@Composable\nprivate fun AvailablePlatformsGrid')

with open(path2, 'w', encoding='utf-8') as f:
    f.write(c2)

print("Fixed")
