# Fix the invalid include syntax in contests.service.ts
$file = "src\modules\contests\contests.service.ts"
$content = Get-Content $file -Raw

# Fix first occurrence (line 216-217)
$content = $content -replace "displayName: true\s*\},\s*include: \{ user: true \}", "displayName: true`r`n                  }"

# Fix second occurrence (line 278-279)  
$content = $content -replace "displayName: true\s*\},\s*include: \{ user: true \}\s*\}", "displayName: true`r`n              }`r`n            }"

Set-Content $file $content -NoNewline
Write-Host "Fixed contests.service.ts"
