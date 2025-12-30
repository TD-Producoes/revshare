-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "platformCommissionPercent" SET DEFAULT 0.2;

-- CreateTable
CREATE TABLE "MetricsSnapshot" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalRevenue" INTEGER NOT NULL,
    "affiliateRevenue" INTEGER NOT NULL,
    "affiliateShareOwed" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "mrr" INTEGER NOT NULL,
    "purchasesCount" INTEGER NOT NULL,
    "affiliatePurchasesCount" INTEGER NOT NULL,
    "directPurchasesCount" INTEGER NOT NULL,
    "uniqueCustomers" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MetricsSnapshot_creatorId_idx" ON "MetricsSnapshot"("creatorId");

-- CreateIndex
CREATE INDEX "MetricsSnapshot_date_idx" ON "MetricsSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MetricsSnapshot_creatorId_date_key" ON "MetricsSnapshot"("creatorId", "date");

-- AddForeignKey
ALTER TABLE "MetricsSnapshot" ADD CONSTRAINT "MetricsSnapshot_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
