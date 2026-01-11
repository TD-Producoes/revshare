-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CommissionStatus" ADD VALUE 'REFUNDED';
ALTER TYPE "CommissionStatus" ADD VALUE 'CHARGEBACK';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'PURCHASE_REFUNDED';
ALTER TYPE "EventType" ADD VALUE 'PURCHASE_CHARGEBACK';
ALTER TYPE "EventType" ADD VALUE 'PURCHASE_CHARGEBACK_RESOLVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'REFUND';
ALTER TYPE "NotificationType" ADD VALUE 'CHARGEBACK';

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "chargebackAt" TIMESTAMP(3),
ADD COLUMN     "commissionAmountOriginal" INTEGER,
ADD COLUMN     "disputeId" TEXT,
ADD COLUMN     "disputeStatus" TEXT,
ADD COLUMN     "refundedAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "refundedAt" TIMESTAMP(3);
