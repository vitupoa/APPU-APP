# Fix variable scoping issues in TypeScript files
# This script fixes shorthand property issues where variables are used without declaration

$files = @(
    "src/modules/chama/chama.service.ts",
    "src/modules/kyc/withdrawal.service.ts",
    "src/modules/calls/calls.controller.ts",
    "src/routes/api.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        $content = Get-Content $file -Raw
        
        # Fix common variable scoping patterns
        # Replace { user_id } with { user_id: userId }
        $content = $content -replace '\{\s*user_id\s*\}', '{ user_id: userId }'
        $content = $content -replace '\{\s*user_id\s*,', '{ user_id: userId,'
        
        # Replace { chat_id } with { chat_id: chatId }
        $content = $content -replace '\{\s*chat_id\s*\}', '{ chat_id: chatId }'
        $content = $content -replace '\{\s*chat_id\s*,', '{ user_id: chatId,'
        
        # Replace { creator_id } with { creator_id: creatorId }
        $content = $content -replace '\{\s*creator_id\s*\}', '{ creator_id: creatorId }'
        $content = $content -replace '\{\s*creator_id\s*,', '{ creator_id: creatorId,'
        
        Set-Content $file $content -NoNewline
        Write-Host "✓ Fixed $file"
    }
}

Write-Host "`n✅ Variable scoping fixes complete!"
