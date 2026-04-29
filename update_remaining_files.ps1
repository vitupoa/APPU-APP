# PowerShell script to update all remaining toDoubleOrNull() occurrences
# Run this from the Krieta root directory

Write-Host "Updating remaining frontend files with SafeConversion..." -ForegroundColor Green

# File 1: CampaignScreens.kt
Write-Host "`n1. Updating CampaignScreens.kt..." -ForegroundColor Yellow
$file1 = "composeApp\src\commonMain\kotlin\com\krieta\feature\marketplace\presentation\screen\CampaignScreens.kt"
$content1 = Get-Content $file1 -Raw
$content1 = $content1 -replace 'budget\.toDoubleOrNull\(\) \?\: 0\.0', 'com.krieta.com.core.util.SafeConversion.toDoubleOrDefaultWithValidation(budget, "campaignBudget", 0.0, defaultValue = 0.0)'
if ($content1 -notmatch 'import com\.krieta\.com\.core\.util\.SafeConversion') {
    $content1 = $content1 -replace '(import androidx\.compose)', "import com.krieta.com.core.util.SafeConversion`r`n`$1"
}
Set-Content $file1 $content1
Write-Host "   ✓ Updated CampaignScreens.kt" -ForegroundColor Green

# File 2: SponsorAndGamificationScreens.kt
Write-Host "`n2. Updating SponsorAndGamificationScreens.kt..." -ForegroundColor Yellow
$file2 = "composeApp\src\commonMain\kotlin\com\krieta\feature\marketplace\presentation\screen\SponsorAndGamificationScreens.kt"
$content2 = Get-Content $file2 -Raw
$content2 = $content2 -replace 'amount\.toDoubleOrNull\(\) \?\: 0\.0', 'com.krieta.com.core.util.SafeConversion.toDoubleOrDefaultWithValidation(amount, "sponsorAmount", 0.0, defaultValue = 0.0)'
if ($content2 -notmatch 'import com\.krieta\.com\.core\.util\.SafeConversion') {
    $content2 = $content2 -replace '(import androidx\.compose)', "import com.krieta.com.core.util.SafeConversion`r`n`$1"
}
Set-Content $file2 $content2
Write-Host "   ✓ Updated SponsorAndGamificationScreens.kt" -ForegroundColor Green

# File 3: SubscriptionTierSetupViewModel.kt
Write-Host "`n3. Updating SubscriptionTierSetupViewModel.kt..." -ForegroundColor Yellow
$file3 = "composeApp\src\commonMain\kotlin\com\krieta\feature\profile\presentation\viewmodel\SubscriptionTierSetupViewModel.kt"
$content3 = Get-Content $file3 -Raw
$content3 = $content3 -replace 'krAmount = it\.krAmount\.toDoubleOrNull\(\) \?\: 0\.0', 'krAmount = com.krieta.com.core.util.SafeConversion.toDoubleOrDefaultWithValidation(it.krAmount, "subscriptionAmount", 0.0, defaultValue = 0.0)'
if ($content3 -notmatch 'import com\.krieta\.com\.core\.util\.SafeConversion') {
    $content3 = $content3 -replace '(import cafe\.adriel\.voyager)', "import com.krieta.com.core.util.SafeConversion`r`n`$1"
}
Set-Content $file3 $content3
Write-Host "   ✓ Updated SubscriptionTierSetupViewModel.kt" -ForegroundColor Green

# File 4: CreateListingViewModel.kt
Write-Host "`n4. Updating CreateListingViewModel.kt..." -ForegroundColor Yellow
$file4 = "composeApp\src\commonMain\kotlin\com\krieta\feature\shop\presentation\viewmodel\CreateListingViewModel.kt"
$content4 = Get-Content $file4 -Raw
$content4 = $content4 -replace 'val price = s\.priceKr\.toDoubleOrNull\(\)', 'val price = if (s.priceKr.isNotEmpty()) com.krieta.com.core.util.SafeConversion.toDoubleOrDefaultWithValidation(s.priceKr, "productPrice", 0.0, defaultValue = 0.0) else null'
if ($content4 -notmatch 'import com\.krieta\.com\.core\.util\.SafeConversion') {
    $content4 = $content4 -replace '(import cafe\.adriel\.voyager)', "import com.krieta.com.core.util.SafeConversion`r`n`$1"
}
Set-Content $file4 $content4
Write-Host "   ✓ Updated CreateListingViewModel.kt" -ForegroundColor Green

