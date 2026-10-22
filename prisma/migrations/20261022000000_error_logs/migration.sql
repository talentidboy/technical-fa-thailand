-- CreateTable
CREATE TABLE "error_logs" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "digest" TEXT,
    "path" TEXT,
    "route_type" TEXT,
    "stack" TEXT,
    "user_agent" TEXT,
    "count" INTEGER NOT NULL DEFAULT 1,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "error_logs_last_seen_at_idx" ON "error_logs"("last_seen_at");
