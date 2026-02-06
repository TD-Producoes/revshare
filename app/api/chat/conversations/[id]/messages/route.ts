import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";
import { broadcastNewMessage } from "@/lib/chat/broadcast";

const createSchema = z.object({
  body: z.string().min(1).max(5000),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await requireAuthUser();
    const { id } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, founderId: true, marketerId: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const allowed = authUser.id === conversation.founderId || authUser.id === conversation.marketerId;
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.conversationMessage.findMany({
      where: { conversationId: id },
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

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, founderId: true, marketerId: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const allowed = authUser.id === conversation.founderId || authUser.id === conversation.marketerId;
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const msg = await prisma.$transaction(async (tx) => {
      const created = await tx.conversationMessage.create({
        data: {
          conversationId: id,
          senderUserId: authUser.id,
          body: parsed.data.body,
        },
        select: { id: true, createdAt: true },
      });

      await tx.conversation.update({
        where: { id },
        data: { lastMessageAt: created.createdAt },
      });

      return created;
    });

    // Broadcast in background — never blocks the response
    const sender = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, name: true, role: true },
    });

    if (sender) {
      void broadcastNewMessage(
        {
          id: msg.id,
          conversationId: id,
          body: parsed.data.body,
          createdAt: msg.createdAt.toISOString(),
          sender: { id: sender.id, name: sender.name, role: sender.role },
        },
        [conversation.founderId, conversation.marketerId],
      );
    }

    return NextResponse.json({ data: msg }, { status: 201 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
