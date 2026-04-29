#!/bin/bash

# Automated Fix Script for Compilation Errors
# Run this from project root: bash fix_all_errors.sh

echo "Starting automated fixes..."

# Fix 1: Add Loading branches to all when expressions in ViewModels
echo "Adding Loading branches to when expressions..."

find composeApp/src/commonMain/kotlin -name "*ViewModel.kt" -type f -exec sed -i 's/is NetworkResult\.Error ->/is NetworkResult.Loading -> {}\n                is NetworkResult.Error ->/g' {} \;

# Fix 2: Add Material Icons imports to all Screen files
echo "Adding Material Icons imports..."

find composeApp/src/commonMain/kotlin -name "*Screen.kt" -type f -exec sed -i '1 a\
import androidx.compose.material.icons.Icons\
import androidx.compose.material.icons.filled.*\
import androidx.compose.foundation.BorderStroke\
import androidx.compose.foundation.shape.CircleShape' {} \;

# Fix 3: Fix property access in specific ViewModels
echo "Fixing property access errors..."

# DefaultersViewModel
sed -i 's/result\.data\.defaulters/result.data/g' composeApp/src/commonMain/kotlin/com/krieta/feature/chama/presentation/defaulters/DefaultersViewModel.kt

# SettingsViewModel  
sed -i 's/result\.data\.chama/result.data/g' composeApp/src/commonMain/kotlin/com/krieta/feature/chama/presentation/settings/SettingsViewModel.kt

# OAuthViewModel
sed -i 's/result\.data\.accounts/result.data/g' composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/presentation/oauth/OAuthViewModel.kt
sed -i 's/result\.data\.authUrl/result.data/g' composeApp/src/commonMain/kotlin/com/krieta/feature/marketplace/presentation/oauth/OAuthViewModel.kt

# Fix 4: Fix Tabs.kt color properties
sed -i 's/SecondaryContainer/secondaryContainer/g' composeApp/src/commonMain/kotlin/com/krieta/com/core/navigation/Tabs.kt
sed -i 's/OnSecondaryContainer/onSecondaryContainer/g' composeApp/src/commonMain/kotlin/com/krieta/com/core/navigation/Tabs.kt

echo "Fixes applied successfully!"
echo "Now run: ./gradlew clean && ./gradlew :composeApp:compileDebugKotlinAndroid"
