# Fix Prisma model names from camelCase to snake_case for models that don't use camelCase mapping

$replacements = @{
    'prisma\.withdrawalRequest\.' = 'prisma.withdrawal_requests.'
    'prisma\.kYCDocument\.' = 'prisma.kyc_documents.'
    'prisma\.withdrawalLimit\.' = 'prisma.withdrawal_limits.'
    'prisma\.suspiciousActivity\.' = 'prisma.suspicious_activities.'
    'prisma\.auditLog\.' = 'prisma.audit_logs.'
    'prisma\.platformConfig\.' = 'prisma.platform_config.'
    'prisma\.prohibitedName\.' = 'prisma.prohibited_names.'
    'prisma\.reservedUsername\.' = 'prisma.reserved_usernames.'
    'prisma\.refresh_token\.' = 'prisma.refresh_tokens.'
    'prisma\.userSuspension\.' = 'prisma.user_suspensions.'
    'prisma\.contentModerationLog\.' = 'prisma.content_moderation_logs.'
    'prisma\.featureFlag\.' = 'prisma.feature_flags.'
    'prisma\.platformAnnouncement\.' = 'prisma.platform_announcements.'
    'prisma\.escrow\.' = 'prisma.escrows.'
    'prisma\.short\.' = 'prisma.shorts.'
    'prisma\.product\.' = 'prisma.products.'
    'prisma\.transaction\.' = 'prisma.transactions.'
    'prisma\.userSessionSecret\.' = 'prisma.user_session_secrets.'
    'prisma\.transactionNonce\.' = 'prisma.transaction_nonces.'
    'prisma\.platformWallet\.' = 'prisma.platform_wallet.'
    'tx\.wallet\.' = 'tx.wallets.'
    'tx\.transaction\.' = 'tx.transactions.'
    'tx\.transactionNonce\.' = 'tx.transaction_nonces.'
    'tx\.withdrawalRequest\.' = 'tx.withdrawal_requests.'
    'tx\.userSuspension\.' = 'tx.user_suspensions.'
    'tx\.escrow\.' = 'tx.escrows.'
    'tx\.message\.' = 'tx.messages.'
}

Get-ChildItem -Path src -Recurse -Filter *.ts | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $modified = $false
    
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $replacement
            $modified = $true
        }
    }
    
    if ($modified) {
        Set-Content -Path $_.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}

Write-Host "Completed fixing Prisma model names"
