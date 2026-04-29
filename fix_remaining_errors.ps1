# PowerShell script to fix remaining compilation errors

Write-Host "Fixing remaining compilation errors..." -ForegroundColor Green

# Fix all Material Icons imports - add to files that are missing them
$screenFiles = Get-ChildItem -Path "composeApp\src\commonMain\kotlin" -Recurse -Filter "*Screen.kt"

foreach ($file in $screenFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file already has Icons import
    if ($content -notmatch "import androidx\.compose\.material\.icons\.Icons") {
        # Add imports after package declaration
        $content = $content -replace "(package .+?\n)", "`$1import androidx.compose.material.icons.Icons`nimport androidx.compose.material.icons.filled.*`n"
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Added Icons imports to: $($file.Name)" -ForegroundColor Yellow
    }
}

# Fix specific files with known issues
Write-Host "`nFixing specific file issues..." -ForegroundColor Green

# Fix DefaultersListScreen - completely broken, needs full rewrite of state handling
$defaultersScreen = "composeApp\src\commonMain\kotlin\com\krieta\feature\chama\presentation\defaulters\DefaultersListScreen.kt"
if (Test-Path $defaultersScreen) {
    $content = Get-Content $defaultersScreen -Raw
    
    # Fix the state collection
    $content = $content -replace "val viewModel = getScreenModel<DefaultersViewModel>\(\)", "val viewModel: DefaultersViewModel = getScreenModel()"
    $content = $content -replace "val state by viewModel\.state\.collectAsState\(\)", "val state = viewModel.state.collectAsState().value"
    
    # Fix error references
    $content = $content -replace "state\.error", "state.errorMessage"
    
    # Fix isLoading references  
    $content = $content -replace "state\.isLoading", "state.loading"
    
    # Fix defaulters references
    $content = $content -replace "state\.defaulters", "state.defaultersList"
    
    Set-Content -Path $defaultersScreen -Value $content -NoNewline
    Write-Host "Fixed DefaultersListScreen" -ForegroundColor Yellow
}

# Fix ContributeViewModel - wrong property access
$contributeVM = "composeApp\src\commonMain\kotlin\com\krieta\feature\chama\presentation\contribute\ContributeViewModel.kt"
if (Test-Path $contributeVM) {
    $content = Get-Content $contributeVM -Raw
    $content = $content -replace 'is NetworkResult\.Success -> _state\.value = _state\.value\.copy\(balance = result\.data\)', 'is NetworkResult.Success -> _state.value = _state.value.copy(balance = result.data.balance)'
    Set-Content -Path $contributeVM -Value $content -NoNewline
    Write-Host "Fixed ContributeViewModel" -ForegroundColor Yellow
}

# Fix SettingsViewModel - missing parameter
$settingsVM = "composeApp\src\commonMain\kotlin\com\krieta\feature\chama\presentation\settings\SettingsViewModel.kt"
if (Test-Path $settingsVM) {
    $content = Get-Content $settingsVM -Raw
    $content = $content -replace "contributionAmountKr = ", "contributionAmount = "
    Set-Content -Path $settingsVM -Value $content -NoNewline
    Write-Host "Fixed SettingsViewModel" -ForegroundColor Yellow
}

# Fix AuthViewModel and RegisterViewModel - type mismatch
$authVM = "composeApp\src\commonMain\kotlin\com\krieta\feature\auth\presentation\viewmodel\AuthViewModel.kt"
if (Test-Path $authVM) {
    $content = Get-Content $authVM -Raw
    $content = $content -replace "_state\.value = result\.data", "_state.value = result.data as AuthState"
    Set-Content -Path $authVM -Value $content -NoNewline
    Write-Host "Fixed AuthViewModel" -ForegroundColor Yellow
}

$registerVM = "composeApp\src\commonMain\kotlin\com\krieta\feature\auth\presentation\viewmodel\RegisterViewModel.kt"
if (Test-Path $registerVM) {
    $content = Get-Content $registerVM -Raw
    $content = $content -replace "_registerState\.value = result\.data", "_registerState.value = result.data as RegisterState"
    Set-Content -Path $registerVM -Value $content -NoNewline
    Write-Host "Fixed RegisterViewModel" -ForegroundColor Yellow
}

