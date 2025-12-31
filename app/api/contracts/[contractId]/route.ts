import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ContractStatus } from "@prisma/client";
import { notificationMessages } from "@/lib/notifications/messages";

const statusInput = z.object({
  creatorId: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
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

  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { id: true, role: true },
  });
  if (!creator || creator.role !== "creator") {
    return NextResponse.json({ error: "Creator not found" }, { status: 404 });
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
    const updatedContract = await tx.contract.update({
      where: { id: contractId },
      data: { status: nextStatus },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    await tx.event.create({
      data: {
        type: nextStatus === "APPROVED" ? "CONTRACT_APPROVED" : "CONTRACT_REJECTED",
        actorId: creator.id,
        projectId: contract.projectId,
        subjectType: "Contract",
        subjectId: contract.id,
        data: {
          projectId: contract.projectId,
          contractStatus: nextStatus,
          marketerId: contract.userId,
        },
      },
    });

    await tx.notification.create({
      data: {
        userId: contract.userId,
        type: nextStatus === "APPROVED" ? "CONTRACT_APPROVED" : "CONTRACT_REJECTED",
        ...(nextStatus === "APPROVED"
          ? notificationMessages.contractApproved(contract.project.name)
          : notificationMessages.contractRejected(contract.project.name)),
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
