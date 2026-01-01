-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "about" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "foundationDate" TIMESTAMP(3),
ADD COLUMN     "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "website" TEXT;
