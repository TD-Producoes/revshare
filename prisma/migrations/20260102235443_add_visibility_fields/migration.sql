-- CreateEnum
CREATE TYPE "VisibilityMode" AS ENUM ('PUBLIC', 'GHOST', 'PRIVATE');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "showMrr" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showRevenue" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "showStats" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visibility" "VisibilityMode" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "visibility" "VisibilityMode" NOT NULL DEFAULT 'PUBLIC';
