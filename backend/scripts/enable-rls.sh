#!/bin/bash

# KRIETA RLS Migration Script
# This script enables Row-Level Security on all sensitive tables

echo "🔒 Starting RLS Migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Run the migration
echo "📝 Applying RLS policies..."
psql "$DATABASE_URL" -f "$(dirname "$0")/../prisma/migrations/enable_row_level_security.sql"

if [ $? -eq 0 ]; then
    echo "✅ RLS migration completed successfully"
    
    # Verify RLS is enabled
    echo "🔍 Verifying RLS status..."
    psql "$DATABASE_URL" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'wallets', 'transactions', 'withdrawal_requests') ORDER BY tablename;"
    
    echo ""
    echo "✅ RLS is now enabled on all sensitive tables"
    echo "⚠️  IMPORTANT: You must update your application code to set the user context"
    echo "   See SECURITY_IMPLEMENTATION_GUIDE.md for details"
else
    echo "❌ RLS migration failed"
    exit 1
fi
