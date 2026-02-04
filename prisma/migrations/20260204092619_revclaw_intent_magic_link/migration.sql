/*
  Warnings:

  - A unique constraint covering the columns `[approval_token_hash]` on the table `revclaw_intents` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "revclaw_intents" ADD COLUMN     "approval_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "approval_token_hash" TEXT,
ADD COLUMN     "approval_token_used_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "revclaw_intents_approval_token_hash_key" ON "revclaw_intents"("approval_token_hash");
