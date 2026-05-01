# Fix marketplace.routes.ts query parameter array access
$file = "src/modules/marketplace/marketplace.routes.ts"

# Add import at the top
$content = Get-Content $file -Raw
if ($content -notmatch "getQueryString") {
    $content = $content -replace "(import \{ z \} from 'zod';)", "`$1`nimport { getQueryString } from '../../utils/queryParams.js';"
}

# Replace complex array access patterns with getQueryString
$content = $content -replace "String\(Array\.isArray\(Array\.isArray\(req\.query\.(\w+)\) \? req\.query\.\1\[0\] : req\.query\.\1\) \? req\.query\.\1\[0\] : req\.query\.\1 \|\| ''\)", "getQueryString(req.query.`$1) || ''"

Set-Content $file $content -NoNewline

Write-Host "Fixed marketplace.routes.ts query parameters"

# Fix user.routes.ts
$file2 = "src/modules/user/user.routes.ts"
$content2 = Get-Content $file2 -Raw

if ($content2 -notmatch "getQueryString") {
    $content2 = $content2 -replace "(import.*from.*auth)", "`$1`nimport { getQueryString } from '../../utils/queryParams.js';"
}

$content2 = $content2 -replace "String\(Array\.isArray\(Array\.isArray\(req\.query\.(\w+)\) \? req\.query\.\1\[0\] : req\.query\.\1\) \? req\.query\.\1\[0\] : req\.query\.\1 \|\| ''\)", "getQueryString(req.query.`$1) || ''"

Set-Content $file2 $content2 -NoNewline

Write-Host "Fixed user.routes.ts query parameters"
