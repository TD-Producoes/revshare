-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "creatorPaymentId" TEXT;

-- CreateTable
CREATE TABLE "CreatorPayment" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "amountTotal" INTEGER NOT NULL,
    "marketerTotal" INTEGER NOT NULL,
    "platformFeeTotal" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreatorPayment_creatorId_idx" ON "CreatorPayment"("creatorId");

-- CreateIndex
CREATE INDEX "CreatorPayment_stripeCheckoutSessionId_idx" ON "CreatorPayment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "Purchase_creatorPaymentId_idx" ON "Purchase"("creatorPaymentId");

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_creatorPaymentId_fkey" FOREIGN KEY ("creatorPaymentId") REFERENCES "CreatorPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorPayment" ADD CONSTRAINT "CreatorPayment_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
