/*
  Warnings:

  - A unique constraint covering the columns `[stripeConnectedAccountId]` on the table `Creator` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Creator" ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingData" JSONB,
ADD COLUMN     "onboardingStatus" TEXT,
ADD COLUMN     "stripeConnectedAccountId" TEXT;

-- AlterTable
ALTER TABLE "Marketer" ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingData" JSONB,
ADD COLUMN     "onboardingStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Creator_stripeConnectedAccountId_key" ON "Creator"("stripeConnectedAccountId");
