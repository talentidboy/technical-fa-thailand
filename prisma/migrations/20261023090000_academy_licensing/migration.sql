-- CreateTable
CREATE TABLE "academies" (
    "id" SERIAL NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_th" TEXT,
    "aliases" TEXT,
    "province" TEXT,
    "address" TEXT,
    "parent_club" TEXT,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_licences" (
    "id" SERIAL NOT NULL,
    "academy_id" INTEGER NOT NULL,
    "level" TEXT,
    "tier" TEXT,
    "licence_no" TEXT,
    "registry_no" INTEGER,
    "approved_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_licences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academies_province_idx" ON "academies"("province");

-- CreateIndex
CREATE INDEX "academy_licences_academy_id_idx" ON "academy_licences"("academy_id");

-- AddForeignKey
ALTER TABLE "academy_licences" ADD CONSTRAINT "academy_licences_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
