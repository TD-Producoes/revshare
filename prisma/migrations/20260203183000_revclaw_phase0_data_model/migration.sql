-- RevClaw Phase 0: Data Model Migration
-- Implements Telegram-first identity anchoring and bot delegation system

-- =============================================================================
-- RevClaw Enums
-- =============================================================================

-- CreateEnum: RevclawAgentStatus
CREATE TYPE "RevclawAgentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum: RevclawRegistrationStatus
CREATE TYPE "RevclawRegistrationStatus" AS ENUM ('PENDING', 'CLAIMED', 'EXPIRED', 'REVOKED');

-- CreateEnum: RevclawInstallationStatus
CREATE TYPE "RevclawInstallationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateEnum: RevclawIntentKind
CREATE TYPE "RevclawIntentKind" AS ENUM ('PROJECT_PUBLISH', 'APPLICATION_SUBMIT');

-- CreateEnum: RevclawIntentStatus
CREATE TYPE "RevclawIntentStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'DENIED', 'EXECUTED', 'EXPIRED');

-- =============================================================================
-- User Model Updates (Telegram-first identity anchoring)
-- =============================================================================

-- AlterTable: User - add telegram_user_id for Telegram identity anchor
ALTER TABLE "User" ADD COLUMN "telegram_user_id" TEXT;

-- AlterTable: User - add pending_email for unverified email
ALTER TABLE "User" ADD COLUMN "pending_email" TEXT;

-- AlterTable: User - make email optional for Telegram-first flow
-- Note: Existing users have email, new Telegram-first users may not
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex: unique telegram_user_id
CREATE UNIQUE INDEX "User_telegram_user_id_key" ON "User"("telegram_user_id");

-- CreateIndex: telegram_user_id lookup
CREATE INDEX "User_telegram_user_id_idx" ON "User"("telegram_user_id");

-- =============================================================================
-- RevClaw Agent Table
-- =============================================================================

-- CreateTable: revclaw_agents
CREATE TABLE "revclaw_agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manifest_url" TEXT,
    "manifest_snapshot" TEXT,
    "manifest_snapshot_hash" TEXT,
    "agent_secret_hash" TEXT NOT NULL,
    "identity_proof_url" TEXT,
    "metadata" JSONB,
    "status" "RevclawAgentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revclaw_agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: revclaw_agents status
CREATE INDEX "revclaw_agents_status_idx" ON "revclaw_agents"("status");

-- =============================================================================
-- RevClaw Registration Table (pending claim/approval)
-- =============================================================================

-- CreateTable: revclaw_registrations
CREATE TABLE "revclaw_registrations" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "requested_scopes" TEXT[],
    "status" "RevclawRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "claimed_at" TIMESTAMP(3),
    "claimed_by_user_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revclaw_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: revclaw_registrations claim_id unique
CREATE UNIQUE INDEX "revclaw_registrations_claim_id_key" ON "revclaw_registrations"("claim_id");

-- CreateIndex: revclaw_registrations agent_id
CREATE INDEX "revclaw_registrations_agent_id_idx" ON "revclaw_registrations"("agent_id");

-- CreateIndex: revclaw_registrations claim_id lookup
CREATE INDEX "revclaw_registrations_claim_id_idx" ON "revclaw_registrations"("claim_id");

-- CreateIndex: revclaw_registrations status
CREATE INDEX "revclaw_registrations_status_idx" ON "revclaw_registrations"("status");

-- CreateIndex: revclaw_registrations expires_at (for cleanup)
CREATE INDEX "revclaw_registrations_expires_at_idx" ON "revclaw_registrations"("expires_at");

-- AddForeignKey: revclaw_registrations -> revclaw_agents
ALTER TABLE "revclaw_registrations" ADD CONSTRAINT "revclaw_registrations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "revclaw_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- RevClaw Installation Table (agent ↔ user binding)
-- =============================================================================

-- CreateTable: revclaw_installations
CREATE TABLE "revclaw_installations" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "granted_scopes" TEXT[],
    "require_approval_for_publish" BOOLEAN NOT NULL DEFAULT true,
    "require_approval_for_apply" BOOLEAN NOT NULL DEFAULT true,
    "daily_apply_limit" INTEGER,
    "allowed_categories" TEXT[],
    "refresh_token_hash" TEXT,
    "refresh_token_version" INTEGER NOT NULL DEFAULT 1,
    "last_token_issued_at" TIMESTAMP(3),
    "status" "RevclawInstallationStatus" NOT NULL DEFAULT 'ACTIVE',
    "revoked_at" TIMESTAMP(3),
    "revoke_reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revclaw_installations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: revclaw_installations unique agent-user pair
CREATE UNIQUE INDEX "revclaw_installations_agent_id_user_id_key" ON "revclaw_installations"("agent_id", "user_id");

