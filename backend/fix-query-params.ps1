# Fix query parameter type errors
$ErrorActionPreference = "Stop"

Write-Host "Fixing query parameter type errors..." -ForegroundColor Cyan

# Get all route files
$routeFiles = Get-ChildItem -Path "src" -Include "*.routes.ts" -Recurse
$count = 0

foreach ($file in $routeFiles) {
    $content = Get-Content $file.FullName -Raw
    $original = $content
    
    # Pattern 1: parseInt(req.query.param)
    $content = $content -replace "parseInt\(req\.query\.(\w+)\)", "parseInt(Array.isArray(req.query.`$1) ? req.query.`$1[0] : req.query.`$1 || '0')"
    
    # Pattern 2: parseFloat(req.query.param)
    $content = $content -replace "parseFloat\(req\.query\.(\w+)\)", "parseFloat(Array.isArray(req.query.`$1) ? req.query.`$1[0] : req.query.`$1 || '0')"
    
    # Pattern 3: String(req.query.param)
    $content = $content -replace "String\(req\.query\.(\w+)\)", "String(Array.isArray(req.query.`$1) ? req.query.`$1[0] : req.query.`$1 || '')"
    
    # Pattern 4: req.query.param.toUpperCase()
    $content = $content -replace "req\.query\.(\w+)\.toUpperCase\(\)", "(Array.isArray(req.query.`$1) ? req.query.`$1[0] : req.query.`$1 || '').toUpperCase()"
    
    # Pattern 5: Direct usage in function calls - more aggressive
    # Match: someFunction(req.query.param, ...)
    $content = $content -replace "([a-zA-Z_]\w*)\(req\.query\.(\w+)([,\)])", "`$1(Array.isArray(req.query.`$2) ? req.query.`$2[0] : req.query.`$2`$3"
    
    if ($content -ne $original) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "  Fixed: $($file.Name)" -ForegroundColor Green
        $count++
    }
}

Write-Host "`nTotal files fixed: $count" -ForegroundColor Cyan
Write-Host "Run 'npm run build' to check remaining errors." -ForegroundColor Yellow
