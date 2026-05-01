# Fix TypeScript errors in backend
$ErrorActionPreference = "Stop"

Write-Host "Fixing TypeScript errors..." -ForegroundColor Cyan

# Fix 1: Replace incorrect Prisma imports
Write-Host "`n1. Fixing Prisma import paths..." -ForegroundColor Yellow
$files = Get-ChildItem -Path "src" -Include "*.ts" -Recurse -Exclude "generated\*"
$count1 = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix import paths
    $content = $content -replace "from '\.\.\/generated\/prisma'", "from '../generated/prisma/index.js'"
    $content = $content -replace "from '\.\.\/\.\.\/generated\/prisma'", "from '../../generated/prisma/index.js'"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        $count1++
    }
}
Write-Host "  Total files fixed: $count1" -ForegroundColor Cyan

# Fix 2: Replace req.user!.id with req.userId
Write-Host "`n2. Fixing req.user references..." -ForegroundColor Yellow
$count2 = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Replace req.user!.id with req.userId!
    $content = $content -replace "req\.user!.id", "req.userId!"
    # Replace req.user?.id with req.userId
    $content = $content -replace "req\.user\?\.id", "req.userId"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        $count2++
    }
}
Write-Host "  Total files fixed: $count2" -ForegroundColor Cyan

# Fix 3: Replace req.prisma with prisma from config
Write-Host "`n3. Fixing req.prisma references..." -ForegroundColor Yellow
$count3 = 0
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Check if file uses req.prisma
    if ($content -match "req\.prisma") {
        # Add import if not present
        if ($content -notmatch "import.*prisma.*from.*config/database") {
            $content = $content -replace "(import.*from 'express';)", "`$1`nimport { prisma } from '../../config/database.js';"
        }
        # Replace req.prisma with prisma
        $content = $content -replace "req\.prisma", "prisma"
    }
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        $count3++
    }
}
Write-Host "  Total files fixed: $count3" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Prisma imports fixed: $count1" -ForegroundColor Green
Write-Host "  req.user references fixed: $count2" -ForegroundColor Green
Write-Host "  req.prisma references fixed: $count3" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nDone! Run 'npm run build' to check for remaining errors." -ForegroundColor Cyan
