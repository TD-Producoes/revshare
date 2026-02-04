import { NextResponse } from "next/server";
import { Prisma, ProjectInvitationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const authUser = await requireAuthUser();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const statusEnum = ((): ProjectInvitationStatus | null => {
      if (!status) return null;
      const allowed = Object.values(ProjectInvitationStatus);
      return allowed.includes(status as ProjectInvitationStatus)
        ? (status as ProjectInvitationStatus)
        : null;
    })();

    const where: Prisma.ProjectInvitationWhereInput = {
      marketerId: authUser.id,
      ...(statusEnum ? { status: statusEnum } : {}),
    };

    const invitations = await prisma.projectInvitation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        message: true,
        commissionPercentSnapshot: true,
        refundWindowDaysSnapshot: true,
        createdAt: true,
        project: { select: { id: true, name: true } },
        founder: { select: { id: true, name: true, email: true } },
        contractId: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ data: invitations }, { status: 200 });
  } catch (err) {
    return authErrorResponse(err);
  }
}
