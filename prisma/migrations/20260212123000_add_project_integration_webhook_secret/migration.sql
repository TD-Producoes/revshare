-- Add missing webhook secret fields for RevenueCat integrations
ALTER TABLE "ProjectIntegration" ADD COLUMN "webhookSecretCipherText" TEXT NOT NULL;
ALTER TABLE "ProjectIntegration" ADD COLUMN "webhookSecretIv" TEXT NOT NULL;
ALTER TABLE "ProjectIntegration" ADD COLUMN "webhookSecretTag" TEXT NOT NULL;
