# Fix all incorrect Prisma import paths
Write-Host "🔧 Fixing Prisma import paths..." -ForegroundColor Cyan

$files = @(
    "src\modules\displayAds\nicheAdTargeting.service.ts",
    "src\modules\kyc\kyc.service.ts",
    "src\modules\kyc\withdrawal.service.ts",
    "src\modules\locations\locations.routes.ts",
    "src\modules\niches\niches.routes.ts",
    "src\modules\creatorBoost\creatorBoost.routes.ts",
    "src\modules\recommendation\services\contentDistribution.service.ts",
    "src\modules\recommendation\services\feedGeneration.service.ts",
    "src\services\analytics.service.ts",
    "src\services\nonce.service.ts",
    "src\types\express.d.ts",
    "src\workers\contentDistributionWorker.ts",
    "src\workers\microInterestWorker.ts",
    "src\workers\trendingTopicsWorker.ts"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "  Fixing $file..." -ForegroundColor Yellow
        
        $content = Get-Content $fullPath -Raw
        
        # Fix various incorrect import patterns
        $content = $content -replace "from '../generated/prisma/index.js'", "from '../../generated/prisma/client.js'"
        $content = $content -replace "from '../../generated/prisma/index.js'", "from '../../generated/prisma/client.js'"
        $content = $content -replace "from '../../../generated/prisma/client'", "from '../../../generated/prisma/client.js'"
        $content = $content -replace "from '../generated/prisma/client'", "from '../generated/prisma/client.js'"
        
        Set-Content $fullPath -Value $content -NoNewline
        Write-Host "  ✓ Fixed $file" -ForegroundColor Green
    }
}

Write-Host "`n✅ All Prisma import paths fixed!" -ForegroundColor Green
