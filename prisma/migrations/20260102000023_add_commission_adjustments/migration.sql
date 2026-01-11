-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('REFUND', 'CHARGEBACK', 'CHARGEBACK_REVERSAL');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('PENDING', 'APPLIED', 'REVERSED');

-- CreateTable
CREATE TABLE "CommissionAdjustment" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "purchaseId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "reason" "AdjustmentReason" NOT NULL,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommissionAdjustment_creatorId_idx" ON "CommissionAdjustment"("creatorId");

-- CreateIndex
CREATE INDEX "CommissionAdjustment_marketerId_idx" ON "CommissionAdjustment"("marketerId");

-- CreateIndex
CREATE INDEX "CommissionAdjustment_projectId_idx" ON "CommissionAdjustment"("projectId");

-- CreateIndex
CREATE INDEX "CommissionAdjustment_purchaseId_idx" ON "CommissionAdjustment"("purchaseId");

-- CreateIndex
CREATE INDEX "CommissionAdjustment_status_idx" ON "CommissionAdjustment"("status");

-- AddForeignKey
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
