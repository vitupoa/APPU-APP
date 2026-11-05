#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Renames all occurrences of "Krieta" to "Runinga" and "Kr" to "Rc" throughout the project.

.DESCRIPTION
    This script performs a comprehensive find-and-replace operation:
    - Krieta → Runinga
    - krieta → runinga
    - KRIETA → RUNINGA
    - Kr → Rc (Runinga Coin, context-aware)
    - api.krieta.com → api.runinga.com
    
.NOTES
    Creates a backup before making changes.
    Processes all text files recursively.
#>

param(
    [switch]$DryRun = $false,
    [switch]$NoBackup = $false
)

$ErrorActionPreference = "Stop"
$projectRoot = $PSScriptRoot

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Renaming Krieta → Runinga Throughout Project             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Backup
if (-not $NoBackup -and -not $DryRun) {
    $backupDir = Join-Path $projectRoot ".backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Host "📦 Creating backup in: $backupDir" -ForegroundColor Yellow
    
    # Copy critical directories only (not build outputs)
    $criticalPaths = @(
        "composeApp\src",
        "backend\src",
        "backend\prisma",
        "docs"
    )
    
    foreach ($path in $criticalPaths) {
        $source = Join-Path $projectRoot $path
        if (Test-Path $source) {
            $dest = Join-Path $backupDir $path
            Write-Host "  Backing up: $path"
            Copy-Item -Path $source -Destination $dest -Recurse -Force
        }
    }
    
    Write-Host "✅ Backup complete" -ForegroundColor Green
    Write-Host ""
}

# File patterns to process
$filePatterns = @(
    "*.kt",
    "*.kts",
    "*.ts",
    "*.js",
    "*.json",
    "*.md",
    "*.txt",
    "*.yaml",
    "*.yml",
    "*.xml",
    "*.gradle",
    "*.prisma",
    "*.sql",
    "*.sh",
    "*.ps1",
    "*.env*"
)

# Directories to exclude
$excludeDirs = @(
    ".git",
    "node_modules",
    "build",
    "dist",
    ".gradle",
    ".idea",
    ".kiro",
    ".backup-*",
    "gradle"
)

# Replacement mappings (order matters!)
$replacements = @(
    # Domain names first
    @{ Find = "api.krieta.com"; Replace = "api.runinga.com"; CaseSensitive = $true },
    @{ Find = "krieta.com"; Replace = "runinga.com"; CaseSensitive = $false },
    
    # Package names (case-sensitive to avoid breaking code)
    @{ Find = "com.krieta"; Replace = "com.runinga"; CaseSensitive = $true },
    @{ Find = "com/krieta"; Replace = "com/runinga"; CaseSensitive = $true },
    
    # Database/file names
    @{ Find = "@krieta.com"; Replace = "@runinga.com"; CaseSensitive = $false },
    @{ Find = "krieta_"; Replace = "runinga_"; CaseSensitive = $true },
    
    # Brand names (preserve case variations)
    @{ Find = "KRIETA"; Replace = "RUNINGA"; CaseSensitive = $true },
    @{ Find = "Krieta"; Replace = "Runinga"; CaseSensitive = $true },
    @{ Find = "krieta"; Replace = "runinga"; CaseSensitive = $true },
    
    # Coin currency (context-aware: only replace standalone "Kr")
    @{ Find = "\bKr\b"; Replace = "Rc"; CaseSensitive = $true; Regex = $true },
    @{ Find = "\bKr\."; Replace = "Rc."; CaseSensitive = $true; Regex = $true },
    @{ Find = "Kr "; Replace = "Rc "; CaseSensitive = $true },
    @{ Find = " Kr"; Replace = " Rc"; CaseSensitive = $true },
    @{ Find = '"Kr"'; Replace = '"Rc"'; CaseSensitive = $true },
    @{ Find = "'Kr'"; Replace = "'Rc'"; CaseSensitive = $true },
    @{ Find = "KR_"; Replace = "RC_"; CaseSensitive = $true },
    @{ Find = "_KR_"; Replace = "_RC_"; CaseSensitive = $true },
    @{ Find = "Kr_"; Replace = "Rc_"; CaseSensitive = $true },
    @{ Find = "_Kr"; Replace = "_Rc"; CaseSensitive = $true }
)

# Statistics
$stats = @{
    FilesProcessed = 0
    FilesModified = 0
    TotalReplacements = 0
    Errors = 0
}

