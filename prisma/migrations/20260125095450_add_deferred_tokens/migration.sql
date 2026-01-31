-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "androidPackageName" TEXT,
ADD COLUMN     "androidSha256Fingerprint" TEXT,
ADD COLUMN     "appBundleId" TEXT,
ADD COLUMN     "appScheme" TEXT,
ADD COLUMN     "appTeamId" TEXT;

-- CreateTable
CREATE TABLE "AttributionDeferredToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "AttributionDeferredToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttributionDeferredToken_token_key" ON "AttributionDeferredToken"("token");

-- CreateIndex
CREATE INDEX "AttributionDeferredToken_token_idx" ON "AttributionDeferredToken"("token");

-- CreateIndex
CREATE INDEX "AttributionDeferredToken_projectId_idx" ON "AttributionDeferredToken"("projectId");

-- CreateIndex
CREATE INDEX "AttributionDeferredToken_createdAt_idx" ON "AttributionDeferredToken"("createdAt");

-- AddForeignKey
ALTER TABLE "AttributionDeferredToken" ADD CONSTRAINT "AttributionDeferredToken_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
