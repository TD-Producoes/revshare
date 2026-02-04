import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { authErrorResponse, requireAuthUser } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/revclaw/installations/:id/plans
 *
 * Lists plans for an installation (human dashboard).
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const authUser = await requireAuthUser();
    const { id: installationId } = await params;

    const installation = await prisma.revclawInstallation.findUnique({
      where: { id: installationId },
      select: { id: true, userId: true },
    });

    if (!installation) {
      return NextResponse.json({ error: "Installation not found" }, { status: 404 });
    }

    if (installation.userId !== authUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const plans = await prisma.revclawPlan.findMany({
      where: { installationId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        planHash: true,
        createdAt: true,
        executedAt: true,
        executeIntentId: true,
      },
    });

    return NextResponse.json({ data: plans }, { status: 200 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
