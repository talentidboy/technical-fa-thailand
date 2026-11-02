-- รหัสสุ่มสำหรับลิงก์ตรวจสอบใบอนุญาตใน QR (แทนเลขลำดับที่ไล่เดาได้)
ALTER TABLE "coaches" ADD COLUMN "verify_token" TEXT;
UPDATE "coaches" SET "verify_token" = substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 16);
ALTER TABLE "coaches"
  ALTER COLUMN "verify_token" SET NOT NULL,
  ALTER COLUMN "verify_token" SET DEFAULT substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 16);

-- CreateIndex
CREATE UNIQUE INDEX "coaches_verify_token_key" ON "coaches"("verify_token");
