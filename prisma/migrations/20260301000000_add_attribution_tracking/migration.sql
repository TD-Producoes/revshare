-- Add attribution app keys and click tracking
CREATE TABLE "AttributionAppKey" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "AttributionAppKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AttributionAppKey_keyHash_key" ON "AttributionAppKey"("keyHash");
CREATE INDEX "AttributionAppKey_projectId_idx" ON "AttributionAppKey"("projectId");

CREATE TABLE "AttributionClick" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributionClick_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AttributionClick_projectId_marketerId_deviceId_key" ON "AttributionClick"("projectId", "marketerId", "deviceId");
CREATE INDEX "AttributionClick_projectId_idx" ON "AttributionClick"("projectId");
CREATE INDEX "AttributionClick_marketerId_idx" ON "AttributionClick"("marketerId");

ALTER TABLE "AttributionAppKey" ADD CONSTRAINT "AttributionAppKey_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AttributionClick" ADD CONSTRAINT "AttributionClick_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
