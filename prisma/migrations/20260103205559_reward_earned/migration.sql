-- CreateEnum
CREATE TYPE "RewardEarnedStatus" AS ENUM ('PENDING_REFUND', 'UNLOCKED', 'CLAIMED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'REWARD_EARNED';
ALTER TYPE "EventType" ADD VALUE 'REWARD_CLAIMED';

-- CreateTable
CREATE TABLE "RewardEarned" (
    "id" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "status" "RewardEarnedStatus" NOT NULL DEFAULT 'UNLOCKED',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unlockedAt" TIMESTAMP(3),
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "RewardEarned_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardCoupon" (
    "id" TEXT NOT NULL,
    "rewardEarnedId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "marketerId" TEXT NOT NULL,
    "stripeCouponId" TEXT,
    "stripePromotionCodeId" TEXT,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardCoupon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RewardEarned_projectId_idx" ON "RewardEarned"("projectId");

-- CreateIndex
CREATE INDEX "RewardEarned_marketerId_idx" ON "RewardEarned"("marketerId");

-- CreateIndex
CREATE INDEX "RewardEarned_projectId_marketerId_idx" ON "RewardEarned"("projectId", "marketerId");

-- CreateIndex
CREATE INDEX "RewardEarned_status_idx" ON "RewardEarned"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RewardEarned_rewardId_marketerId_sequence_key" ON "RewardEarned"("rewardId", "marketerId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "RewardCoupon_rewardEarnedId_key" ON "RewardCoupon"("rewardEarnedId");

-- CreateIndex
CREATE INDEX "RewardCoupon_projectId_idx" ON "RewardCoupon"("projectId");

-- CreateIndex
CREATE INDEX "RewardCoupon_marketerId_idx" ON "RewardCoupon"("marketerId");

-- CreateIndex
CREATE INDEX "RewardCoupon_stripeCouponId_idx" ON "RewardCoupon"("stripeCouponId");

-- CreateIndex
CREATE INDEX "RewardCoupon_stripePromotionCodeId_idx" ON "RewardCoupon"("stripePromotionCodeId");

-- AddForeignKey
ALTER TABLE "RewardEarned" ADD CONSTRAINT "RewardEarned_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEarned" ADD CONSTRAINT "RewardEarned_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardEarned" ADD CONSTRAINT "RewardEarned_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardCoupon" ADD CONSTRAINT "RewardCoupon_rewardEarnedId_fkey" FOREIGN KEY ("rewardEarnedId") REFERENCES "RewardEarned"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardCoupon" ADD CONSTRAINT "RewardCoupon_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardCoupon" ADD CONSTRAINT "RewardCoupon_marketerId_fkey" FOREIGN KEY ("marketerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
