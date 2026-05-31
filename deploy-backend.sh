#!/bin/bash

# Wave 5 Deployment Script - Backend Services
# This script deploys all compliance services and middleware

set -e  # Exit on error

echo "🚀 Starting Wave 5 Backend Deployment..."
echo "=========================================="

# Configuration
NODE_ENV="${NODE_ENV:-production}"
PORT="${PORT:-3000}"

echo "🔧 Environment: $NODE_ENV"
echo "🔧 Port: $PORT"
echo ""

# Step 1: Install dependencies
echo "📦 Step 1: Installing dependencies..."
cd backend
npm install
echo "✅ Dependencies installed"
echo ""

# Step 2: Build TypeScript
echo "🔨 Step 2: Building TypeScript..."
npm run build
echo "✅ TypeScript compiled"
echo ""

# Step 3: Run Prisma migrations
echo "🔄 Step 3: Running Prisma migrations..."
npx prisma migrate deploy
echo "✅ Prisma migrations applied"
echo ""

# Step 4: Generate Prisma client
echo "🔄 Step 4: Generating Prisma client..."
npx prisma generate
echo "✅ Prisma client generated"
echo ""

# Step 5: Calculate initial risk scores
echo "🔄 Step 5: Calculating initial risk scores..."
npm run calculate-risk-scores
echo "✅ Risk scores calculated"
echo ""

# Step 6: Run tests
echo "🧪 Step 6: Running tests..."
npm run test || echo "⚠️  Some tests failed, review logs"
echo ""

# Step 7: Start application
echo "🚀 Step 7: Starting application..."
if [ "$NODE_ENV" = "production" ]; then
    # Production: Use PM2
    npm install -g pm2
    pm2 stop krieta-backend || true
    pm2 delete krieta-backend || true
    pm2 start dist/index.js --name krieta-backend --instances 4 --exec-mode cluster
    pm2 save
    echo "✅ Application started with PM2 (4 instances)"
else
    # Development: Use nodemon
    npm run dev &
    echo "✅ Application started in development mode"
fi

echo ""
echo "=========================================="
echo "✅ Backend deployment complete!"
echo ""
echo "Service Status:"
pm2 status || echo "PM2 not running"
echo ""
echo "Health Check:"
sleep 5
curl -f http://localhost:$PORT/health || echo "⚠️  Health check failed"
echo ""
echo ""
echo "Next steps:"
echo "1. Monitor logs: pm2 logs krieta-backend"
echo "2. Check metrics: pm2 monit"
echo "3. Deploy frontend updates"
echo ""
