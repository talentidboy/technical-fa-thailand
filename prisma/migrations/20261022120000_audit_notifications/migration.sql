-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_email" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "coach_id" INTEGER,
    "summary" TEXT NOT NULL,
    "details" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "href" TEXT,
    "key" TEXT,
    "emailed_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_coach_id_idx" ON "audit_logs"("coach_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_key_key" ON "notifications"("key");

-- CreateIndex
CREATE INDEX "notifications_coach_id_read_at_idx" ON "notifications"("coach_id", "read_at");

-- CreateIndex
CREATE INDEX "notifications_emailed_at_idx" ON "notifications"("emailed_at");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
