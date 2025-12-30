-- CreateTable
CREATE TABLE "CouponTemplate" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "percentOff" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER,
    "productIds" JSONB,
    "stripeCouponId" TEXT NOT NULL,
    "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouponTemplate_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "Coupon" ADD COLUMN "templateId" TEXT;

-- DropIndex
DROP INDEX "Coupon_stripeCouponId_key";

-- Backfill templates for existing coupons
INSERT INTO "CouponTemplate" (
    "id",
    "projectId",
    "name",
    "description",
    "percentOff",
    "stripeCouponId",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    CONCAT('tmpl_', "id"),
    "projectId",
    'Legacy Template',
    'Migrated from existing coupon',
    "percentOff",
    "stripeCouponId",
    "status",
    "claimedAt",
    "claimedAt"
FROM "Coupon";

-- Backfill templateId on coupons
UPDATE "Coupon"
SET "templateId" = CONCAT('tmpl_', "id")
WHERE "templateId" IS NULL;

-- Enforce required templateId
ALTER TABLE "Coupon" ALTER COLUMN "templateId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "CouponTemplate_projectId_idx" ON "CouponTemplate"("projectId");

-- CreateIndex
CREATE INDEX "CouponTemplate_status_idx" ON "CouponTemplate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CouponTemplate_stripeCouponId_key" ON "CouponTemplate"("stripeCouponId");

-- CreateIndex
CREATE INDEX "Coupon_stripeCouponId_idx" ON "Coupon"("stripeCouponId");

-- CreateIndex
CREATE INDEX "Coupon_templateId_idx" ON "Coupon"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_templateId_marketerId_key" ON "Coupon"("templateId", "marketerId");

-- AddForeignKey
ALTER TABLE "CouponTemplate" ADD CONSTRAINT "CouponTemplate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CouponTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
