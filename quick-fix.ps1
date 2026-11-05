Write-Host "Fixing all compilation errors..." -ForegroundColor Cyan

# 1. Fix SQLDelight Boolean imports
Write-Host "`n1. Fixing SQLDelight Boolean imports..." -ForegroundColor Yellow
$sqlFiles = @(
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\ChatQueries.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\Conversation.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\Drip.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\DripComment.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\DripQueries.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\Message.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\Product.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\ProductQueries.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\ProfileQueries.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\Short.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\ShortComment.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\ShortQueries.kt",
    "composeApp\build\generated\sqldelight\code\RuningaDatabase\commonMain\com\runinga\db\UserProfile.kt"
)

foreach ($file in $sqlFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content -match 'import Boolean') {
            $content = $content -replace 'import Boolean', 'import kotlin.Boolean'
            Set-Content $file $content -NoNewline
            Write-Host "  Fixed: $file" -ForegroundColor Green
        }
    }
}

Write-Host "`nAll fixes applied!" -ForegroundColor Green
Write-Host "Run: .\gradlew.bat :composeApp:assembleDebug" -ForegroundColor Cyan
