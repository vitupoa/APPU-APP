#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Push to GitHub with proper authentication for vitupoa account

.DESCRIPTION
    This script helps push your changes to the correct GitHub account
#>

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          Pushing Runinga to GitHub (vitupoa)               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$repo = "https://github.com/vitupoa/APPU-APP.git"

Write-Host "Repository: $repo" -ForegroundColor Yellow
Write-Host ""
Write-Host "When prompted, enter your GitHub credentials for 'vitupoa' account:" -ForegroundColor Yellow
Write-Host "  - Username: vitupoa" -ForegroundColor Gray
Write-Host "  - Password: Your GitHub Personal Access Token (NOT your password)" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Don't have a Personal Access Token? Create one at:" -ForegroundColor Cyan
Write-Host "   https://github.com/settings/tokens/new" -ForegroundColor Gray
Write-Host "   Required scopes: repo (full control)" -ForegroundColor Gray
Write-Host ""

# Update remote URL to use vitupoa
Write-Host "🔧 Updating remote URL..." -ForegroundColor Cyan
git remote set-url origin "https://vitupoa@github.com/vitupoa/APPU-APP.git"

# Show current remote
Write-Host "✅ Remote configured:" -ForegroundColor Green
git remote -v

Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan
Write-Host ""

# Push to GitHub
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              ✅ PUSH SUCCESSFUL!                            ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your changes are now on GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/vitupoa/APPU-APP" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🚀 Railway will automatically deploy if connected!" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║              ❌ PUSH FAILED                                 ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  1. Wrong credentials - Make sure you're using vitupoa account" -ForegroundColor Gray
    Write-Host "  2. Need Personal Access Token (not password)" -ForegroundColor Gray
    Write-Host "  3. Token needs 'repo' scope" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Create token at: https://github.com/settings/tokens/new" -ForegroundColor Cyan
    Write-Host ""
}
