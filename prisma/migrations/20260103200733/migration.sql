-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RewardMilestoneType" AS ENUM ('NET_REVENUE', 'COMPLETED_SALES', 'ACTIVE_CUSTOMERS');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('DISCOUNT_COUPON', 'FREE_SUBSCRIPTION', 'PLAN_UPGRADE', 'ACCESS_PERK');

-- CreateEnum
CREATE TYPE "RewardFulfillment" AS ENUM ('AUTO_COUPON', 'MANUAL');

-- CreateEnum
CREATE TYPE "RewardEarnLimit" AS ENUM ('ONCE_PER_MARKETER', 'MULTIPLE');

-- CreateEnum
CREATE TYPE "RewardAvailability" AS ENUM ('UNLIMITED', 'FIRST_N');

-- CreateEnum
CREATE TYPE "RewardVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'REWARD_CREATED';
ALTER TYPE "EventType" ADD VALUE 'REWARD_UPDATED';
ALTER TYPE "EventType" ADD VALUE 'REWARD_STATUS_CHANGED';

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "milestoneType" "RewardMilestoneType" NOT NULL DEFAULT 'NET_REVENUE',
    "milestoneValue" INTEGER NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "rewardLabel" TEXT,
    "rewardPercentOff" INTEGER,
    "rewardDurationMonths" INTEGER,
    "fulfillmentType" "RewardFulfillment" NOT NULL DEFAULT 'AUTO_COUPON',
    "earnLimit" "RewardEarnLimit" NOT NULL DEFAULT 'ONCE_PER_MARKETER',
    "availabilityType" "RewardAvailability" NOT NULL DEFAULT 'UNLIMITED',
    "availabilityLimit" INTEGER,
    "visibility" "RewardVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "RewardStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reward_projectId_idx" ON "Reward"("projectId");

-- CreateIndex
CREATE INDEX "Reward_status_idx" ON "Reward"("status");

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
