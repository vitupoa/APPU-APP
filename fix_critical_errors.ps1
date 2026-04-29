# Fix remaining critical errors

Write-Host "Fixing critical errors..." -ForegroundColor Green

# 1. Fix ContributeViewModel
$contributeVM = "composeApp\src\commonMain\kotlin\com\krieta\feature\chama\presentation\contribute\ContributeViewModel.kt"
if (Test-Path $contributeVM) {
    $content = Get-Content $contributeVM -Raw
    $content = $content -replace "balance = result\.data", "balance = result.data.balance"
    Set-Content -Path $contributeVM -Value $content -NoNewline
    Write-Host "Fixed ContributeViewModel"
}

# 2. Fix SettingsViewModel
$settingsVM = "composeApp\src\commonMain\kotlin\com\krieta\feature\chama\presentation\settings\SettingsViewModel.kt"
if (Test-Path $settingsVM) {
    $content = Get-Content $settingsVM -Raw
    $content = $content -replace "contributionAmount =", "contributionAmountKr ="
    Set-Content -Path $settingsVM -Value $content -NoNewline
    Write-Host "Fixed SettingsViewModel"
}

# 3. Fix ContestDetailViewModel
$contestVM = "composeApp\src\commonMain\kotlin\com\krieta\feature\contests\presentation\viewmodel\ContestDetailViewModel.kt"
if (Test-Path $contestVM) {
    $content = Get-Content $contestVM -Raw
    $content = $content -replace "contest = result\.data", "contest = result.data as Contest?"
    $content = $content -replace "contest\.hasJoined", "contest.isJoined"
    Set-Content -Path $contestVM -Value $content -NoNewline
    Write-Host "Fixed ContestDetailViewModel"
}

# 4. Fix LiveSocketManager
$liveSocket = "composeApp\src\commonMain\kotlin\com\krieta\feature\live\data\socket\LiveSocketManager.kt"
if (Test-Path $liveSocket) {
    $content = Get-Content $liveSocket -Raw
    $content = $content -replace "\.collect \{ frame: Frame ->", ".collect { frame ->"
    Set-Content -Path $liveSocket -Value $content -NoNewline
    Write-Host "Fixed LiveSocketManager"
}

# 5. Fix ViewerLiveScreen
$viewerLive = "composeApp\src\commonMain\kotlin\com\krieta\feature\live\presentation\screen\ViewerLiveScreen.kt"
if (Test-Path $viewerLive) {
    $content = Get-Content $viewerLive -Raw
    $content = $content -replace 'viewModel\.sendGift\("Gift", "HEART"\)', 'viewModel.sendGift(message = "Gift", giftType = "HEART")'
    Set-Content -Path $viewerLive -Value $content -NoNewline
    Write-Host "Fixed ViewerLiveScreen"
}

# 6. Fix ShortsScreen - remove sponsored content references
$shortsScreen = "composeApp\src\commonMain\kotlin\com\krieta\feature\shorts\presentation\screen\ShortsScreen.kt"
if (Test-Path $shortsScreen) {
    $content = Get-Content $shortsScreen -Raw
    # Remove sponsored content tracking calls
    $content = $content -replace "viewModel\.isSponsored\([^)]+\)", "false"
    $content = $content -replace "viewModel\.recordSponsoredImpression\([^)]+\)", "// removed"
    $content = $content -replace "viewModel\.recordSponsoredView\([^)]+\)", "// removed"
    $content = $content -replace "viewModel\.recordSponsoredEngagement\([^)]+\)", "// removed"
    $content = $content -replace "viewModel\.trackComment\([^)]+\)", "// removed"
    $content = $content -replace "viewModel\.trackView\([^)]+\)", "// removed"
    # Remove VideoProgressBar
    $content = $content -replace "// VideoProgressBar removed[^\n]*\n[^\n]*\n", ""
    Set-Content -Path $shortsScreen -Value $content -NoNewline
    Write-Host "Fixed ShortsScreen"
}

# 7. Fix DefaultersListScreen - completely broken, needs proper state
$defaultersScreen = "composeApp\src\commonMain\kotlin\com\krieta\feature\chama\presentation\defaulters\DefaultersListScreen.kt"
if (Test-Path $defaultersScreen) {
    $content = Get-Content $defaultersScreen -Raw
    # Fix getScreenModel
    $content = $content -replace "val viewModel: DefaultersViewModel = getScreenModel\(\)", "val viewModel = getScreenModel<DefaultersViewModel>()"
    # Fix state collection
    $content = $content -replace "val state = viewModel\.state\.collectAsState\(\)\.value", "val state by viewModel.state.collectAsState()"
    # Fix property references
    $content = $content -replace "state\.errorMessage", "state.error"
    $content = $content -replace "state\.loading", "state.isLoading"
    $content = $content -replace "state\.defaultersList", "state.defaulters"
    Set-Content -Path $defaultersScreen -Value $content -NoNewline
    Write-Host "Fixed DefaultersListScreen"
}

Write-Host "`nDone!" -ForegroundColor Green
