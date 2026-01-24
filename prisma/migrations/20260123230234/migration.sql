-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "appStoreUrl" TEXT,
ADD COLUMN     "playStoreUrl" TEXT;

-- CreateTable
CREATE TABLE "AttributionInstallFingerprint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "deviceModel" TEXT NOT NULL,
    "osVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributionInstallFingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttributionInstallFingerprint_projectId_idx" ON "AttributionInstallFingerprint"("projectId");

-- CreateIndex
CREATE INDEX "AttributionInstallFingerprint_marketerId_idx" ON "AttributionInstallFingerprint"("marketerId");

-- CreateIndex
CREATE UNIQUE INDEX "AttributionInstallFingerprint_projectId_ipAddress_deviceMod_key" ON "AttributionInstallFingerprint"("projectId", "ipAddress", "deviceModel", "osVersion");

-- AddForeignKey
ALTER TABLE "AttributionInstallFingerprint" ADD CONSTRAINT "AttributionInstallFingerprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
