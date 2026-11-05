#!/bin/bash

# Wave 5 Deployment Script - Database Migrations
# This script runs all compliance-related database migrations

set -e  # Exit on error

echo "🚀 Starting Wave 5 Database Migrations..."
echo "=========================================="

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-runinga}"
DB_USER="${DB_USER:-postgres}"

echo "📊 Database: $DB_NAME@$DB_HOST:$DB_PORT"
echo ""

# Step 1: Backup database
echo "📦 Step 1: Creating database backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE
echo "✅ Backup created: $BACKUP_FILE"
echo ""

# Step 2: Run remove investment chama type migration
echo "🔄 Step 2: Removing INVESTMENT chama type..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/prisma/migrations/remove_investment_chama_type.sql
echo "✅ INVESTMENT chama type removed"
echo ""

# Step 3: Run compliance data migration
echo "🔄 Step 3: Running compliance data migration..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f backend/prisma/migrations/compliance_data_migration.sql
echo "✅ Compliance data migrated"
echo ""

# Step 4: Verify migrations
echo "🔍 Step 4: Verifying migrations..."

# Check transactions without context
MISSING_CONTEXT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM transactions WHERE context_type IS NULL;")
echo "Transactions without context: $MISSING_CONTEXT"

# Check users without risk profiles
MISSING_RISK=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"User\" WHERE id NOT IN (SELECT user_id FROM user_risk_profiles);")
echo "Users without risk profiles: $MISSING_RISK"

# Check users without withdrawal limits
MISSING_LIMITS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"User\" WHERE id NOT IN (SELECT user_id FROM withdrawal_limits);")
echo "Users without withdrawal limits: $MISSING_LIMITS"

# Check contests without validation
MISSING_VALIDATION=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM \"Contest\" WHERE is_legal_structure IS NULL;")
echo "Contests without validation: $MISSING_VALIDATION"

echo ""

if [ "$MISSING_CONTEXT" -eq 0 ] && [ "$MISSING_RISK" -eq 0 ] && [ "$MISSING_LIMITS" -eq 0 ] && [ "$MISSING_VALIDATION" -eq 0 ]; then
    echo "✅ All migrations verified successfully!"
else
    echo "⚠️  Some migrations incomplete. Review the counts above."
fi

echo ""
echo "=========================================="
echo "✅ Database migrations complete!"
echo ""
echo "Next steps:"
echo "1. Run: cd backend && npm run calculate-risk-scores"
echo "2. Deploy backend services"
echo "3. Deploy frontend updates"
echo ""
