import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

const createSchema = z.object({
  marketerId: z.string().min(1),
  message: z.string().min(1).max(5000),
  commissionPercent: z.number().min(0).max(100).optional(),
  refundWindowDays: z.number().int().min(0).max(365).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const authUser = await requireAuthUser();
    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        userId: true,
        name: true,
        marketerCommissionPercent: true,
        refundWindowDays: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await prisma.projectInvitation.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        message: true,
        commissionPercentSnapshot: true,
        refundWindowDaysSnapshot: true,
        createdAt: true,
        updatedAt: true,
        marketer: { select: { id: true, name: true, email: true, visibility: true } },
        contractId: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json(
      {
        data: {
          project: {
            id: project.id,
            name: project.name,
            marketerCommissionPercent: project.marketerCommissionPercent,
            refundWindowDays: project.refundWindowDays,
          },
          invitations,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const authUser = await requireAuthUser();
    const { projectId } = await params;

    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        userId: true,
        marketerCommissionPercent: true,
        refundWindowDays: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ensure marketer exists
    const marketer = await prisma.user.findUnique({
      where: { id: parsed.data.marketerId },
      select: { id: true, role: true },
    });

    if (!marketer || marketer.role !== "marketer") {
      return NextResponse.json({ error: "Marketer not found" }, { status: 404 });
    }

    // Default terms from project, allow override
    const commission =
      typeof parsed.data.commissionPercent === "number"
        ? parsed.data.commissionPercent
        : Number(project.marketerCommissionPercent) * 100;

    const refundWindowDays =
      typeof parsed.data.refundWindowDays === "number"
        ? parsed.data.refundWindowDays
        : project.refundWindowDays ?? 30;

    // Do not allow inviting a marketer that already has a contract for this project
    const existingContract = await prisma.contract.findUnique({
      where: {
        projectId_userId: { projectId, userId: parsed.data.marketerId },
      },
      select: { id: true, status: true },
    });

    if (existingContract) {
      return NextResponse.json(
        {
          error: "Marketer already has a contract for this project",
          code: "already_contracted",
        },
        { status: 409 },
      );
    }

    // Prevent duplicate pending invitation
    const existingPending = await prisma.projectInvitation.findFirst({
      where: {
        projectId,
        marketerId: parsed.data.marketerId,
        status: "PENDING",
      },
      select: { id: true },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "Invitation already pending", invitationId: existingPending.id },
        { status: 409 },
      );
    }

    const invitation = await prisma.$transaction(async (tx) => {
      const created = await tx.projectInvitation.create({
        data: {
          projectId,
          founderId: authUser.id,
          marketerId: parsed.data.marketerId,
          status: "PENDING",
          message: parsed.data.message,
          commissionPercentSnapshot: commission / 100,
          refundWindowDaysSnapshot: refundWindowDays,
        },
        select: { id: true, status: true, createdAt: true },
      });

      // Ensure conversation exists and store the initial message there too
      const conversation = await tx.conversation.upsert({
        where: {
          projectId_founderId_marketerId: {
            projectId,
            founderId: authUser.id,
            marketerId: parsed.data.marketerId,
          },
        },
        create: {
          projectId,
          founderId: authUser.id,
          marketerId: parsed.data.marketerId,
          createdFrom: "INVITATION",
          lastMessageAt: new Date(),
        },
        update: {
          lastMessageAt: new Date(),
        },
        select: { id: true },
      });

      await tx.conversationMessage.create({
        data: {
          conversationId: conversation.id,
          senderUserId: authUser.id,
          body: parsed.data.message,
        },
        select: { id: true },
      });

      return created;
    });

    return NextResponse.json({ data: invitation }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
