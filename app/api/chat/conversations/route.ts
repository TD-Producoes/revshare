import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const authUser = await requireAuthUser();

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ founderId: authUser.id }, { marketerId: authUser.id }],
      },
      orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        projectId: true,
        founderId: true,
        marketerId: true,
        createdFrom: true,
        lastMessageAt: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        founder: { select: { id: true, name: true, email: true } },
        marketer: { select: { id: true, name: true, email: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { body: true, createdAt: true, senderUserId: true },
        },
      },
    });

    return NextResponse.json({ data: conversations }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
