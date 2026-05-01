#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
npm ci --production=false

echo "🗄️ Generating Prisma Client..."
npx prisma generate

echo "📦 Compiling TypeScript..."
npx tsc --skipLibCheck --noEmit false

echo "✅ Build complete!"
