-- AlterTable
ALTER TABLE "academies" ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "player_consent_at" TIMESTAMP(3),
ADD COLUMN     "player_consent_by" TEXT;

-- CreateTable
CREATE TABLE "academy_members" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "academy_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_staff" (
    "id" SERIAL NOT NULL,
    "academy_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "licence" TEXT,
    "coach_id" INTEGER,
    "phone" TEXT,
    "email" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_teams" (
    "id" SERIAL NOT NULL,
    "academy_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "age_group" INTEGER NOT NULL,
    "gender" TEXT NOT NULL DEFAULT 'MIXED',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_players" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "nickname" TEXT,
    "birth_date" TIMESTAMP(3),
    "position" TEXT NOT NULL,
    "shirt_no" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_applications" (
    "id" SERIAL NOT NULL,
    "academy_id" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "decided_at" TIMESTAMP(3),
    "decided_by" TEXT,
    "decision_note" TEXT,
    "licence_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_evidence" (
    "id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "criterion" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "review_note" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academy_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_documents" (
    "id" SERIAL NOT NULL,
    "academy_id" INTEGER NOT NULL,
    "evidence_id" INTEGER,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academy_notices" (
    "id" SERIAL NOT NULL,
    "academy_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "academy_notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academy_members_user_id_key" ON "academy_members"("user_id");

-- CreateIndex
CREATE INDEX "academy_members_academy_id_idx" ON "academy_members"("academy_id");

-- CreateIndex
CREATE INDEX "academy_staff_academy_id_idx" ON "academy_staff"("academy_id");

-- CreateIndex
CREATE INDEX "academy_teams_academy_id_idx" ON "academy_teams"("academy_id");

-- CreateIndex
CREATE INDEX "academy_players_team_id_idx" ON "academy_players"("team_id");

-- CreateIndex
CREATE INDEX "academy_applications_academy_id_idx" ON "academy_applications"("academy_id");

-- CreateIndex
CREATE INDEX "academy_applications_status_idx" ON "academy_applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "academy_evidence_application_id_criterion_key" ON "academy_evidence"("application_id", "criterion");

-- CreateIndex
CREATE INDEX "academy_documents_academy_id_idx" ON "academy_documents"("academy_id");

-- CreateIndex
CREATE INDEX "academy_documents_evidence_id_idx" ON "academy_documents"("evidence_id");

-- CreateIndex
CREATE INDEX "academy_notices_academy_id_read_at_idx" ON "academy_notices"("academy_id", "read_at");

-- AddForeignKey
ALTER TABLE "academy_members" ADD CONSTRAINT "academy_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_members" ADD CONSTRAINT "academy_members_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_staff" ADD CONSTRAINT "academy_staff_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_staff" ADD CONSTRAINT "academy_staff_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_teams" ADD CONSTRAINT "academy_teams_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_players" ADD CONSTRAINT "academy_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "academy_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_applications" ADD CONSTRAINT "academy_applications_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_evidence" ADD CONSTRAINT "academy_evidence_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "academy_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_documents" ADD CONSTRAINT "academy_documents_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_documents" ADD CONSTRAINT "academy_documents_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "academy_evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academy_notices" ADD CONSTRAINT "academy_notices_academy_id_fkey" FOREIGN KEY ("academy_id") REFERENCES "academies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
