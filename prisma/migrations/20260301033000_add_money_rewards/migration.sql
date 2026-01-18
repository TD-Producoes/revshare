ALTER TYPE "RewardType" ADD VALUE 'MONEY';

ALTER TYPE "RewardEarnedStatus" ADD VALUE 'PAID';

ALTER TABLE "Reward"
ADD COLUMN "rewardAmount" INTEGER,
ADD COLUMN "rewardCurrency" TEXT;

ALTER TABLE "RewardEarned"
ADD COLUMN "rewardAmount" INTEGER,
ADD COLUMN "rewardCurrency" TEXT,
ADD COLUMN "rewardTransferId" TEXT,
ADD COLUMN "paidAt" TIMESTAMP;
