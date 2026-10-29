-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MAHASISWA',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "avatar_url" TEXT,
    "language" TEXT NOT NULL DEFAULT 'id',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "whatsapp" TEXT,
    "reject_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Canteen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "banner_url" TEXT,
    "qris_image_url" TEXT,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "queue_prefix" TEXT NOT NULL DEFAULT 'A',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Canteen_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canteen_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photo_url" TEXT,
    "price" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Makanan',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "is_bestseller" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "MenuItem_canteen_id_fkey" FOREIGN KEY ("canteen_id") REFERENCES "Canteen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canteen_id" TEXT NOT NULL,
    "buyer_id" TEXT NOT NULL,
    "queue_number" TEXT NOT NULL,
    "total_price" INTEGER NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'QRIS',
    "payment_proof_url" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'BELUM_DIBAYAR',
    "order_status" TEXT NOT NULL DEFAULT 'ANTRIAN',
    "can_pickup" BOOLEAN NOT NULL DEFAULT false,
    "estimated_minutes" INTEGER NOT NULL DEFAULT 15,
    "ordered_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "picked_up_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Order_canteen_id_fkey" FOREIGN KEY ("canteen_id") REFERENCES "Canteen" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "menu_item_id" TEXT,
    "name_snapshot" TEXT NOT NULL,
    "price_snapshot" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderItem_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "MenuItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CanteenBan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canteen_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CanteenBan_canteen_id_fkey" FOREIGN KEY ("canteen_id") REFERENCES "Canteen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CanteenBan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Favorite" (
    "user_id" TEXT NOT NULL,
    "canteen_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "canteen_id"),
    CONSTRAINT "Favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Favorite_canteen_id_fkey" FOREIGN KEY ("canteen_id") REFERENCES "Canteen" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporter_id" TEXT NOT NULL,
    "reporter_role" TEXT NOT NULL,
    "canteen_id" TEXT,
    "order_id" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "attachment_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BARU',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "Complaint_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Complaint_canteen_id_fkey" FOREIGN KEY ("canteen_id") REFERENCES "Canteen" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Complaint_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ComplaintMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "complaint_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ComplaintMessage_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "Complaint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ComplaintMessage_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QueueCounter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canteen_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Canteen_owner_id_key" ON "Canteen"("owner_id");

-- CreateIndex
CREATE INDEX "Canteen_is_open_idx" ON "Canteen"("is_open");

-- CreateIndex
CREATE INDEX "MenuItem_canteen_id_is_available_idx" ON "MenuItem"("canteen_id", "is_available");

-- CreateIndex
CREATE INDEX "MenuItem_canteen_id_category_idx" ON "MenuItem"("canteen_id", "category");

-- CreateIndex
CREATE INDEX "Order_canteen_id_ordered_at_idx" ON "Order"("canteen_id", "ordered_at");

-- CreateIndex
CREATE INDEX "Order_buyer_id_ordered_at_idx" ON "Order"("buyer_id", "ordered_at");

-- CreateIndex
CREATE INDEX "CanteenBan_canteen_id_idx" ON "CanteenBan"("canteen_id");

-- CreateIndex
CREATE UNIQUE INDEX "CanteenBan_canteen_id_user_id_key" ON "CanteenBan"("canteen_id", "user_id");

-- CreateIndex
CREATE INDEX "SearchHistory_user_id_created_at_idx" ON "SearchHistory"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "Complaint_status_created_at_idx" ON "Complaint"("status", "created_at");

-- CreateIndex
CREATE INDEX "QueueCounter_canteen_id_idx" ON "QueueCounter"("canteen_id");

-- CreateIndex
CREATE UNIQUE INDEX "QueueCounter_canteen_id_date_key" ON "QueueCounter"("canteen_id", "date");
