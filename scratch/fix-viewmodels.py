import re
import os

path1 = 'c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/shorts/di/ShortsModule.kt'
with open(path1, 'r', encoding='utf-8') as f:
    c1 = f.read()
c1 = c1.replace('factory { ShortsViewModel(get()) }', 'factory { ShortsViewModel(get(), get()) }')
with open(path1, 'w', encoding='utf-8') as f:
    f.write(c1)

path2 = 'c:/Users/ADMIN/Krieta/composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/presentation/viewmodel/MarketplaceViewModels.kt'
with open(path2, 'r', encoding='utf-8') as f:
    c2 = f.read()

# For every when (val result = ...) block that only has Success and Error, add Loading branch
c2 = c2.replace('is NetworkResult.Error -> {}', 'is NetworkResult.Error -> {}\n                is com.krieta.com.core.network.NetworkResult.Loading -> {}')

with open(path2, 'w', encoding='utf-8') as f:
    f.write(c2)

print("Fixed view models")
