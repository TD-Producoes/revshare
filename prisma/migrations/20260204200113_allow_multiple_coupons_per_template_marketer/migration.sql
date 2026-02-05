-- DropIndex
DROP INDEX "Coupon_templateId_marketerId_key";

-- CreateIndex
CREATE INDEX "Coupon_templateId_marketerId_idx" ON "Coupon"("templateId", "marketerId");
