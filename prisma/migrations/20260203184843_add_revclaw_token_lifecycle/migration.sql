-- CreateEnum
CREATE TYPE "RevclawExchangeCodeStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "RevclawTokenType" AS ENUM ('ACCESS', 'REFRESH');

-- CreateTable
CREATE TABLE "revclaw_exchange_codes" (
    "id" TEXT NOT NULL,
    "installation_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "scopes_snapshot" TEXT[],
    "status" "RevclawExchangeCodeStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revclaw_exchange_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revclaw_access_tokens" (
    "id" TEXT NOT NULL,
    "installation_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "token_type" "RevclawTokenType" NOT NULL,
    "scopes_snapshot" TEXT[],
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "parent_token_id" TEXT,
    "refreshed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revclaw_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revclaw_exchange_codes_code_hash_key" ON "revclaw_exchange_codes"("code_hash");

-- CreateIndex
CREATE INDEX "revclaw_exchange_codes_installation_id_idx" ON "revclaw_exchange_codes"("installation_id");

-- CreateIndex
CREATE INDEX "revclaw_exchange_codes_code_hash_idx" ON "revclaw_exchange_codes"("code_hash");

-- CreateIndex
CREATE INDEX "revclaw_exchange_codes_status_idx" ON "revclaw_exchange_codes"("status");

-- CreateIndex
CREATE INDEX "revclaw_exchange_codes_expires_at_idx" ON "revclaw_exchange_codes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "revclaw_access_tokens_token_hash_key" ON "revclaw_access_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "revclaw_access_tokens_installation_id_idx" ON "revclaw_access_tokens"("installation_id");

-- CreateIndex
CREATE INDEX "revclaw_access_tokens_token_hash_idx" ON "revclaw_access_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "revclaw_access_tokens_token_type_idx" ON "revclaw_access_tokens"("token_type");

-- CreateIndex
CREATE INDEX "revclaw_access_tokens_expires_at_idx" ON "revclaw_access_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "revclaw_access_tokens_revoked_at_idx" ON "revclaw_access_tokens"("revoked_at");

-- AddForeignKey
ALTER TABLE "revclaw_exchange_codes" ADD CONSTRAINT "revclaw_exchange_codes_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "revclaw_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revclaw_access_tokens" ADD CONSTRAINT "revclaw_access_tokens_installation_id_fkey" FOREIGN KEY ("installation_id") REFERENCES "revclaw_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
