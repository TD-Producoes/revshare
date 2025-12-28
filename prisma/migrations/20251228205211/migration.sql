-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING_CREATOR_PAYMENT', 'READY_FOR_PAYOUT', 'PAID');

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "commissionStatus" "CommissionStatus" NOT NULL DEFAULT 'PENDING_CREATOR_PAYMENT';
