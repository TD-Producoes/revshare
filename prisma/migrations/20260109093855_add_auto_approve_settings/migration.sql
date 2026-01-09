-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "autoApproveApplications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoApproveMatchTerms" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoApproveVerifiedOnly" BOOLEAN NOT NULL DEFAULT true;