-- CreateIndex: revclaw_installations agent_id
CREATE INDEX "revclaw_installations_agent_id_idx" ON "revclaw_installations"("agent_id");

-- CreateIndex: revclaw_installations user_id
CREATE INDEX "revclaw_installations_user_id_idx" ON "revclaw_installations"("user_id");

-- CreateIndex: revclaw_installations status
CREATE INDEX "revclaw_installations_status_idx" ON "revclaw_installations"("status");

-- AddForeignKey: revclaw_installations -> revclaw_agents
ALTER TABLE "revclaw_installations" ADD CONSTRAINT "revclaw_installations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "revclaw_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: revclaw_installations -> User
ALTER TABLE "revclaw_installations" ADD CONSTRAINT "revclaw_installations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- RevClaw Intent Table (proposed actions requiring approval)
-- =============================================================================

-- CreateTable: revclaw_intents
CREATE TABLE "revclaw_intents" (
    "id" TEXT NOT NULL,
    "installation_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "on_behalf_of_user_id" TEXT NOT NULL,
    "kind" "RevclawIntentKind" NOT NULL,
    "payload_json" JSONB NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" "RevclawIntentStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approved_at" TIMESTAMP(3),
    "approved_payload_hash" TEXT,
    "denied_at" TIMESTAMP(3),
    "deny_reason" TEXT,
    "executed_at" TIMESTAMP(3),
    "execution_result" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revclaw_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: revclaw_intents idempotency per installation
CREATE UNIQUE INDEX "revclaw_intents_idempotency_key_installation_id_key" ON "revclaw_intents"("idempotency_key", "installation_id");

-- CreateIndex: revclaw_intents installation_id
CREATE INDEX "revclaw_intents_installation_id_idx" ON "revclaw_intents"("installation_id");

-- CreateIndex: revclaw_intents agent_id
CREATE INDEX "revclaw_intents_agent_id_idx" ON "revclaw_intents"("agent_id");

-- CreateIndex: revclaw_intents on_behalf_of_user_id
CREATE INDEX "revclaw_intents_on_behalf_of_user_id_idx" ON "revclaw_intents"("on_behalf_of_user_id");

-- CreateIndex: revclaw_intents status
CREATE INDEX "revclaw_intents_status_idx" ON "revclaw_intents"("status");

-- CreateIndex: revclaw_intents kind
CREATE INDEX "revclaw_intents_kind_idx" ON "revclaw_intents"("kind");

-- CreateIndex: revclaw_intents expires_at (for cleanup)
CREATE INDEX "revclaw_intents_expires_at_idx" ON "revclaw_intents"("expires_at");

-- AddForeignKey: revclaw_intents -> revclaw_installations
ALTER TABLE "revclaw_intents" ADD CONSTRAINT "revclaw_intents_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "revclaw_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: revclaw_intents -> revclaw_agents
ALTER TABLE "revclaw_intents" ADD CONSTRAINT "revclaw_intents_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "revclaw_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: revclaw_intents -> User
ALTER TABLE "revclaw_intents" ADD CONSTRAINT "revclaw_intents_on_behalf_of_user_id_fkey" FOREIGN KEY ("on_behalf_of_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- Audit Log Table (tamper-evident, hash-chained)
-- =============================================================================

-- CreateTable: audit_logs
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "sequence" BIGSERIAL NOT NULL,
    "performed_by_agent_id" TEXT,
    "on_behalf_of_user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "request_id" TEXT,
    "idempotency_key" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "payload" JSONB,
    "previous_hash" TEXT,
    "entry_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: audit_logs sequence unique (for hash chaining)
CREATE UNIQUE INDEX "audit_logs_sequence_key" ON "audit_logs"("sequence");

-- CreateIndex: audit_logs performed_by_agent_id
CREATE INDEX "audit_logs_performed_by_agent_id_idx" ON "audit_logs"("performed_by_agent_id");

-- CreateIndex: audit_logs on_behalf_of_user_id
CREATE INDEX "audit_logs_on_behalf_of_user_id_idx" ON "audit_logs"("on_behalf_of_user_id");

-- CreateIndex: audit_logs action
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex: audit_logs resource lookup
CREATE INDEX "audit_logs_resource_type_resource_id_idx" ON "audit_logs"("resource_type", "resource_id");

-- CreateIndex: audit_logs created_at (for time-based queries)
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex: audit_logs sequence (for hash chain verification)
CREATE INDEX "audit_logs_sequence_idx" ON "audit_logs"("sequence");

-- AddForeignKey: audit_logs -> revclaw_agents (SetNull on delete to preserve audit history)
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_agent_id_fkey" FOREIGN KEY ("performed_by_agent_id") REFERENCES "revclaw_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: audit_logs -> User (SetNull on delete to preserve audit history)
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_on_behalf_of_user_id_fkey" FOREIGN KEY ("on_behalf_of_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
