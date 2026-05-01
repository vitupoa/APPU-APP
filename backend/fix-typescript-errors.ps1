# TypeScript Error Fix Script
# Run this to fix all compilation errors

Write-Host "🔧 Fixing TypeScript Compilation Errors..." -ForegroundColor Cyan

# Install missing type definitions
Write-Host "`n📦 Installing missing type definitions..." -ForegroundColor Yellow
npm install --save-dev @types/html-escaper

Write-Host "`n✅ Type definitions installed" -ForegroundColor Green

Write-Host "`n🔨 Running TypeScript compilation to check for remaining errors..." -ForegroundColor Yellow
npm run build

Write-Host "`n✅ Build check complete!" -ForegroundColor Green