# Fix UploadWorker - type mismatch
$uploadWorker = "composeApp\src\androidMain\kotlin\com\krieta\com\core\upload\UploadWorker.kt"
if (Test-Path $uploadWorker) {
    $content = Get-Content $uploadWorker -Raw
    $emptyString = '""'
    $content = $content -replace "inputData\.getString\(KEY_UPLOAD_TYPE\)", "inputData.getString(KEY_UPLOAD_TYPE) ?: $emptyString"
    Set-Content -Path $uploadWorker -Value $content -NoNewline
    Write-Host "Fixed UploadWorker" -ForegroundColor Yellow
}

# Fix Tabs.kt - color properties
$tabs = "composeApp\src\commonMain\kotlin\com\krieta\com\core\navigation\Tabs.kt"
if (Test-Path $tabs) {
    $content = Get-Content $tabs -Raw
    $content = $content -replace "secondaryContainer", "secondary"
    $content = $content -replace "onSecondaryContainer", "onSecondary"
    Set-Content -Path $tabs -Value $content -NoNewline
    Write-Host "Fixed Tabs.kt color properties" -ForegroundColor Yellow
}

# Fix ContestDetailViewModel
$contestDetailVM = "composeApp\src\commonMain\kotlin\com\krieta\feature\contests\presentation\viewmodel\ContestDetailViewModel.kt"
if (Test-Path $contestDetailVM) {
    $content = Get-Content $contestDetailVM -Raw
    $content = $content -replace "_state\.value = _state\.value\.copy\(contest = result\.data\)", "_state.value = _state.value.copy(contest = result.data as Contest)"
    $content = $content -replace "contest\.isJoined", "contest.hasJoined"
    Set-Content -Path $contestDetailVM -Value $content -NoNewline
    Write-Host "Fixed ContestDetailViewModel" -ForegroundColor Yellow
}

# Fix LiveSocketManager
$liveSocket = "composeApp\src\commonMain\kotlin\com\krieta\feature\live\data\socket\LiveSocketManager.kt"
if (Test-Path $liveSocket) {
    $content = Get-Content $liveSocket -Raw
    $content = $content -replace "\.collect \{", ".collect { frame: Frame ->"
    Set-Content -Path $liveSocket -Value $content -NoNewline
    Write-Host "Fixed LiveSocketManager" -ForegroundColor Yellow
}

# Fix OAuthViewModel - map function issue
$oauthVM = "composeApp\src\commonMain\kotlin\com\krieta\feature\marketplace\presentation\oauth\OAuthViewModel.kt"
if (Test-Path $oauthVM) {
    $content = Get-Content $oauthVM -Raw
    
    # Replace the entire problematic section
    $oldPattern = "is NetworkResult\.Success -> \{[^}]+_state\.value\.copy\([^)]+\)[^}]+\}"
    $newCode = @"
is NetworkResult.Success -> {
                    val accounts = result.data.accounts
                    _state.value = _state.value.copy(
                        tiktokConnected = accounts.any { it.platform == "tiktok" && it.isConnected },
                        instagramConnected = accounts.any { it.platform == "instagram" && it.isConnected },
                        youtubeConnected = accounts.any { it.platform == "youtube" && it.isConnected },
                        tiktokFollowers = accounts.find { it.platform == "tiktok" }?.followersCount,
                        instagramFollowers = accounts.find { it.platform == "instagram" }?.followersCount,
                        youtubeFollowers = accounts.find { it.platform == "youtube" }?.followersCount,
                        tiktokUsername = accounts.find { it.platform == "tiktok" }?.username
                    )
                }
"@
    
    if ($content -match $oldPattern) {
        $content = $content -replace $oldPattern, $newCode
    }
    
    # Fix authUrl assignment
    $content = $content -replace "_state\.value = _state\.value\.copy\(authUrl = result\.data\)", "_state.value = _state.value.copy(authUrl = result.data.authUrl)"
    
    Set-Content -Path $oauthVM -Value $content -NoNewline
    Write-Host "Fixed OAuthViewModel" -ForegroundColor Yellow
}

Write-Host "`nDone! Run gradle build to verify." -ForegroundColor Green
