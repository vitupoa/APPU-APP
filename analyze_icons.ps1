# Material Icons Usage Analyzer
# This script identifies all Material Icons Extended usages in the codebase

Write-Host "=== Material Icons Extended Usage Analyzer ===" -ForegroundColor Cyan
Write-Host ""

$projectRoot = "c:\Users\ADMIN\Krieta\composeApp\src\commonMain\kotlin"
$outputFile = "c:\Users\ADMIN\Krieta\icon_migration_report.txt"

# Initialize counters
$totalFiles = 0
$totalIconsUsages = 0
$iconUsages = @{}

Write-Host "Scanning files..." -ForegroundColor Yellow

# Find all Kotlin files with Material Icons imports
$files = Get-ChildItem -Path $projectRoot -Filter "*.kt" -Recurse | 
    Where-Object { (Select-String -Path $_.FullName -Pattern "androidx.compose.material.icons" -Quiet) }

$totalFiles = $files.Count
Write-Host "Found $totalFiles files using Material Icons Extended" -ForegroundColor Green
Write-Host ""

# Analyze each file
$report = @()
$report += "=" * 80
$report += "MATERIAL ICONS EXTENDED MIGRATION REPORT"
$report += "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$report += "=" * 80
$report += ""
$report += "SUMMARY"
$report += "-" * 80
$report += "Total files requiring migration: $totalFiles"
$report += ""

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace($projectRoot, "").TrimStart('\')
    $content = Get-Content $file.FullName -Raw
    
    # Count icon usages
    $iconMatches = [regex]::Matches($content, 'Icons\.(Filled|Outlined|Rounded|Sharp|TwoTone)\.(\w+)')
    
    if ($iconMatches.Count -gt 0) {
        $totalIconsUsages += $iconMatches.Count
        
        $report += ""
        $report += "FILE: $relativePath"
        $report += "  Icon usages: $($iconMatches.Count)"
        $report += "  Icons used:"
        
        $fileIcons = @{}
        foreach ($match in $iconMatches) {
            $iconName = "$($match.Groups[1].Value).$($match.Groups[2].Value)"
            if ($fileIcons.ContainsKey($iconName)) {
                $fileIcons[$iconName]++
            } else {
                $fileIcons[$iconName] = 1
            }
            
            if ($iconUsages.ContainsKey($iconName)) {
                $iconUsages[$iconName]++
            } else {
                $iconUsages[$iconName] = 1
            }
        }
        
        foreach ($icon in $fileIcons.Keys | Sort-Object) {
            $report += "    - $icon (used $($fileIcons[$icon]) times)"
        }
    }
}

$report += ""
$report += "=" * 80
$report += "ICON USAGE STATISTICS"
$report += "-" * 80
$report += "Total icon usages: $totalIconsUsages"
$report += "Unique icons: $($iconUsages.Keys.Count)"
$report += ""
$report += "Most used icons:"

$topIcons = $iconUsages.GetEnumerator() | Sort-Object -Property Value -Descending | Select-Object -First 20
foreach ($icon in $topIcons) {
    $report += "  $($icon.Value)x - $($icon.Key)"
}

$report += ""
$report += "=" * 80
$report += "MIGRATION CHECKLIST"
$report += "-" * 80
$report += ""
$report += "1. Download $($iconUsages.Keys.Count) unique icons from Material Symbols"
$report += "2. Place SVG files in: composeApp/src/commonMain/composeResources/drawable/"
$report += "3. Update $totalFiles Kotlin files"
$report += "4. Replace $totalIconsUsages icon usages"
$report += "5. Test all screens"
$report += "6. Verify APK size reduction (~8-12MB)"
$report += ""
$report += "=" * 80
$report += "REQUIRED ICON DOWNLOADS"
$report += "-" * 80
$report += ""

foreach ($icon in $iconUsages.Keys | Sort-Object) {
    $iconParts = $icon -split '\.'
    $style = $iconParts[0].ToLower()
    $name = $iconParts[1]
    
    # Convert to snake_case
    $snakeName = [regex]::Replace($name, '([a-z])([A-Z])', '$1_$2').ToLower()
    
    if ($style -eq "outlined") {
        $report += "ic_${snakeName}_outlined.xml"
    } else {
        $report += "ic_${snakeName}.xml"
    }
}

$report += ""
$report += "=" * 80
$report += "END OF REPORT"
$report += "=" * 80

# Save report
$report | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "Report saved to: $outputFile" -ForegroundColor Green
Write-Host ""
Write-Host "SUMMARY:" -ForegroundColor Cyan
Write-Host "  Files to migrate: $totalFiles" -ForegroundColor Yellow
Write-Host "  Icon usages: $totalIconsUsages" -ForegroundColor Yellow
Write-Host "  Unique icons: $($iconUsages.Keys.Count)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review the report: $outputFile"
Write-Host "  2. Download required icons from https://fonts.google.com/icons"
Write-Host "  3. Follow MATERIAL_ICONS_MIGRATION.md guide"
Write-Host ""
