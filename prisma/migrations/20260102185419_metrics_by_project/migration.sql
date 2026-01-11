/*
  Warnings:

  - You are about to drop the column `creatorId` on the `MetricsSnapshot` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,date]` on the table `MetricsSnapshot` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `projectId` to the `MetricsSnapshot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MetricsSnapshot" DROP CONSTRAINT "MetricsSnapshot_creatorId_fkey";

-- DropIndex
DROP INDEX "MetricsSnapshot_creatorId_date_key";

-- DropIndex
DROP INDEX "MetricsSnapshot_creatorId_idx";

-- AlterTable
ALTER TABLE "MetricsSnapshot" DROP COLUMN "creatorId",
ADD COLUMN     "projectId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "MetricsSnapshot_projectId_idx" ON "MetricsSnapshot"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricsSnapshot_projectId_date_key" ON "MetricsSnapshot"("projectId", "date");

-- AddForeignKey
ALTER TABLE "MetricsSnapshot" ADD CONSTRAINT "MetricsSnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