# Get all files to process
Write-Host "🔍 Scanning for files to process..." -ForegroundColor Cyan
$allFiles = @()

foreach ($pattern in $filePatterns) {
    $files = Get-ChildItem -Path $projectRoot -Filter $pattern -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        $filePath = $_.FullName
        $shouldExclude = $false
        
        foreach ($excludeDir in $excludeDirs) {
            if ($filePath -like "*\$excludeDir\*" -or $filePath -like "*/$excludeDir/*") {
                $shouldExclude = $true
                break
            }
        }
        
        -not $shouldExclude
    }
    
    $allFiles += $files
}

$allFiles = $allFiles | Sort-Object -Property FullName -Unique

Write-Host "Found $($allFiles.Count) files to process" -ForegroundColor Green
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No files will be modified" -ForegroundColor Yellow
    Write-Host ""
}

# Process each file
$progress = 0
foreach ($file in $allFiles) {
    $progress++
    $percentComplete = [math]::Round(($progress / $allFiles.Count) * 100, 1)
    
    Write-Progress -Activity "Processing files" -Status "$progress of $($allFiles.Count) - $($file.Name)" -PercentComplete $percentComplete
    
    $stats.FilesProcessed++
    
    try {
        # Read file content
        $encoding = [System.Text.Encoding]::UTF8
        $content = [System.IO.File]::ReadAllText($file.FullName, $encoding)
        $originalContent = $content
        $fileReplacements = 0
        
        # Apply all replacements
        foreach ($replacement in $replacements) {
            $beforeCount = ([regex]::Matches($content, [regex]::Escape($replacement.Find))).Count
            
            if ($replacement.Regex) {
                # Use regex replacement
                if ($replacement.CaseSensitive) {
                    $content = $content -creplace $replacement.Find, $replacement.Replace
                } else {
                    $content = $content -replace $replacement.Find, $replacement.Replace
                }
            } else {
                # Use simple string replacement
                if ($replacement.CaseSensitive) {
                    $content = $content -creplace [regex]::Escape($replacement.Find), $replacement.Replace
                } else {
                    $content = $content -replace [regex]::Escape($replacement.Find), $replacement.Replace
                }
            }
            
            $afterCount = ([regex]::Matches($content, [regex]::Escape($replacement.Replace))).Count
            $replacementCount = [Math]::Max(0, $afterCount - ([regex]::Matches($originalContent, [regex]::Escape($replacement.Replace))).Count)
            $fileReplacements += $replacementCount
        }
        
        # If content changed, write back
        if ($content -ne $originalContent) {
            $stats.FilesModified++
            $stats.TotalReplacements += $fileReplacements
            
            $relativePath = $file.FullName.Substring($projectRoot.Length + 1)
            Write-Host "  ✏️  $relativePath" -ForegroundColor Green -NoNewline
            Write-Host " ($fileReplacements changes)" -ForegroundColor Gray
            
            if (-not $DryRun) {
                [System.IO.File]::WriteAllText($file.FullName, $content, $encoding)
            }
        }
    }
    catch {
        $stats.Errors++
        Write-Host "  ❌ Error processing $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Progress -Activity "Processing files" -Completed

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    SUMMARY                                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files Processed:     $($stats.FilesProcessed)" -ForegroundColor White
Write-Host "Files Modified:      $($stats.FilesModified)" -ForegroundColor Green
Write-Host "Total Replacements:  $($stats.TotalReplacements)" -ForegroundColor Green
Write-Host "Errors:              $($stats.Errors)" -ForegroundColor $(if ($stats.Errors -gt 0) { "Red" } else { "Green" })
Write-Host ""

if ($DryRun) {
    Write-Host "This was a DRY RUN - no files were actually modified." -ForegroundColor Yellow
    Write-Host "Run without -DryRun to apply changes." -ForegroundColor Yellow
} else {
    Write-Host "✅ Renaming complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Rename directory structure:" -ForegroundColor White
    Write-Host "   composeApp/src/.../com/krieta → com/runinga" -ForegroundColor Gray
    Write-Host "2. Update Android package name in AndroidManifest.xml" -ForegroundColor White
    Write-Host "3. Update iOS bundle identifier" -ForegroundColor White
    Write-Host "4. Rebuild project: ./gradlew clean build" -ForegroundColor White
    Write-Host "5. Update app store listings" -ForegroundColor White
}

Write-Host ""
