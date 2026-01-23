-- Add RevenueCat integration support
CREATE TYPE "IntegrationProvider" AS ENUM ('REVENUECAT');

CREATE TABLE "ProjectIntegration" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "externalId" TEXT,
    "apiKeyCipherText" TEXT NOT NULL,
    "apiKeyIv" TEXT NOT NULL,
    "apiKeyTag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectIntegration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectIntegration_projectId_provider_key" ON "ProjectIntegration"("projectId", "provider");
CREATE INDEX "ProjectIntegration_projectId_idx" ON "ProjectIntegration"("projectId");

ALTER TABLE "ProjectIntegration" ADD CONSTRAINT "ProjectIntegration_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Purchase" ALTER COLUMN "stripeEventId" DROP NOT NULL;
ALTER TABLE "Purchase" ADD COLUMN "revenueCatEventId" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "revenueCatTransactionId" TEXT;

CREATE UNIQUE INDEX "Purchase_revenueCatEventId_key" ON "Purchase"("revenueCatEventId");
CREATE UNIQUE INDEX "Purchase_revenueCatTransactionId_key" ON "Purchase"("revenueCatTransactionId");
