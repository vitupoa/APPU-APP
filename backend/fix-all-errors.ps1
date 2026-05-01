# Comprehensive TypeScript Error Fix Script
$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Comprehensive TypeScript Error Fixer" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Helper function to safely get string from query param
$helperFunction = @"

// Helper to safely extract string from query parameter
function getQueryParam(param: string | string[] | undefined): string | undefined {
  if (Array.isArray(param)) return param[0];
  return param;
}
"@

# Fix 1: Add helper function to route files that need it
Write-Host "`n[1/6] Adding query parameter helper functions..." -ForegroundColor Yellow
$routeFiles = Get-ChildItem -Path "src" -Include "*.routes.ts" -Recurse
$count1 = 0

foreach ($file in $routeFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file uses req.query and doesn't have helper
    if ($content -match "req\.query\." -and $content -notmatch "getQueryParam") {
        # Add helper after imports
        $content = $content -replace "(import.*;\r?\n)(\r?\n)(const router)", "`$1`$2$helperFunction`$2`$3"
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Added helper to: $($file.Name)" -ForegroundColor Green
        $count1++
    }
}
Write-Host "  Files updated: $count1" -ForegroundColor Cyan

# Fix 2: Replace direct parseInt/parseFloat with helper
Write-Host "`n[2/6] Fixing parseInt/parseFloat calls..." -ForegroundColor Yellow
$count2 = 0

foreach ($file in $routeFiles) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix parseInt(req.query.param)
    $content = $content -replace "parseInt\(req\.query\.(\w+)\)", "parseInt(getQueryParam(req.query.`$1) || '0')"
    
    # Fix parseFloat(req.query.param)
    $content = $content -replace "parseFloat\(req\.query\.(\w+)\)", "parseFloat(getQueryParam(req.query.`$1) || '0')"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        $count2++
    }
}
Write-Host "  Files updated: $count2" -ForegroundColor Cyan

# Fix 3: Add return statements after res.json()
Write-Host "`n[3/6] Adding missing return statements..." -ForegroundColor Yellow
$count3 = 0

foreach ($file in $routeFiles) {
    $lines = Get-Content $file.FullName
    $modified = $false
    $newLines = @()
    
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        $newLines += $line
        
        # If line ends with res.json() or res.status().json() and next line is not return/catch/}
        if ($line -match "res\.(json|status\(\d+\)\.json)\([^;]*\);$") {
            if ($i + 1 -lt $lines.Count) {
                $nextLine = $lines[$i + 1].Trim()
                if ($nextLine -ne "" -and $nextLine -notmatch "^(return|catch|})" -and $nextLine -notmatch "^//") {
                    # Get indentation from current line
                    if ($line -match "^(\s+)") {
                        $indent = $Matches[1]
                    } else {
                        $indent = "    "
                    }
                    $newLines += "${indent}return;"
                    $modified = $true
                }
            }
        }
    }
    
    if ($modified) {
        Set-Content -Path $file.FullName -Value $newLines
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        $count3++
    }
}
Write-Host "  Files updated: $count3" -ForegroundColor Cyan

# Fix 4: Fix schema field names
Write-Host "`n[4/6] Fixing schema field names..." -ForegroundColor Yellow
$serviceFiles = Get-ChildItem -Path "src" -Include "*.service.ts","*.routes.ts" -Recurse
$count4 = 0

foreach ($file in $serviceFiles) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix common schema mismatches
    $content = $content -replace "viewsCount:", "views:"
    $content = $content -replace "\.viewsCount", ".views"
    $content = $content -replace "prizeKr:", "prizeTotalKr:"
    $content = $content -replace "\.prizeKr", ".prizeTotalKr"
    $content = $content -replace "participantsCount:", "totalParticipants:"
    $content = $content -replace "\.participantsCount", ".totalParticipants"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        $count4++
    }
}
Write-Host "  Files updated: $count4" -ForegroundColor Cyan

# Fix 5: Add type annotations for implicit any
Write-Host "`n[5/6] Adding type annotations..." -ForegroundColor Yellow
$count5 = 0

foreach ($file in $serviceFiles) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Fix common implicit any patterns
    $content = $content -replace "\.map\((\w+) =>", ".map((`$1: any) =>"
    $content = $content -replace "\.filter\((\w+) =>", ".filter((`$1: any) =>"
    $content = $content -replace "\.reduce\((\w+),", ".reduce((`$1: any),"
    $content = $content -replace "\.forEach\((\w+) =>", ".forEach((`$1: any) =>"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        $count5++
    }
}
Write-Host "  Files updated: $count5" -ForegroundColor Cyan

# Fix 6: Fix missing includes in Prisma queries
Write-Host "`n[6/6] Fixing Prisma query includes..." -ForegroundColor Yellow
$count6 = 0

foreach ($file in $serviceFiles) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Add include for user relation when selecting creator/host
    $content = $content -replace "select:\s*\{([^}]*creator[^}]*)\}", "select: {`$1},`n      include: { user: true }"
    $content = $content -replace "select:\s*\{([^}]*host[^}]*)\}", "select: {`$1},`n      include: { host: true }"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        $count6++
    }
}
Write-Host "  Files updated: $count6" -ForegroundColor Cyan

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  Helper functions added: $count1" -ForegroundColor Green
Write-Host "  parseInt/parseFloat fixed: $count2" -ForegroundColor Green
Write-Host "  Return statements added: $count3" -ForegroundColor Green
Write-Host "  Schema fields fixed: $count4" -ForegroundColor Green
Write-Host "  Type annotations added: $count5" -ForegroundColor Green
Write-Host "  Prisma includes fixed: $count6" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nRun 'npm run build' to check remaining errors." -ForegroundColor Cyan
