import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

const createSchema = z.object({
  body: z.string().min(1).max(5000),
});

/**
 * Deprecated: Invitation messages are no longer the source of truth.
 * We proxy this endpoint to the canonical per-project Conversation.
 */
export async function GET(
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
        projectId: true,
        founderId: true,
        marketerId: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const allowed =
      authUser.id === invitation.founderId || authUser.id === invitation.marketerId;
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conversation = await prisma.conversation.upsert({
      where: {
        projectId_founderId_marketerId: {
          projectId: invitation.projectId,
          founderId: invitation.founderId,
          marketerId: invitation.marketerId,
        },
      },
      create: {
        projectId: invitation.projectId,
        founderId: invitation.founderId,
        marketerId: invitation.marketerId,
        createdFrom: "INVITATION",
      },
      update: {},
      select: { id: true },
    });

    const messages = await prisma.conversationMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
        sender: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ data: messages }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await requireAuthUser();
    const { id } = await params;

    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const invitation = await prisma.projectInvitation.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        founderId: true,
        marketerId: true,
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    const allowed =
      authUser.id === invitation.founderId || authUser.id === invitation.marketerId;
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.upsert({
        where: {
          projectId_founderId_marketerId: {
            projectId: invitation.projectId,
            founderId: invitation.founderId,
            marketerId: invitation.marketerId,
          },
        },
        create: {
          projectId: invitation.projectId,
          founderId: invitation.founderId,
          marketerId: invitation.marketerId,
          createdFrom: "INVITATION",
        },
        update: {},
        select: { id: true },
      });

      const created = await tx.conversationMessage.create({
        data: {
          conversationId: conv.id,
          senderUserId: authUser.id,
          body: parsed.data.body,
        },
        select: { id: true, createdAt: true },
      });

      await tx.conversation.update({
        where: { id: conv.id },
        data: { lastMessageAt: created.createdAt },
      });

      return created;
    });

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
