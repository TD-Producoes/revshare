-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('USER_SIGNED_UP', 'USER_LOGGED_IN', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'COUPON_TEMPLATE_CREATED', 'COUPON_TEMPLATE_UPDATED', 'COUPON_CLAIMED', 'PURCHASE_CREATED', 'CREATOR_PAYMENT_CREATED', 'CREATOR_PAYMENT_COMPLETED', 'TRANSFER_INITIATED', 'TRANSFER_COMPLETED', 'TRANSFER_FAILED', 'CONTRACT_CREATED', 'CONTRACT_APPROVED', 'CONTRACT_REJECTED', 'NOTIFICATION_SENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SALE', 'COMMISSION_DUE', 'COMMISSION_READY', 'PAYOUT_SENT', 'PAYOUT_FAILED', 'CONTRACT_APPROVED', 'CONTRACT_REJECTED', 'PROJECT_UPDATE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "actorId" TEXT,
    "projectId" TEXT,
    "subjectType" TEXT,
    "subjectId" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "data" JSONB,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_actorId_idx" ON "Event"("actorId");

-- CreateIndex
CREATE INDEX "Event_projectId_idx" ON "Event"("projectId");

-- CreateIndex
CREATE INDEX "Event_subjectType_subjectId_idx" ON "Event"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_eventId_idx" ON "Notification"("eventId");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
