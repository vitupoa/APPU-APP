-- CreateTable
CREATE TABLE "user_bookmarks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "collection_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_bookmarks_user_id_content_id_content_type_key" ON "user_bookmarks"("user_id", "content_id", "content_type");

-- CreateIndex
CREATE INDEX "user_bookmarks_user_id_content_type_idx" ON "user_bookmarks"("user_id", "content_type");

-- CreateIndex
CREATE INDEX "user_bookmarks_collection_id_idx" ON "user_bookmarks"("collection_id");
