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
      select: { id: true, marketerId: true, status: true },
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

    const updated = await prisma.projectInvitation.update({
      where: { id },
      data: { status: "DECLINED" },
      select: { id: true, status: true },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