# File 5: CreateCampaignScreen.kt (sponsored)
Write-Host "`n5. Updating CreateCampaignScreen.kt..." -ForegroundColor Yellow
$file5 = "composeApp\src\commonMain\kotlin\com\krieta\feature\sponsored\presentation\screen\CreateCampaignScreen.kt"
$content5 = Get-Content $file5 -Raw
$content5 = $content5 -replace 'budget = budget\.toDoubleOrNull\(\) \?\: 0\.0', 'budget = com.krieta.com.core.util.SafeConversion.toDoubleOrDefaultWithValidation(budget, "campaignBudget", 0.0, defaultValue = 0.0)'
$content5 = $content5 -replace 'bidAmount = bidAmount\.toDoubleOrNull\(\) \?\: 0\.0', 'bidAmount = com.krieta.com.core.util.SafeConversion.toDoubleOrDefaultWithValidation(bidAmount, "bidAmount", 0.0, defaultValue = 0.0)'
if ($content5 -notmatch 'import com\.krieta\.com\.core\.util\.SafeConversion') {
    $content5 = $content5 -replace '(import androidx\.compose)', "import com.krieta.com.core.util.SafeConversion`r`n`$1"
}
Set-Content $file5 $content5
Write-Host "   ✓ Updated CreateCampaignScreen.kt" -ForegroundColor Green

# File 6: WithdrawScreen.kt
Write-Host "`n6. Updating WithdrawScreen.kt..." -ForegroundColor Yellow
$file6 = "composeApp\src\commonMain\kotlin\com\krieta\feature\wallet\presentation\withdraw\WithdrawScreen.kt"
$content6 = Get-Content $file6 -Raw
$content6 = $content6 -replace 'val amount = state\.amount\.toDoubleOrNull\(\) \?\: return false', 'val amount = com.krieta.com.core.util.SafeConversion.toDoubleOrDefaultWithValidation(state.amount, "withdrawAmount", 0.0, defaultValue = 0.0); if (amount <= 0) return false'
if ($content6 -notmatch 'import com\.krieta\.com\.core\.util\.SafeConversion') {
    $content6 = $content6 -replace '(import androidx\.compose)', "import com.krieta.com.core.util.SafeConversion`r`n`$1"
}
Set-Content $file6 $content6
Write-Host "   ✓ Updated WithdrawScreen.kt" -ForegroundColor Green

# File 7: WithdrawViewModel.kt (wallet/presentation/withdraw)
Write-Host "`n7. Updating WithdrawViewModel.kt (withdraw folder)..." -ForegroundColor Yellow
$file7 = "composeApp\src\commonMain\kotlin\com\krieta\feature\wallet\presentation\withdraw\WithdrawViewModel.kt"
if (Test-Path $file7) {
    $content7 = Get-Content $file7 -Raw
    $content7 = $content7 -replace 'val amount = _state\.value\.amount\.toDoubleOrNull\(\)', 'val amount = if (_state.value.amount.isNotEmpty()) com.krieta.com.core.util.SafeConversion.toDoubleOrDefaultWithValidation(_state.value.amount, "withdrawAmount", 0.0, defaultValue = 0.0) else null'
    if ($content7 -notmatch 'import com\.krieta\.com\.core\.util\.SafeConversion') {
        $content7 = $content7 -replace '(import cafe\.adriel\.voyager)', "import com.krieta.com.core.util.SafeConversion`r`n`$1"
    }
    Set-Content $file7 $content7
    Write-Host "   ✓ Updated WithdrawViewModel.kt" -ForegroundColor Green
} else {
    Write-Host "   ⚠ File not found: $file7" -ForegroundColor Yellow
}

Write-Host "`n✅ All files updated successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Build the app: .\gradlew :composeApp:assembleDebug" -ForegroundColor White
Write-Host "2. Test all input fields with invalid values" -ForegroundColor White
Write-Host "3. Check console logs for conversion warnings" -ForegroundColor White
