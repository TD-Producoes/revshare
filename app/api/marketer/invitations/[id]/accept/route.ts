import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await requireAuthUser();
    const { id } = await params;

    const invitation = await prisma.projectInvitation.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        marketerId: true,
        projectId: true,
        commissionPercentSnapshot: true,
        refundWindowDaysSnapshot: true,
        message: true,
        contractId: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.marketerId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation is not pending" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const contract = await tx.contract.upsert({
        where: {
          projectId_userId: { projectId: invitation.projectId, userId: authUser.id },
        },
        create: {
          projectId: invitation.projectId,
          userId: authUser.id,
          commissionPercent: invitation.commissionPercentSnapshot,
          refundWindowDays: invitation.refundWindowDaysSnapshot,
          status: "APPROVED",
          message: invitation.message,
        },
        update: {
          commissionPercent: invitation.commissionPercentSnapshot,
          refundWindowDays: invitation.refundWindowDaysSnapshot,
          status: "APPROVED",
        },
        select: { id: true, status: true },
      });

      const updated = await tx.projectInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", contractId: contract.id },
        select: { id: true, status: true },
      });

      // Ensure conversation exists (accept may happen after old data existed)
      const project = await tx.project.findUnique({
        where: { id: invitation.projectId },
        select: { userId: true },
      });

      if (project) {
        await tx.conversation.upsert({
          where: {
            projectId_founderId_marketerId: {
              projectId: invitation.projectId,
              founderId: project.userId,
              marketerId: authUser.id,
            },
          },
          create: {
            projectId: invitation.projectId,
            founderId: project.userId,
            marketerId: authUser.id,
            createdFrom: "CONTRACT",
          },
          update: {},
        });
      }

      return { contract, invitation: updated };
    });

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
