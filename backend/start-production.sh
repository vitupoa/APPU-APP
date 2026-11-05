#!/bin/bash
set -e

echo "🚀 Starting Runinga Backend..."

# Run RLS migration (non-blocking)
echo "📦 Running RLS migration..."
npm run migrate:rls || echo "⚠️  RLS migration failed, continuing..."

# Start the application
echo "🎯 Starting application..."
exec npm run start
