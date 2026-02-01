/*
  Warnings:

  - A unique constraint covering the columns `[creatorStripeAccountId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Project_creatorStripeAccountId_key" ON "Project"("creatorStripeAccountId");
