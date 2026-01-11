-- AlterEnum
ALTER TYPE "CommissionStatus" ADD VALUE 'AWAITING_REFUND_WINDOW';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "refundWindowDays" INTEGER;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "refundWindowDays" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "refundEligibleAt" TIMESTAMP(3),
ADD COLUMN     "refundWindowDays" INTEGER;
