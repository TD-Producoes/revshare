-- AlterTable
ALTER TABLE "AttributionInstallFingerprint" ADD COLUMN     "locale" TEXT,
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "userAgent" TEXT;
