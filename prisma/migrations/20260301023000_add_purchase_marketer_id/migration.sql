-- Add marketerId to Purchase for RevenueCat attribution
ALTER TABLE "Purchase" ADD COLUMN "marketerId" TEXT;
CREATE INDEX "Purchase_marketerId_idx" ON "Purchase"("marketerId");
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_marketerId_fkey"
  FOREIGN KEY ("marketerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
