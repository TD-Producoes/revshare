import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ContractStatus } from "@prisma/client";
import { notificationMessages } from "@/lib/notifications/messages";
import { authErrorResponse, requireAuthUser, requireOwner } from "@/lib/auth";

const statusInput = z.object({
  creatorId: z.string().min(1),
  status: z.enum(["approved", "rejected", "paused"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const parsed = statusInput.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { contractId } = await params;
  const { creatorId, status } = parsed.data;
  try {
    const authUser = await requireAuthUser();
    requireOwner(authUser, creatorId);
  } catch (error) {
    return authErrorResponse(error);
  }

  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "founder") {
    return NextResponse.json({ error: "Founder not found" }, { status: 404 });
  }

  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { project: { select: { userId: true, name: true } } },
  });

  if (!contract || contract.project.userId !== creatorId) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const nextStatus = status.toUpperCase() as ContractStatus;
    const previousStatus = contract.status;

    const updatedContract = await tx.contract.update({
      where: { id: contractId },
      data: { status: nextStatus },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    // Determine event type and notification based on status change
    let eventType: string;
    let notificationType: "CONTRACT_APPROVED" | "CONTRACT_REJECTED" | "SYSTEM";
    let notificationMessage: { title: string; message: string };

    // Check if this is a resume action (from PAUSED to APPROVED)
    const isResume = previousStatus === "PAUSED" && nextStatus === "APPROVED";

    if (nextStatus === "APPROVED" && !isResume) {
      eventType = "CONTRACT_APPROVED";
      notificationType = "CONTRACT_APPROVED";
      notificationMessage = notificationMessages.contractApproved(contract.project.name);
    } else if (isResume) {
      eventType = "CONTRACT_RESUMED";
      notificationType = "SYSTEM";
      notificationMessage = notificationMessages.contractResumed(contract.project.name);
    } else if (nextStatus === "REJECTED") {
      eventType = "CONTRACT_REJECTED";
      notificationType = "CONTRACT_REJECTED";
      notificationMessage = notificationMessages.contractRejected(contract.project.name);
    } else if (nextStatus === "PAUSED") {
      eventType = "CONTRACT_PAUSED";
      notificationType = "SYSTEM";
      notificationMessage = notificationMessages.contractPaused(contract.project.name);
    } else {
      // No event/notification needed for other transitions
      return updatedContract;
    }

    await tx.event.create({
      data: {
        type: eventType as any,
        actorId: creator.id,
        projectId: contract.projectId,
        subjectType: "Contract",
        subjectId: contract.id,
        data: {
          projectId: contract.projectId,
          contractStatus: nextStatus,
          previousStatus: previousStatus,
          marketerId: contract.userId,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: contract.userId,
        type: notificationType,
        ...notificationMessage,
        data: {
          projectId: contract.projectId,
          contractId: contract.id,
        },
      },
    });

    return updatedContract;
  });

  return NextResponse.json({
    data: {
      id: updated.id,
      status: updated.status.toLowerCase(),
      updatedAt: updated.updatedAt,
    },
  });
}
