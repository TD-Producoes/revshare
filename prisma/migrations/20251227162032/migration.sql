/*
  Warnings:

  - You are about to drop the column `stripeAccountId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSecretKeyEncrypted` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSecretKeyIv` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `stripeSecretKeyTag` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `stripeWebhookId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `stripeWebhookSecret` on the `Project` table. All the data in the column will be lost.
  - Added the required column `creatorStripeAccountId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "stripeAccountId",
DROP COLUMN "stripeSecretKeyEncrypted",
DROP COLUMN "stripeSecretKeyIv",
DROP COLUMN "stripeSecretKeyTag",
DROP COLUMN "stripeWebhookId",
DROP COLUMN "stripeWebhookSecret",
ADD COLUMN     "creatorStripeAccountId" TEXT NOT NULL;
