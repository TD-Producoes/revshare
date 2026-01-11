-- CreateEnum
CREATE TYPE "CouponDuration" AS ENUM ('ONCE', 'REPEATING');

-- AlterTable
ALTER TABLE "CouponTemplate" ADD COLUMN     "durationInMonths" INTEGER,
ADD COLUMN     "durationType" "CouponDuration" NOT NULL DEFAULT 'ONCE';
