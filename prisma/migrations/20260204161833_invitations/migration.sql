-- CreateEnum
CREATE TYPE "ProjectInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED');

-- CreateTable
CREATE TABLE "project_invitations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "founder_id" TEXT NOT NULL,
    "marketer_id" TEXT NOT NULL,
    "status" "ProjectInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT NOT NULL,
    "commission_percent_snapshot" DECIMAL(5,2) NOT NULL,
    "refund_window_days_snapshot" INTEGER NOT NULL,
    "contract_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation_messages" (
    "id" TEXT NOT NULL,
    "invitation_id" TEXT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_invitations_contract_id_key" ON "project_invitations"("contract_id");

-- CreateIndex
CREATE INDEX "project_invitations_project_id_idx" ON "project_invitations"("project_id");

-- CreateIndex
CREATE INDEX "project_invitations_founder_id_idx" ON "project_invitations"("founder_id");

-- CreateIndex
CREATE INDEX "project_invitations_marketer_id_idx" ON "project_invitations"("marketer_id");

-- CreateIndex
CREATE INDEX "project_invitations_status_idx" ON "project_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_project_marketer_status" ON "project_invitations"("project_id", "marketer_id", "status");

-- CreateIndex
CREATE INDEX "invitation_messages_invitation_id_created_at_idx" ON "invitation_messages"("invitation_id", "created_at");

-- CreateIndex
CREATE INDEX "invitation_messages_sender_user_id_idx" ON "invitation_messages"("sender_user_id");

-- AddForeignKey
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_founder_id_fkey" FOREIGN KEY ("founder_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_marketer_id_fkey" FOREIGN KEY ("marketer_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_invitations" ADD CONSTRAINT "project_invitations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_messages" ADD CONSTRAINT "invitation_messages_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "project_invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation_messages" ADD CONSTRAINT "invitation_messages_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
