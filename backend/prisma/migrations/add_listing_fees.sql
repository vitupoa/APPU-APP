-- CreateTable
CREATE TABLE "listing_fee_config" (
    "id" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT false,
    "scope" "TargetingScope" NOT NULL,
    "scope_value" TEXT,
    "category" "ProductCategory",
    "base_fee_kr" DECIMAL(18,4) NOT NULL,
    "daily_free_quota" INTEGER NOT NULL DEFAULT 0,
    "weekly_free_quota" INTEGER NOT NULL DEFAULT 0,
    "monthly_free_quota" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_fee_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_listing_quota" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "daily_used" INTEGER NOT NULL DEFAULT 0,
    "weekly_used" INTEGER NOT NULL DEFAULT 0,
    "monthly_used" INTEGER NOT NULL DEFAULT 0,
    "last_daily_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_weekly_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_monthly_reset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_listing_quota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_fee_transaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "location_scope" "TargetingScope" NOT NULL,
    "location_value" TEXT,
    "fee_kr" DECIMAL(18,4) NOT NULL,
    "was_free" BOOLEAN NOT NULL DEFAULT false,
    "quota_type" TEXT,
    "transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_fee_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "listing_fee_config_scope_scope_value_category_key" ON "listing_fee_config"("scope", "scope_value", "category");

-- CreateIndex
CREATE INDEX "listing_fee_config_scope_priority_idx" ON "listing_fee_config"("scope", "priority");

-- CreateIndex
CREATE INDEX "listing_fee_config_is_enabled_is_active_idx" ON "listing_fee_config"("is_enabled", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "user_listing_quota_user_id_key" ON "user_listing_quota"("user_id");

-- CreateIndex
CREATE INDEX "user_listing_quota_user_id_idx" ON "user_listing_quota"("user_id");

-- CreateIndex
CREATE INDEX "listing_fee_transaction_user_id_created_at_idx" ON "listing_fee_transaction"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "listing_fee_transaction_product_id_idx" ON "listing_fee_transaction"("product_id");

-- CreateIndex
CREATE INDEX "listing_fee_transaction_was_free_idx" ON "listing_fee_transaction"("was_free");

-- Insert platform wallet for listing fees
INSERT INTO "platform_wallet" ("id", "label", "kr_balance", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'LISTING_FEES', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (label) DO NOTHING;
