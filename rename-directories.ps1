#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Renames krieta directories to runinga

.DESCRIPTION
    Renames all com/krieta directories to com/runinga while preserving file structure
#>

$ErrorActionPreference = "Stop"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Renaming Directory Structure: krieta → runinga           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "C:\Users\ADMIN\Runinga"

# Find all krieta directories
$krietaDirs = Get-ChildItem -Path "$projectRoot\composeApp\src" -Directory -Recurse -Filter "*krieta*" | 
    Sort-Object -Property FullName -Descending # Process deepest first

Write-Host "Found $($krietaDirs.Count) directories to rename:" -ForegroundColor Yellow
$krietaDirs | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
Write-Host ""

foreach ($dir in $krietaDirs) {
    $newName = $dir.Name -replace "krieta", "runinga"
    $newPath = Join-Path $dir.Parent.FullName $newName
    
    Write-Host "Renaming:" -ForegroundColor Cyan
    Write-Host "  From: $($dir.FullName)" -ForegroundColor Gray
    Write-Host "  To:   $newPath" -ForegroundColor Green
    
    try {
        Rename-Item -Path $dir.FullName -NewName $newName -Force
        Write-Host "  ✅ Success" -ForegroundColor Green
    }
    catch {
        Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "✅ Directory renaming complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Verifying..." -ForegroundColor Cyan

$remaining = Get-ChildItem -Path "$projectRoot\composeApp\src" -Directory -Recurse -Filter "*krieta*"
if ($remaining.Count -eq 0) {
    Write-Host "✅ No 'krieta' directories remaining" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: $($remaining.Count) 'krieta' directories still exist:" -ForegroundColor Yellow
    $remaining | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update AndroidManifest.xml package name" -ForegroundColor White
Write-Host "2. Update build.gradle.kts namespace" -ForegroundColor White
Write-Host "3. Rebuild project: ./gradlew clean build" -ForegroundColor White
