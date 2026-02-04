-- CreateEnum
CREATE TYPE "RevclawPlanStatus" AS ENUM ('DRAFT', 'APPROVED', 'EXECUTING', 'EXECUTED', 'CANCELED');

-- AlterEnum
ALTER TYPE "RevclawIntentKind" ADD VALUE 'PLAN_EXECUTE';

-- CreateTable
CREATE TABLE "revclaw_plans" (
    "id" TEXT NOT NULL,
    "installation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "RevclawPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "plan_json" JSONB NOT NULL,
    "plan_hash" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "supersedes_plan_id" TEXT,
    "execute_intent_id" TEXT,
    "approval_token_hash" TEXT,
    "approval_token_expires_at" TIMESTAMP(3),
    "approval_token_used_at" TIMESTAMP(3),
    "execution_result" JSONB,
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revclaw_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revclaw_plans_approval_token_hash_key" ON "revclaw_plans"("approval_token_hash");

-- CreateIndex
CREATE INDEX "revclaw_plans_installation_id_idx" ON "revclaw_plans"("installation_id");

-- CreateIndex
CREATE INDEX "revclaw_plans_user_id_idx" ON "revclaw_plans"("user_id");

-- CreateIndex
CREATE INDEX "revclaw_plans_status_idx" ON "revclaw_plans"("status");

-- AddForeignKey
ALTER TABLE "revclaw_plans" ADD CONSTRAINT "revclaw_plans_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "revclaw_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revclaw_plans" ADD CONSTRAINT "revclaw_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
