-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."announcements" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "tag" TEXT,
    "author_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "link_url" TEXT,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."applications" (
    "id" SERIAL NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "course_session_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "note" TEXT,
    "license_record_id" INTEGER,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."coaches" (
    "id" SERIAL NOT NULL,
    "afc_id" TEXT,
    "name_th" TEXT NOT NULL,
    "surname_th" TEXT NOT NULL,
    "name_en" TEXT,
    "family_name_en" TEXT,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "id_number" TEXT,
    "passport_number" TEXT,
    "email" TEXT,
    "tel_no" TEXT,
    "nationality" TEXT,
    "residence" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "district_code" TEXT,
    "nationality_code" TEXT,
    "province_code" TEXT,
    "subdistrict_code" TEXT,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_sessions" (
    "id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "venue" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "application_deadline" TIMESTAMP(3),
    "capacity" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "application_open_date" TIMESTAMP(3),

    CONSTRAINT "course_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."courses" (
    "id" SERIAL NOT NULL,
    "license_type" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirement" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "course_type" TEXT NOT NULL DEFAULT 'LICENSE',

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employments" (
    "employment_id" SERIAL NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "club_name" TEXT NOT NULL,
    "division" TEXT,
    "position" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employments_pkey" PRIMARY KEY ("employment_id")
);

