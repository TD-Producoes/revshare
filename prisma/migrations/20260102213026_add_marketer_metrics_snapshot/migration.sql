-- CreateTable
CREATE TABLE "MarketerMetricsSnapshot" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "projectId" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "projectRevenueDay" INTEGER NOT NULL DEFAULT 0,
    "affiliateRevenueDay" INTEGER NOT NULL DEFAULT 0,
    "commissionOwedDay" INTEGER NOT NULL DEFAULT 0,
    "purchasesCountDay" INTEGER NOT NULL DEFAULT 0,
    "customersCountDay" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketerMetricsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketerMetricsSnapshot_projectId_idx" ON "MarketerMetricsSnapshot"("projectId");

-- CreateIndex
CREATE INDEX "MarketerMetricsSnapshot_marketerId_idx" ON "MarketerMetricsSnapshot"("marketerId");

-- CreateIndex
CREATE INDEX "MarketerMetricsSnapshot_date_idx" ON "MarketerMetricsSnapshot"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MarketerMetricsSnapshot_projectId_marketerId_date_key" ON "MarketerMetricsSnapshot"("projectId", "marketerId", "date");

-- AddForeignKey
ALTER TABLE "MarketerMetricsSnapshot" ADD CONSTRAINT "MarketerMetricsSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketerMetricsSnapshot" ADD CONSTRAINT "MarketerMetricsSnapshot_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
