#!/bin/bash

# Fix Prisma model names from camelCase to snake_case for models that don't use camelCase mapping

# Fix prisma model accessor names
find src -type f -name "*.ts" -exec sed -i 's/prisma\.withdrawalRequest\./prisma.withdrawal_requests./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.kYCDocument\./prisma.kyc_documents./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.withdrawalLimit\./prisma.withdrawal_limits./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.suspiciousActivity\./prisma.suspicious_activities./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.auditLog\./prisma.audit_logs./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.platformConfig\./prisma.platform_config./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.prohibitedName\./prisma.prohibited_names./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.reservedUsername\./prisma.reserved_usernames./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.refresh_token\./prisma.refresh_tokens./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.userSuspension\./prisma.user_suspensions./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.contentModerationLog\./prisma.content_moderation_logs./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.featureFlag\./prisma.feature_flags./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.platformAnnouncement\./prisma.platform_announcements./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.escrow\./prisma.escrows./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.short\./prisma.shorts./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.product\./prisma.products./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.transaction\./prisma.transactions./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.userSessionSecret\./prisma.user_session_secrets./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.transactionNonce\./prisma.transaction_nonces./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/prisma\.platformWallet\./prisma.platform_wallet./g' {} +

# Fix tx (transaction context) model accessor names
find src -type f -name "*.ts" -exec sed -i 's/tx\.wallet\./tx.wallets./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/tx\.transaction\./tx.transactions./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/tx\.transactionNonce\./tx.transaction_nonces./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/tx\.withdrawalRequest\./tx.withdrawal_requests./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/tx\.userSuspension\./tx.user_suspensions./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/tx\.escrow\./tx.escrows./g' {} +
find src -type f -name "*.ts" -exec sed -i 's/tx\.message\./tx.messages./g' {} +

echo "Fixed Prisma model names"
