-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RobloxLinkStatus" AS ENUM ('PENDING', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ModerationCaseType" AS ENUM ('WARNING', 'TIMEOUT', 'KICK', 'BAN', 'UNBAN', 'NOTE');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'CLAIMED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'VOIDED');

-- CreateEnum
CREATE TYPE "BotJobStatus" AS ENUM ('PENDING', 'CLAIMED', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "guilds" (
    "id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "icon_hash" VARCHAR(64),
    "installed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_settings" (
    "id" UUID NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'UTC',
    "locale" VARCHAR(16) NOT NULL DEFAULT 'en-US',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "guild_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(20) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "global_name" VARCHAR(100),
    "avatar_hash" VARCHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roblox_accounts" (
    "id" BIGINT NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roblox_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roblox_account_links" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "roblox_account_id" BIGINT NOT NULL,
    "status" "RobloxLinkStatus" NOT NULL DEFAULT 'PENDING',
    "verification_code_hash" VARCHAR(128) NOT NULL,
    "verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roblox_account_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_ranks" (
    "id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "level" INTEGER NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "department_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" UUID NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "department_id" UUID,
    "rank_id" UUID,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_permissions" (
    "id" UUID NOT NULL,
    "staff_member_id" UUID NOT NULL,
    "permission" VARCHAR(150) NOT NULL,
    "scope" VARCHAR(32) NOT NULL DEFAULT 'GUILD',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_cases" (
    "id" UUID NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "case_number" INTEGER NOT NULL,
    "type" "ModerationCaseType" NOT NULL,
    "target_discord_id" VARCHAR(20) NOT NULL,
    "actor_discord_id" VARCHAR(20) NOT NULL,
    "actor_user_id" VARCHAR(20),
    "reason" VARCHAR(2000),
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "moderation_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "ticket_number" INTEGER NOT NULL,
    "channel_id" VARCHAR(20),
    "opener_discord_id" VARCHAR(20) NOT NULL,
    "assigned_discord_id" VARCHAR(20),
    "title" VARCHAR(200) NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "closed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "applicant_id" VARCHAR(20) NOT NULL,
    "department_id" UUID,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "form_version" INTEGER NOT NULL DEFAULT 1,
    "answers" JSONB NOT NULL,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "user_id" VARCHAR(20) NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMPTZ(3),
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "actor_discord_id" VARCHAR(20),
    "action" VARCHAR(120) NOT NULL,
    "target_type" VARCHAR(80),
    "target_id" VARCHAR(100),
    "outcome" VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_workflows" (
    "id" UUID NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "definition" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "automation_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_jobs" (
    "id" UUID NOT NULL,
    "guild_id" VARCHAR(20) NOT NULL,
    "actor_discord_id" VARCHAR(20) NOT NULL,
    "idempotency_key" VARCHAR(128) NOT NULL,
    "action" VARCHAR(120) NOT NULL,
    "payload_version" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "status" "BotJobStatus" NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "available_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed_by" VARCHAR(120),
    "lease_expires_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "last_error_code" VARCHAR(80),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "bot_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guild_settings_guild_id_key" ON "guild_settings"("guild_id");

-- CreateIndex
CREATE INDEX "roblox_account_links_user_id_status_idx" ON "roblox_account_links"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "roblox_account_links_user_id_roblox_account_id_key" ON "roblox_account_links"("user_id", "roblox_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "roblox_account_links_roblox_account_id_key" ON "roblox_account_links"("roblox_account_id");

-- CreateIndex
CREATE INDEX "departments_guild_id_name_idx" ON "departments"("guild_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_guild_id_slug_key" ON "departments"("guild_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "department_ranks_department_id_level_key" ON "department_ranks"("department_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "department_ranks_department_id_name_key" ON "department_ranks"("department_id", "name");

-- CreateIndex
CREATE INDEX "staff_members_user_id_idx" ON "staff_members"("user_id");

-- CreateIndex
CREATE INDEX "staff_members_guild_id_department_id_status_idx" ON "staff_members"("guild_id", "department_id", "status");

-- CreateIndex
CREATE INDEX "staff_members_department_id_idx" ON "staff_members"("department_id");

-- CreateIndex
CREATE INDEX "staff_members_rank_id_idx" ON "staff_members"("rank_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_guild_id_user_id_key" ON "staff_members"("guild_id", "user_id");

-- CreateIndex
CREATE INDEX "staff_permissions_permission_scope_idx" ON "staff_permissions"("permission", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "staff_permissions_staff_member_id_permission_scope_key" ON "staff_permissions"("staff_member_id", "permission", "scope");

-- CreateIndex
CREATE INDEX "moderation_cases_guild_id_target_discord_id_created_at_idx" ON "moderation_cases"("guild_id", "target_discord_id", "created_at");

-- CreateIndex
CREATE INDEX "moderation_cases_guild_id_type_created_at_idx" ON "moderation_cases"("guild_id", "type", "created_at");

-- CreateIndex
CREATE INDEX "moderation_cases_actor_user_id_idx" ON "moderation_cases"("actor_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "moderation_cases_guild_id_case_number_key" ON "moderation_cases"("guild_id", "case_number");

-- CreateIndex
CREATE INDEX "tickets_guild_id_status_created_at_idx" ON "tickets"("guild_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_guild_id_ticket_number_key" ON "tickets"("guild_id", "ticket_number");

-- CreateIndex
CREATE INDEX "applications_guild_id_status_submitted_at_idx" ON "applications"("guild_id", "status", "submitted_at");

-- CreateIndex
CREATE INDEX "applications_applicant_id_created_at_idx" ON "applications"("applicant_id", "created_at");

-- CreateIndex
CREATE INDEX "applications_department_id_idx" ON "applications"("department_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "shifts_guild_id_user_id_status_idx" ON "shifts"("guild_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "shifts_user_id_idx" ON "shifts"("user_id");

-- CreateIndex
CREATE INDEX "shifts_guild_id_started_at_idx" ON "shifts"("guild_id", "started_at");

-- CreateIndex
CREATE INDEX "audit_logs_guild_id_created_at_idx" ON "audit_logs"("guild_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_guild_id_actor_discord_id_created_at_idx" ON "audit_logs"("guild_id", "actor_discord_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_guild_id_action_created_at_idx" ON "audit_logs"("guild_id", "action", "created_at");

-- CreateIndex
CREATE INDEX "automation_workflows_guild_id_enabled_idx" ON "automation_workflows"("guild_id", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "automation_workflows_guild_id_name_key" ON "automation_workflows"("guild_id", "name");

-- CreateIndex
CREATE INDEX "bot_jobs_status_available_at_idx" ON "bot_jobs"("status", "available_at");

-- CreateIndex
CREATE INDEX "bot_jobs_status_lease_expires_at_idx" ON "bot_jobs"("status", "lease_expires_at");

-- CreateIndex
CREATE INDEX "bot_jobs_guild_id_created_at_idx" ON "bot_jobs"("guild_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bot_jobs_guild_id_idempotency_key_key" ON "bot_jobs"("guild_id", "idempotency_key");

-- AddForeignKey
ALTER TABLE "guild_settings" ADD CONSTRAINT "guild_settings_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roblox_account_links" ADD CONSTRAINT "roblox_account_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roblox_account_links" ADD CONSTRAINT "roblox_account_links_roblox_account_id_fkey" FOREIGN KEY ("roblox_account_id") REFERENCES "roblox_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_ranks" ADD CONSTRAINT "department_ranks_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "department_ranks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_permissions" ADD CONSTRAINT "staff_permissions_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_cases" ADD CONSTRAINT "moderation_cases_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_workflows" ADD CONSTRAINT "automation_workflows_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_jobs" ADD CONSTRAINT "bot_jobs_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

