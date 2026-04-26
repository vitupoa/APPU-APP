import re

# MarketplaceNavigation
path1 = 'c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/presentation/screen/MarketplaceNavigation.kt'
with open(path1, 'r', encoding='utf-8') as f:
    c1 = f.read()
c1 = 'import androidx.compose.foundation.layout.fillMaxSize\n' + c1
with open(path1, 'w', encoding='utf-8') as f:
    f.write(c1)

# SocialMediaManagementScreen
path2 = 'c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/presentation/screen/SocialMediaManagementScreen.kt'
with open(path2, 'r', encoding='utf-8') as f:
    c2 = f.read()
c2 = c2.replace('Modifier.fillMaxWidth()', 'modifier = Modifier.fillMaxWidth()') # Just guessing based on Modifier passed to () -> Unit
with open(path2, 'w', encoding='utf-8') as f:
    f.write(c2)

# InfluencerSearchViewModel
path3 = 'c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/presentation/viewmodel/InfluencerSearchViewModel.kt'
with open(path3, 'r', encoding='utf-8') as f:
    c3 = f.read()
c3 = c3.replace('is NetworkResult.Error -> {}', 'is NetworkResult.Error -> {}\n                is com.krieta.com.core.network.NetworkResult.Loading -> {}')
with open(path3, 'w', encoding='utf-8') as f:
    f.write(c3)

# MarketplaceViewModels
path4 = 'c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/presentation/viewmodel/MarketplaceViewModels.kt'
with open(path4, 'r', encoding='utf-8') as f:
    c4 = f.read()
c4 = c4.replace('is NetworkResult.Error -> _error.value = result.message', 'is NetworkResult.Error -> _error.value = result.message\n                is com.krieta.com.core.network.NetworkResult.Loading -> {}')
with open(path4, 'w', encoding='utf-8') as f:
    f.write(c4)
    
print("Fixed")