-- CreateTable
CREATE TABLE "public"."events" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "team_scope" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "source_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_all_stars" (
    "id" SERIAL NOT NULL,
    "stage" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "player_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "g15_all_stars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_awards" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "player_id" INTEGER,
    "official_id" INTEGER,
    "team_id" INTEGER,
    "note" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "g15_awards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_cards" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "holder_name" TEXT NOT NULL,
    "holder_number" INTEGER,
    "holder_role" TEXT NOT NULL DEFAULT 'PLAYER',
    "card_type" TEXT NOT NULL,
    "minute" INTEGER,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_minute" INTEGER,

    CONSTRAINT "g15_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_gallery_links" (
    "id" SERIAL NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'NATIONAL',
    "match_id" INTEGER,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cover_url" TEXT,

    CONSTRAINT "g15_gallery_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_goals" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER,
    "player_name" TEXT NOT NULL,
    "jersey_number" INTEGER,
    "minute" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assist_name" TEXT,
    "assist_player_id" INTEGER,
    "is_own_goal" BOOLEAN NOT NULL DEFAULT false,
    "added_minute" INTEGER,

    CONSTRAINT "g15_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_lineups" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STARTING',
    "is_captain" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "g15_lineups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_matches" (
    "id" SERIAL NOT NULL,
    "round" TEXT NOT NULL,
    "match_date" TIMESTAMP(3),
    "venue" TEXT,
    "home_team_id" INTEGER NOT NULL,
    "away_team_id" INTEGER NOT NULL,
    "home_score" INTEGER,
    "away_score" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assistant_referee_1" TEXT,
    "assistant_referee_2" TEXT,
    "first_half_away_score" INTEGER,
    "first_half_home_score" INTEGER,
    "fourth_official" TEXT,
    "general_coordinator" TEXT,
    "match_commissioner" TEXT,
    "referee" TEXT,
    "referee_assessor" TEXT,
    "second_half_away_score" INTEGER,
    "second_half_home_score" INTEGER,
    "away_penalty" INTEGER,
    "home_penalty" INTEGER,
    "match_no" INTEGER,
    "stage" TEXT NOT NULL DEFAULT 'REGIONAL',
    "clock_phase" TEXT NOT NULL DEFAULT 'PRE',
    "first_half_added_time" INTEGER,
    "first_half_ended_at" TIMESTAMP(3),
    "first_half_started_at" TIMESTAMP(3),
    "second_half_added_time" INTEGER,
    "second_half_ended_at" TIMESTAMP(3),
    "second_half_started_at" TIMESTAMP(3),
    "player_of_match_id" INTEGER,
    "assistant_general_coordinator" TEXT,
    "live_video_url" TEXT,

    CONSTRAINT "g15_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_officials" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "no" INTEGER,
    "first_name_th" TEXT NOT NULL,
    "last_name_th" TEXT NOT NULL,
    "first_name_en" TEXT,
    "last_name_en" TEXT,
    "gender" TEXT,
    "nationality" TEXT,
    "role" TEXT,
    "dob" TIMESTAMP(3),
    "coaching_license" TEXT,
    "id_card_number" TEXT,
    "passport_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "photo_url" TEXT,

    CONSTRAINT "g15_officials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_penalty_kicks" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "player_id" INTEGER,
    "player_name" TEXT,
    "scored" BOOLEAN NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "g15_penalty_kicks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_players" (
    "id" SERIAL NOT NULL,
    "team_id" INTEGER NOT NULL,
    "no" INTEGER,
    "first_name_th" TEXT NOT NULL,
    "last_name_th" TEXT NOT NULL,
    "first_name_en" TEXT,
    "last_name_en" TEXT,
    "nationality" TEXT,
    "jersey_name" TEXT,
    "jersey_number" INTEGER,
    "position" TEXT,
    "dob" TIMESTAMP(3),
    "weight_kg" DOUBLE PRECISION,
    "height_cm" DOUBLE PRECISION,
    "id_card_number" TEXT,
    "passport_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "photo_url" TEXT,

    CONSTRAINT "g15_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_substitutions" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "minute" INTEGER,
    "player_in_name" TEXT NOT NULL,
    "player_in_number" INTEGER,
    "player_out_name" TEXT NOT NULL,
    "player_out_number" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_minute" INTEGER,

    CONSTRAINT "g15_substitutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."g15_teams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "group_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "national_group" TEXT,
    "national_seed" INTEGER,

    CONSTRAINT "g15_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instructors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "tel_no" TEXT,
    "photo_url" TEXT,
    "affiliation" TEXT,
    "afc_instructor_id" TEXT,
    "max_level" TEXT,
    "teaches_core" BOOLEAN NOT NULL DEFAULT false,
    "teaches_goalkeeper" BOOLEAN NOT NULL DEFAULT false,
    "teaches_fitness" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."license_records" (
    "record_id" SERIAL NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "license_type" TEXT NOT NULL,
    "record_type" TEXT NOT NULL,
    "is_level_up" BOOLEAN NOT NULL DEFAULT false,
    "certificate_no" TEXT,
    "issue_date" TIMESTAMP(3),
    "expire_date" TIMESTAMP(3),
    "confirmed_by" TEXT,
    "instructor_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "license_records_pkey" PRIMARY KEY ("record_id")
);

-- CreateTable
CREATE TABLE "public"."license_renewals" (
    "id" SERIAL NOT NULL,
    "license_record_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_by_coach" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "evidence_url" TEXT,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "review_note" TEXT,
    "previous_expire_date" TIMESTAMP(3),
    "new_expire_date" TIMESTAMP(3),

    CONSTRAINT "license_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."play_and_learn_centers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "province_en" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coaches" TEXT NOT NULL,
    "coordinator" TEXT NOT NULL,
    "tel" TEXT NOT NULL,
    "schedule" TEXT,
    "register_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "play_and_learn_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."profile_edit_requests" (
    "id" SERIAL NOT NULL,
    "coach_id" INTEGER NOT NULL,
    "payload" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "profile_edit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" SERIAL NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_users" (
    "user_id" SERIAL NOT NULL,
    "coach_id" INTEGER,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "system_users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."training_articles" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "theme" TEXT,
    "age_group" TEXT,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "cover_image_url" TEXT,
    "author_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_articles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "applications_coach_id_course_session_id_key" ON "public"."applications"("coach_id" ASC, "course_session_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "applications_license_record_id_key" ON "public"."applications"("license_record_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "coaches_afc_id_key" ON "public"."coaches"("afc_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "courses_license_type_key" ON "public"."courses"("license_type" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "g15_all_stars_stage_slot_key" ON "public"."g15_all_stars"("stage" ASC, "slot" ASC);

-- CreateIndex
CREATE INDEX "g15_awards_key_idx" ON "public"."g15_awards"("key" ASC);

-- CreateIndex
CREATE INDEX "g15_gallery_links_stage_match_id_idx" ON "public"."g15_gallery_links"("stage" ASC, "match_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "g15_lineups_match_id_player_id_key" ON "public"."g15_lineups"("match_id" ASC, "player_id" ASC);

-- CreateIndex
CREATE INDEX "g15_penalty_kicks_match_id_order_idx" ON "public"."g15_penalty_kicks"("match_id" ASC, "order" ASC);

-- CreateIndex
CREATE INDEX "license_renewals_license_record_id_idx" ON "public"."license_renewals"("license_record_id" ASC);

-- CreateIndex
CREATE INDEX "license_renewals_status_idx" ON "public"."license_renewals"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "system_users_coach_id_key" ON "public"."system_users"("coach_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "system_users_email_key" ON "public"."system_users"("email" ASC);

-- AddForeignKey
ALTER TABLE "public"."announcements" ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."system_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_course_session_id_fkey" FOREIGN KEY ("course_session_id") REFERENCES "public"."course_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_license_record_id_fkey" FOREIGN KEY ("license_record_id") REFERENCES "public"."license_records"("record_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_sessions" ADD CONSTRAINT "course_sessions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employments" ADD CONSTRAINT "employments_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_all_stars" ADD CONSTRAINT "g15_all_stars_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."g15_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_awards" ADD CONSTRAINT "g15_awards_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "public"."g15_officials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_awards" ADD CONSTRAINT "g15_awards_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."g15_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_awards" ADD CONSTRAINT "g15_awards_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."g15_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_cards" ADD CONSTRAINT "g15_cards_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."g15_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_cards" ADD CONSTRAINT "g15_cards_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."g15_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_gallery_links" ADD CONSTRAINT "g15_gallery_links_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."g15_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_goals" ADD CONSTRAINT "g15_goals_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."g15_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_goals" ADD CONSTRAINT "g15_goals_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."g15_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_goals" ADD CONSTRAINT "g15_goals_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."g15_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_lineups" ADD CONSTRAINT "g15_lineups_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."g15_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_lineups" ADD CONSTRAINT "g15_lineups_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."g15_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_lineups" ADD CONSTRAINT "g15_lineups_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."g15_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_matches" ADD CONSTRAINT "g15_matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."g15_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_matches" ADD CONSTRAINT "g15_matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."g15_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_matches" ADD CONSTRAINT "g15_matches_player_of_match_id_fkey" FOREIGN KEY ("player_of_match_id") REFERENCES "public"."g15_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_officials" ADD CONSTRAINT "g15_officials_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."g15_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_penalty_kicks" ADD CONSTRAINT "g15_penalty_kicks_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."g15_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_players" ADD CONSTRAINT "g15_players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."g15_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_substitutions" ADD CONSTRAINT "g15_substitutions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."g15_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."g15_substitutions" ADD CONSTRAINT "g15_substitutions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."g15_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_records" ADD CONSTRAINT "license_records_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_records" ADD CONSTRAINT "license_records_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."license_renewals" ADD CONSTRAINT "license_renewals_license_record_id_fkey" FOREIGN KEY ("license_record_id") REFERENCES "public"."license_records"("record_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."profile_edit_requests" ADD CONSTRAINT "profile_edit_requests_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."system_users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."system_users" ADD CONSTRAINT "system_users_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "public"."coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."training_articles" ADD CONSTRAINT "training_articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."system_users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
