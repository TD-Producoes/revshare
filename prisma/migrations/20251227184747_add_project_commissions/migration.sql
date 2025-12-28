/*
  Warnings:

  - You are about to drop the column `commissionPercent` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "commissionPercent",
ADD COLUMN     "marketerCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.2,
ADD COLUMN     "platformCommissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0.05;
