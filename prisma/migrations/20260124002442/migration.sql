-- CreateTable
CREATE TABLE "AttributionShortLink" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributionShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttributionShortLink_code_key" ON "AttributionShortLink"("code");

-- CreateIndex
CREATE INDEX "AttributionShortLink_projectId_idx" ON "AttributionShortLink"("projectId");

-- CreateIndex
CREATE INDEX "AttributionShortLink_marketerId_idx" ON "AttributionShortLink"("marketerId");

-- CreateIndex
CREATE UNIQUE INDEX "AttributionShortLink_projectId_marketerId_key" ON "AttributionShortLink"("projectId", "marketerId");

-- AddForeignKey
ALTER TABLE "AttributionShortLink" ADD CONSTRAINT "AttributionShortLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
