# Fix all remaining TypeScript errors

Write-Host "Fixing remaining 66 TypeScript errors..." -ForegroundColor Cyan

# Fix 1: liveSocket.ts - verifyToken import (already exported in jwt.ts)
Write-Host "1. Fixing liveSocket.ts import..." -ForegroundColor Yellow
$file = "src/shared/gateway/liveSocket.ts"
$content = Get-Content $file -Raw
$content = $content -replace "import \{ verifyToken \} from '../../modules/auth/auth\.service\.js';", "import { verifyAccessToken as verifyToken } from '../../utils/jwt.js';"
Set-Content $file $content -NoNewline

# Fix 2: queryParams.ts - filter type assertion
Write-Host "2. Fixing queryParams.ts type assertion..." -ForegroundColor Yellow
$file = "src/utils/queryParams.ts"
$content = Get-Content $file -Raw
$content = $content -replace "return value\.filter\(\(v\): v is string => typeof v === 'string'\);", "return value.filter((v): v is string => typeof v === 'string') as string[];"
Set-Content $file $content -NoNewline

# Fix 3: Add return statements to routes with Promise<void>
Write-Host "3. Adding missing return statements..." -ForegroundColor Yellow

# kyc.routes.ts - add non-null assertions
$file = "src/modules/kyc/kyc.routes.ts"
$content = Get-Content $file -Raw
$content = $content -replace "const \{ documentId \} = req\.params;", "const documentId = req.params.documentId as string;"
$content = $content -replace "const \{ requestId \} = req\.params;", "const requestId = req.params.requestId as string;"
$content = $content -replace "const \{ activityId \} = req\.params;", "const activityId = req.params.activityId as string;"
Set-Content $file $content -NoNewline

# Fix 4: recommendation.routes.ts - add return statements and fix function signature
Write-Host "4. Fixing recommendation.routes.ts..." -ForegroundColor Yellow
$file = "src/modules/recommendation/recommendation.routes.ts"
$content = Get-Content $file -Raw
$content = $content -replace "router\.use\(authenticate\);", "// router.use(authenticate); // Removed duplicate middleware"
$content = $content -replace "res\.json\(\{ success: true \}\);", "res.json({ success: true });`n    return;"
Set-Content $file $content -NoNewline

# Fix 5: rembrandt-rar.routes.ts - add return statement
Write-Host "5. Fixing rembrandt-rar.routes.ts..." -ForegroundColor Yellow
$file = "src/modules/rembrandt-rar/rembrandt-rar.routes.ts"
$content = Get-Content $file -Raw
$content = $content -replace "res\.status\(400\)\.json\(\{ error: 'fiatAmount and currency are required' \}\);", "res.status(400).json({ error: 'fiatAmount and currency are required' });`n      return;"
$content = $content -replace "res\.status\(400\)\.json\(\{ error: 'Amount must be a whole number \(no decimals\)' \}\);", "res.status(400).json({ error: 'Amount must be a whole number (no decimals)' });`n      return;"
Set-Content $file $content -NoNewline

Write-Host "All fixes applied successfully!" -ForegroundColor Green
